/**
 * Blood Pressure Safety Rule
 *
 * Medical Authority: AHA/ACC 2017 Guideline for the Prevention, Detection,
 * Evaluation, and Management of High Blood Pressure in Adults
 *
 * Reference: Whelton PK, et al. J Am Coll Cardiol. 2018;71(19):e127-e248
 *
 * Classification:
 *   Normal:              Systolic < 120 AND Diastolic < 80
 *   Elevated:            Systolic 120–129 AND Diastolic < 80
 *   Stage 1 Hypertension: Systolic 130–139 OR Diastolic 80–89
 *   Stage 2 Hypertension: Systolic ≥ 140 OR Diastolic ≥ 90
 *   Hypertensive Crisis:  Systolic ≥ 180 OR Diastolic ≥ 120
 *   Hypotension:          Systolic < 90 OR Diastolic < 60
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "AHA/ACC 2017 Guideline for Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults";

export class BloodPressureRule implements Rule {
  name = "BloodPressureRule";
  description = "Evaluates blood pressure against AHA/ACC 2017 classification to identify hypertensive risk during exercise";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];
    const sys = profile.blood_pressure_systolic;
    const dia = profile.blood_pressure_diastolic;
    const bpStr = `${sys}/${dia} mmHg`;

    // Hypertensive Crisis — immediate medical attention required
    if (sys >= 180 || dia >= 120) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "MEDICAL_RISK",
        field: "blood_pressure",
        detail: `Hypertensive Crisis detected (${bpStr}). This is a medical emergency. Exercise is absolutely contraindicated.`,
        medical_reference: REFERENCE,
        recommendation: "Seek immediate medical attention. Do not begin any exercise program.",
      });
      return conflicts; // Don't stack lower-severity BP warnings
    }

    // Stage 2 Hypertension — physician clearance required
    if (sys >= 140 || dia >= 90) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "MEDICAL_RISK",
        field: "blood_pressure",
        detail: `Stage 2 Hypertension detected (${bpStr}). AHA/ACC guidelines require physician clearance before initiating any exercise program at this level.`,
        medical_reference: REFERENCE,
        recommendation: "Obtain physician clearance before starting any exercise program. Avoid vigorous-intensity activity until BP is controlled.",
      });
      return conflicts;
    }

    // Stage 1 Hypertension — proceed with caution
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICAL_RISK",
        field: "blood_pressure",
        detail: `Stage 1 Hypertension detected (${bpStr}). Exercise is generally safe but intensity should be moderated.`,
        medical_reference: REFERENCE,
        recommendation: "Limit high-intensity exercise. Moderate aerobic activity (brisk walking, cycling) is recommended. Monitor BP regularly.",
      });
    }

    // Hypotension — risk of fainting during exercise
    if (sys < 90 || dia < 60) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "MEDICAL_RISK",
        field: "blood_pressure",
        detail: `Hypotension detected (${bpStr}). Low blood pressure increases risk of dizziness and fainting during physical activity.`,
        medical_reference: REFERENCE,
        recommendation: "Consult a physician before starting any exercise program. Ensure adequate hydration and avoid sudden positional changes.",
      });
    }

    return conflicts;
  }
}
