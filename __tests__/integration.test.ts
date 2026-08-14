/**
 * Integration test for the Safety Check Agent.
 *
 * Tests the full pipeline: schema validation → rule evaluation → result aggregation.
 * Uses preset profiles that mirror what will be in the demo UI.
 */

import { describe, it, expect } from "vitest";
import { UserProfileSchema, type UserProfile } from "@/lib/schema";
import { SafetyCheckAgent } from "@/lib/rules/registry";

// ──────────────────────────────────────────────
//  Helper: Create a valid base profile (healthy adult)
// ──────────────────────────────────────────────

function createBaseProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const base: UserProfile = {
    age: 28,
    sex: "male",
    height_cm: 175,
    weight_kg: 72,
    resting_heart_rate: 68,
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 76,
    fitness_goal: "general_fitness",
    activity_level: "moderately_active",
    experience_level: "intermediate",
    weekly_workout_days: 4,
    self_reported_conditions: ["none"],
    medications: ["none"],
    parq_chest_pain_activity: false,
    parq_chest_pain_rest: false,
    parq_dizziness_or_faint: false,
    parq_bone_joint_problem: false,
    parq_doctor_said_no_exercise: false,
  };
  return { ...base, ...overrides };
}

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe("SafetyCheckAgent — Integration", () => {
  const agent = new SafetyCheckAgent();

  it("should pass a healthy adult profile with zero conflicts", async () => {
    const profile = createBaseProfile();
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(true);
    expect(result.risk_level).toBe("NONE");
    expect(result.total_conflicts).toBe(0);
    expect(result.blocks).toBe(0);
    expect(result.warnings).toBe(0);
    expect(result.conflicts).toHaveLength(0);
    expect(result.profile_hash).toMatch(/^sha256:/);
    expect(result.checked_at).toBeTruthy();
  });

  it("should BLOCK a profile with Stage 2 Hypertension", async () => {
    const profile = createBaseProfile({
      blood_pressure_systolic: 160,
      blood_pressure_diastolic: 100,
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(false);
    expect(result.blocks).toBeGreaterThanOrEqual(1);

    const bpConflict = result.conflicts.find(
      (c) => c.rule === "BloodPressureRule" && c.severity === "BLOCK"
    );
    expect(bpConflict).toBeDefined();
    expect(bpConflict!.category).toBe("MEDICAL_RISK");
  });

  it("should BLOCK on any positive PAR-Q response", async () => {
    const profile = createBaseProfile({
      parq_chest_pain_activity: true,
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(false);
    const parqConflict = result.conflicts.find(
      (c) => c.rule === "PARQRule" && c.severity === "BLOCK"
    );
    expect(parqConflict).toBeDefined();
    expect(parqConflict!.category).toBe("CONTRAINDICATION");
  });

  it("should BLOCK when diastolic >= systolic (data integrity)", async () => {
    const profile = createBaseProfile({
      blood_pressure_systolic: 80,
      blood_pressure_diastolic: 90,
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(false);
    const diConflict = result.conflicts.find(
      (c) => c.rule === "DataIntegrityRule" && c.severity === "BLOCK"
    );
    expect(diConflict).toBeDefined();
    expect(diConflict!.category).toBe("DATA_INCONSISTENCY");
  });

  it("should WARN on Stage 1 Hypertension", async () => {
    const profile = createBaseProfile({
      blood_pressure_systolic: 135,
      blood_pressure_diastolic: 85,
    });
    const result = await agent.evaluate(profile);

    // Stage 1 HT is WARN, not BLOCK
    expect(result.is_safe).toBe(true);
    expect(result.warnings).toBeGreaterThanOrEqual(1);

    const bpConflict = result.conflicts.find(
      (c) => c.rule === "BloodPressureRule" && c.severity === "WARN"
    );
    expect(bpConflict).toBeDefined();
  });

  it("should BLOCK pregnancy + weight_loss goal", async () => {
    const profile = createBaseProfile({
      sex: "female",
      self_reported_conditions: ["pregnancy"],
      fitness_goal: "weight_loss",
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(false);
    const goalConflict = result.conflicts.find(
      (c) => c.rule === "GoalConflictRule" && c.severity === "BLOCK"
    );
    expect(goalConflict).toBeDefined();
    expect(goalConflict!.category).toBe("CONTRAINDICATION");
  });

  it("should WARN on beta-blocker usage (medication interaction)", async () => {
    const profile = createBaseProfile({
      medications: ["beta_blockers"],
    });
    const result = await agent.evaluate(profile);

    // Beta-blockers produce WARN, not BLOCK
    expect(result.is_safe).toBe(true);

    const hrConflict = result.conflicts.find(
      (c) => c.rule === "HeartRateRule" && c.category === "MEDICATION_INTERACTION"
    );
    expect(hrConflict).toBeDefined();
  });

  it("should BLOCK recent surgery + any goal", async () => {
    const profile = createBaseProfile({
      self_reported_conditions: ["recent_surgery"],
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(false);
    const conflict = result.conflicts.find(
      (c) => c.rule === "GoalConflictRule" && c.severity === "BLOCK"
    );
    expect(conflict).toBeDefined();
  });

  it("should WARN for youth (age 15) with muscle_gain goal", async () => {
    const profile = createBaseProfile({
      age: 15,
      fitness_goal: "muscle_gain",
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(true); // WARN only, not BLOCK
    const ageConflict = result.conflicts.find(
      (c) => c.rule === "AgeRule" && c.severity === "WARN"
    );
    expect(ageConflict).toBeDefined();
  });

  it("should accumulate multiple conflicts from different rules", async () => {
    const profile = createBaseProfile({
      blood_pressure_systolic: 160,
      blood_pressure_diastolic: 100,
      parq_chest_pain_activity: true,
      self_reported_conditions: ["recent_surgery"],
    });
    const result = await agent.evaluate(profile);

    expect(result.is_safe).toBe(false);
    expect(result.risk_level).toBe("CRITICAL"); // 3+ blocks
    expect(result.blocks).toBeGreaterThanOrEqual(3);

    // Verify conflicts come from different rules
    const ruleNames = new Set(result.conflicts.map((c) => c.rule));
    expect(ruleNames.size).toBeGreaterThanOrEqual(3);
  });

  it("should validate the Zod schema rejects invalid input", () => {
    const invalidProfile = {
      age: 5, // Below minimum of 12
      sex: "alien", // Invalid enum
      height_cm: 50, // Below minimum
    };

    const parseResult = UserProfileSchema.safeParse(invalidProfile);
    expect(parseResult.success).toBe(false);
  });

  it("should assign correct risk levels", async () => {
    // 1 WARN only → LOW
    const lowRisk = createBaseProfile({
      blood_pressure_systolic: 135,
      blood_pressure_diastolic: 85,
    });
    const lowResult = await agent.evaluate(lowRisk);
    expect(lowResult.risk_level).toBe("LOW");

    // 1 BLOCK → HIGH
    const highRisk = createBaseProfile({
      parq_chest_pain_activity: true,
    });
    const highResult = await agent.evaluate(highRisk);
    expect(highResult.risk_level).toBe("HIGH");
  });
});
