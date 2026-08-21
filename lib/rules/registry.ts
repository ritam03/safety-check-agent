/**
 * Rule Base & Registry
 *
 * Architecture: Registry Pattern + Parallel Execution
 * - Rules are self-contained, stateless modules that implement the Rule interface
 * - The SafetyCheckAgent fires all rules concurrently via Promise.all
 * - No short-circuiting: ALL rules fire so the user gets a complete picture
 * - Adding a new rule = writing one file + registering it here. Zero changes to core.
 *
 * Design Decision: Single-pass evaluation
 * In a medical context, knowing ALL issues is more valuable than knowing just the first one.
 * A user with both hypertension AND a positive PARQ response needs to see both flags.
 */

import type { UserProfile } from "@/lib/schema";
import type { CheckResult, Conflict, Rule, RiskLevel, RuleInfo } from "@/lib/types";

// ── Import all rule modules ──
import { BloodPressureRule } from "./bloodPressure";
import { HeartRateRule } from "./heartRate";
import { BMIRule } from "./bmi";
import { AgeRule } from "./age";
import { PARQRule } from "./parq";
import { DataIntegrityRule } from "./dataIntegrity";
import { GoalConflictRule } from "./goalConflict";
import { MedicationRule } from "./medication";

// ──────────────────────────────────────────────
//  Default rule set — all 8 medically-grounded rules
// ──────────────────────────────────────────────

function createDefaultRules(): Rule[] {
  return [
    new DataIntegrityRule(),   // Run first: catch implausible data before medical rules
    new BloodPressureRule(),
    new HeartRateRule(),
    new BMIRule(),
    new AgeRule(),
    new PARQRule(),
    new GoalConflictRule(),
    new MedicationRule(),
  ];
}

// ──────────────────────────────────────────────
//  Risk Level Computation
// ──────────────────────────────────────────────

function deriveRiskLevel(blocks: number, warnings: number): RiskLevel {
  if (blocks >= 3) return "CRITICAL";
  if (blocks >= 1) return "HIGH";
  if (warnings >= 3) return "MODERATE";
  if (warnings >= 1) return "LOW";
  return "NONE";
}

// ──────────────────────────────────────────────
//  Profile Hashing (audit traceability)
// ──────────────────────────────────────────────

async function hashProfile(profile: UserProfile): Promise<string> {
  const data = JSON.stringify(profile);
  // Use Web Crypto API (available in both Node.js 18+ and browsers)
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hashHex.slice(0, 16)}`; // First 16 hex chars for readability
}

// ──────────────────────────────────────────────
//  Safety Check Agent
// ──────────────────────────────────────────────

export class SafetyCheckAgent {
  private rules: Rule[];

  constructor(rules?: Rule[]) {
    this.rules = rules ?? createDefaultRules();
  }

  /**
   * Evaluate a user profile against all registered rules.
   * Returns a complete CheckResult with all conflicts found.
   */
  async evaluate(profile: UserProfile): Promise<CheckResult> {
    // ── Fire all rules in parallel ──
    // Rules are stateless pure functions with no shared mutable state,
    // so they can safely execute concurrently. This gives O(max rule time)
    // instead of O(sum of all rule times) — critical at scale.
    const [ruleResults, profileHash] = await Promise.all([
      Promise.all(this.rules.map((rule) => Promise.resolve(rule.evaluate(profile)))),
      hashProfile(profile),
    ]);

    // ── Aggregate conflicts from all rules ──
    const allConflicts: Conflict[] = ruleResults.flat();

    // Sort: BLOCK conflicts first, then WARN
    allConflicts.sort((a, b) => {
      if (a.severity === "BLOCK" && b.severity === "WARN") return -1;
      if (a.severity === "WARN" && b.severity === "BLOCK") return 1;
      return 0;
    });

    const blocks = allConflicts.filter((c) => c.severity === "BLOCK").length;
    const warnings = allConflicts.filter((c) => c.severity === "WARN").length;

    return {
      is_safe: blocks === 0,
      risk_level: deriveRiskLevel(blocks, warnings),
      total_conflicts: allConflicts.length,
      blocks,
      warnings,
      conflicts: allConflicts,
      checked_at: new Date().toISOString(),
      profile_hash: profileHash,
    };
  }

  /**
   * List all registered rules (for the /api/v1/rules endpoint).
   */
  listRules(): RuleInfo[] {
    return this.rules.map((r) => ({
      name: r.name,
      description: r.description,
      medical_reference: r.medical_reference,
    }));
  }

  /**
   * Get count of registered rules.
   */
  get ruleCount(): number {
    return this.rules.length;
  }
}
