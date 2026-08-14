/**
 * Goal ↔ Condition Conflict Rule
 *
 * Purpose: Detects situations where the user's fitness goal conflicts
 * with their self-reported health conditions.
 *
 * Medical Authority: ACSM's Guidelines for Exercise Testing and Prescription, 11th Ed.
 * Specific contraindication references from:
 * - AHA Scientific Statement on Exercise and Cardiovascular Disease
 * - ACOG Guidelines on Physical Activity During Pregnancy
 * - ACS/ACSM Roundtable on Exercise After Cancer Treatment
 *
 * This rule evaluates the COMBINATION of goal + condition — not either in isolation.
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition";

/** Goals considered high-intensity or high-impact */
const HIGH_INTENSITY_GOALS = ["weight_loss", "muscle_gain", "endurance"] as const;

export class GoalConflictRule implements Rule {
  name = "GoalConflictRule";
  description = "Detects conflicts between fitness goals and self-reported health conditions";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];
    const conditions = profile.self_reported_conditions;
    const goal = profile.fitness_goal;
    const isHighIntensity = (HIGH_INTENSITY_GOALS as readonly string[]).includes(goal);

    // ── Heart Disease + high-intensity goal ──
    if (conditions.includes("heart_disease")) {
      if (goal === "endurance" || goal === "muscle_gain") {
        conflicts.push({
          rule: this.name,
          severity: "BLOCK",
          category: "GOAL_MISMATCH",
          field: "fitness_goal",
          detail: `"${goal.replace("_", " ")}" goal is contraindicated for users with self-reported heart disease. Both endurance and heavy resistance training impose significant cardiovascular demand.`,
          medical_reference: "AHA Scientific Statement on Exercise and Cardiovascular Disease (2003)",
          recommendation: "Obtain cardiologist clearance. Consider supervised cardiac rehabilitation program or gentle flexibility/walking program.",
        });
      } else if (isHighIntensity) {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "GOAL_MISMATCH",
          field: "fitness_goal",
          detail: `"${goal.replace("_", " ")}" goal requires caution with self-reported heart disease. Intensity must be carefully controlled.`,
          medical_reference: "AHA Scientific Statement on Exercise and Cardiovascular Disease (2003)",
          recommendation: "Obtain physician clearance. Keep intensity moderate. Avoid Valsalva maneuver and isometric holds.",
        });
      }
    }

    // ── Pregnancy + high-intensity or weight-loss goal ──
    if (conditions.includes("pregnancy")) {
      if (["weight_loss", "muscle_gain", "endurance"].includes(goal)) {
        conflicts.push({
          rule: this.name,
          severity: "BLOCK",
          category: "CONTRAINDICATION",
          field: "fitness_goal",
          detail: `"${goal.replace("_", " ")}" goal is not appropriate during pregnancy. Weight loss is contraindicated, and high-intensity resistance/endurance training poses risk of overexertion, hyperthermia, and reduced fetal blood flow.`,
          medical_reference: "ACOG Committee Opinion No. 804: Physical Activity and Exercise During Pregnancy (2020)",
          recommendation: "Switch to 'general fitness' or 'flexibility' goal. Prenatal exercise should focus on moderate-intensity aerobic and strength maintenance, with obstetrician guidance.",
        });
      }
    }

    // ── Recent Surgery + any exercise ──
    if (conditions.includes("recent_surgery")) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "CONTRAINDICATION",
        field: "fitness_goal",
        detail: `User reports recent surgery (within 3 months). Any exercise program is contraindicated until post-operative clearance is obtained.`,
        medical_reference: REFERENCE,
        recommendation: "Obtain surgeon/physician clearance before beginning any physical activity. Post-operative rehabilitation protocols should be followed.",
      });
    }

    // ── Hypertension (self-reported) + high-intensity goal ──
    if (conditions.includes("hypertension") && isHighIntensity) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "GOAL_MISMATCH",
        field: "fitness_goal",
        detail: `"${goal.replace("_", " ")}" goal combined with self-reported hypertension requires intensity moderation. Heavy resistance training and high-intensity intervals can cause acute BP spikes.`,
        medical_reference: "AHA Scientific Statement: Exercise Standards for Testing and Training (2013)",
        recommendation: "Avoid heavy lifting and max-effort intervals. Focus on moderate aerobic exercise which has anti-hypertensive effects.",
      });
    }

    // ── Osteoporosis + high-impact goals ──
    if (conditions.includes("osteoporosis")) {
      if (["endurance", "weight_loss"].includes(goal)) {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "GOAL_MISMATCH",
          field: "fitness_goal",
          detail: `"${goal.replace("_", " ")}" goal often involves high-impact activities (running, jumping) that increase fracture risk with osteoporosis.`,
          medical_reference: "National Osteoporosis Foundation (NOF) Exercise Recommendations",
          recommendation: "Avoid high-impact activities. Prefer weight-bearing low-impact exercise (walking, elliptical) and resistance training to build bone density.",
        });
      }
    }

    // ── Diabetes (Type 1 or 2) — needs exercise management protocol ──
    if (conditions.includes("diabetes_type1") || conditions.includes("diabetes_type2")) {
      const diabetesType = conditions.includes("diabetes_type1") ? "Type 1" : "Type 2";
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICAL_RISK",
        field: "fitness_goal",
        detail: `User reports ${diabetesType} Diabetes. Exercise is highly beneficial but requires blood glucose management protocol to prevent hypoglycemia during and after exercise.`,
        medical_reference: "ADA Standards of Medical Care in Diabetes (2023): Physical Activity Section",
        recommendation: `Monitor blood glucose before, during, and after exercise. ${
          diabetesType === "Type 1"
            ? "Carry fast-acting glucose source. May need insulin dose adjustment."
            : "Stay hydrated. Watch for signs of hypoglycemia."
        }`,
      });
    }

    // ── Asthma + endurance goal ──
    if (conditions.includes("asthma") && goal === "endurance") {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "GOAL_MISMATCH",
        field: "fitness_goal",
        detail: `Endurance training with asthma increases risk of exercise-induced bronchoconstriction (EIB). Prolonged aerobic activity in cold/dry air is a known trigger.`,
        medical_reference: "ACSM Position Stand: Exercise-Induced Bronchoconstriction",
        recommendation: "Ensure rescue inhaler is accessible during exercise. Prefer warm, humid environments. Include extended warm-up to reduce EIB risk.",
      });
    }

    // ── Chronic Back Pain + muscle gain ──
    if (conditions.includes("chronic_back_pain") && goal === "muscle_gain") {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "GOAL_MISMATCH",
        field: "fitness_goal",
        detail: `Muscle gain goal with chronic back pain requires careful exercise selection. Axial loading exercises (squats, deadlifts, overhead press) may exacerbate back pain.`,
        medical_reference: "ACSM Recommendations for Low Back Pain and Exercise",
        recommendation: "Avoid heavy axial loading. Focus on core stabilization, machine-based resistance training, and exercises that support neutral spine. Consider physiotherapist guidance.",
      });
    }

    return conflicts;
  }
}
