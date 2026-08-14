/**
 * Age-Based Safety Rule
 *
 * Medical Authority: ACSM Pre-participation Health Screening Guidelines
 * Reference: Riebe D, et al. Med Sci Sports Exerc. 2015;47(11):2473-2479
 *
 * Key considerations:
 * - Youth (12–17): Growth plate (epiphyseal plate) vulnerability.
 *   Heavy resistance training can damage growth plates before skeletal maturity.
 * - Older adults (65+): Increased cardiovascular risk, sarcopenia,
 *   balance concerns, and potential for falls.
 * - The combination of advanced age + positive PARQ responses is especially
 *   concerning and warrants medical clearance.
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "ACSM Pre-participation Health Screening Guidelines (Riebe et al., 2015)";

export class AgeRule implements Rule {
  name = "AgeRule";
  description = "Evaluates age-related risks for youth (growth plates) and older adults (cardiovascular, musculoskeletal)";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];
    const { age, fitness_goal, experience_level } = profile;

    // Check for any positive PARQ responses
    const hasPositivePARQ =
      profile.parq_chest_pain_activity ||
      profile.parq_chest_pain_rest ||
      profile.parq_dizziness_or_faint ||
      profile.parq_bone_joint_problem ||
      profile.parq_doctor_said_no_exercise;

    // ── Youth (12–17): Growth plate risk ──
    if (age <= 17) {
      if (fitness_goal === "muscle_gain") {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "MEDICAL_RISK",
          field: "age",
          detail: `User is ${age} years old. Heavy resistance training (muscle gain goal) poses risk to epiphyseal growth plates, which have not yet fused.`,
          medical_reference: "American Academy of Pediatrics Policy Statement on Strength Training by Children and Adolescents, 2008",
          recommendation: "Focus on bodyweight exercises and light resistance with proper form. Avoid maximal lifts (1RM testing). Supervision by a certified trainer is recommended.",
        });
      }

      if (experience_level === "advanced") {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "DATA_INCONSISTENCY",
          field: "age",
          detail: `User is ${age} years old but claims "advanced" experience level. This combination is unusual and may indicate overestimated ability.`,
          medical_reference: REFERENCE,
          recommendation: "Verify experience level. Program conservatively to account for developing musculoskeletal system.",
        });
      }
    }

    // ── Older adults (65+) ──
    if (age >= 65) {
      // PARQ positive + advanced age = BLOCK
      if (hasPositivePARQ) {
        conflicts.push({
          rule: this.name,
          severity: "BLOCK",
          category: "MEDICAL_RISK",
          field: "age",
          detail: `User is ${age} years old with positive PAR-Q screening response(s). The combination of advanced age and health red flags requires physician clearance.`,
          medical_reference: REFERENCE,
          recommendation: "Obtain written physician clearance before beginning any exercise program. A supervised exercise stress test may be recommended.",
        });
        return conflicts;
      }

      // High-intensity goal at 65+
      if (["muscle_gain", "endurance", "weight_loss"].includes(fitness_goal)) {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "MEDICAL_RISK",
          field: "age",
          detail: `User is ${age} years old with a ${fitness_goal.replace("_", " ")} goal. High-intensity programs in older adults carry increased cardiovascular and fall risk.`,
          medical_reference: REFERENCE,
          recommendation: "Modify intensity to moderate level. Include balance training and longer warm-up/cool-down periods. Consider supervised sessions initially.",
        });
      }
    }

    return conflicts;
  }
}
