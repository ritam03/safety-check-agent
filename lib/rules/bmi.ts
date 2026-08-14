/**
 * BMI Safety Rule
 *
 * Medical Authority: WHO Expert Consultation on BMI, 2004
 * Reference: WHO Technical Report Series No. 894
 *
 * BMI Classification:
 *   < 15.0     Severe Thinness     — BLOCK for intense programs
 *   15.0–16.0  Moderate Thinness   — WARN
 *   16.0–18.4  Underweight         — WARN
 *   18.5–24.9  Normal Weight       — PASS
 *   25.0–29.9  Overweight          — PASS
 *   30.0–34.9  Obese Class I       — WARN for high-impact
 *   35.0–39.9  Obese Class II      — BLOCK for high-impact; WARN otherwise
 *   ≥ 40.0     Obese Class III     — BLOCK for all high-intensity
 *
 * BMI at extremes increases musculoskeletal injury risk, metabolic
 * complications, and cardiovascular strain during exercise.
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "WHO Expert Consultation on BMI Classification, Technical Report Series No. 894, 2004";

/** Goals that require high physical load or high-impact movements */
const HIGH_INTENSITY_GOALS = ["weight_loss", "muscle_gain", "endurance"] as const;

export class BMIRule implements Rule {
  name = "BMIRule";
  description = "Evaluates BMI against WHO classification to flag musculoskeletal and cardiovascular risk at extremes";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];
    const heightM = profile.height_cm / 100;
    const bmi = parseFloat((profile.weight_kg / (heightM * heightM)).toFixed(1));
    const isHighIntensityGoal = (HIGH_INTENSITY_GOALS as readonly string[]).includes(profile.fitness_goal);

    // ── Severely underweight ──
    if (bmi < 15) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "MEDICAL_RISK",
        field: "bmi",
        detail: `BMI of ${bmi} indicates Severe Thinness (WHO). Intense exercise programs are contraindicated due to risk of malnutrition-related cardiac complications and muscle wasting.`,
        medical_reference: REFERENCE,
        recommendation: "Seek medical and nutritional evaluation before beginning any exercise program. Focus on caloric rehabilitation first.",
      });
      return conflicts;
    }

    // ── Underweight (15–18.4) ──
    if (bmi < 18.5) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICAL_RISK",
        field: "bmi",
        detail: `BMI of ${bmi} indicates Underweight (WHO). High-energy-expenditure programs may worsen caloric deficit.`,
        medical_reference: REFERENCE,
        recommendation: "If pursuing weight-loss goal, reconsider. Ensure adequate caloric intake to support exercise demands. Low-impact, strength-building programs are preferred.",
      });
    }

    // ── Obese Class III (Morbid Obesity, BMI ≥ 40) ──
    if (bmi >= 40) {
      if (isHighIntensityGoal) {
        conflicts.push({
          rule: this.name,
          severity: "BLOCK",
          category: "MEDICAL_RISK",
          field: "bmi",
          detail: `BMI of ${bmi} indicates Obese Class III (WHO). High-intensity or high-impact exercise programs pose significant cardiovascular and musculoskeletal risk.`,
          medical_reference: REFERENCE,
          recommendation: "Physician clearance required. Begin with supervised, low-impact activity (e.g., aquatic exercise, seated strength training, walking).",
        });
      } else {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "MEDICAL_RISK",
          field: "bmi",
          detail: `BMI of ${bmi} indicates Obese Class III (WHO). Proceed with caution on any exercise program.`,
          medical_reference: REFERENCE,
          recommendation: "Focus on low-impact activities. Monitor cardiovascular response closely. Consult a physician if symptoms arise.",
        });
      }
      return conflicts;
    }

    // ── Obese Class II (BMI 35–39.9) ──
    if (bmi >= 35) {
      if (isHighIntensityGoal) {
        conflicts.push({
          rule: this.name,
          severity: "BLOCK",
          category: "MEDICAL_RISK",
          field: "bmi",
          detail: `BMI of ${bmi} indicates Obese Class II (WHO). High-impact exercise (running, jumping, heavy lifting) poses elevated joint injury and cardiovascular risk.`,
          medical_reference: REFERENCE,
          recommendation: "Avoid high-impact activities. Physician clearance recommended. Opt for swimming, cycling, or low-impact strength training.",
        });
      } else {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "MEDICAL_RISK",
          field: "bmi",
          detail: `BMI of ${bmi} indicates Obese Class II (WHO). Exercise is beneficial but intensity must be carefully managed.`,
          medical_reference: REFERENCE,
          recommendation: "Keep sessions moderate-intensity. Monitor for joint pain, breathing difficulty, or chest discomfort.",
        });
      }
      return conflicts;
    }

    // ── Obese Class I (BMI 30–34.9) ──
    if (bmi >= 30 && isHighIntensityGoal) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICAL_RISK",
        field: "bmi",
        detail: `BMI of ${bmi} indicates Obese Class I (WHO). High-impact exercise may increase joint stress.`,
        medical_reference: REFERENCE,
        recommendation: "Prefer low-impact alternatives for cardio (cycling, swimming over running). Gradually build intensity over 4–6 weeks.",
      });
    }

    return conflicts;
  }
}
