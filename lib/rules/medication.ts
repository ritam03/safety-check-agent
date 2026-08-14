/**
 * Medication Interaction Rule
 *
 * Purpose: Flags medications that alter the body's physiological response
 * to exercise, requiring modified programming or monitoring.
 *
 * Medical Authority:
 * - AHA Scientific Statement: Exercise Standards for Testing and Training (2013)
 * - ACSM's Guidelines for Exercise Testing and Prescription, 11th Ed.
 *
 * Key interactions:
 * - Beta-blockers → suppress HR (handled in HeartRateRule, flagged here for goal context)
 * - Blood thinners → bruising/bleeding risk with impact
 * - Insulin → hypoglycemia risk during exercise
 * - Diuretics → dehydration/electrolyte risk
 * - Statins → myalgia (muscle pain) under high load
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "AHA Scientific Statement: Exercise Standards for Testing and Training (2013)";

export class MedicationRule implements Rule {
  name = "MedicationRule";
  description = "Flags medications that interact with exercise physiology, requiring modified programming";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];
    const meds = profile.medications;

    // Skip if no medications or only "none"
    if (meds.length === 0 || (meds.length === 1 && meds[0] === "none")) {
      return conflicts;
    }

    // ── Blood Thinners (Anticoagulants) ──
    if (meds.includes("blood_thinners")) {
      const isHighImpact = ["weight_loss", "muscle_gain", "endurance"].includes(profile.fitness_goal);
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICATION_INTERACTION",
        field: "medications",
        detail: `Anticoagulant (blood thinner) use increases risk of bruising and internal bleeding from impact or intense exertion.${
          isHighImpact
            ? " Current goal involves activities with elevated impact or strain risk."
            : ""
        }`,
        medical_reference: REFERENCE,
        recommendation: "Avoid contact sports and high-impact activities (box jumps, heavy bag work). Prefer controlled, low-impact exercises. Report any unusual bruising.",
      });
    }

    // ── Insulin ──
    if (meds.includes("insulin")) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICATION_INTERACTION",
        field: "medications",
        detail: `Insulin use requires active blood glucose management during exercise. Physical activity increases insulin sensitivity and glucose uptake, raising hypoglycemia risk.`,
        medical_reference: "ADA Standards of Medical Care in Diabetes (2023)",
        recommendation: "Check blood glucose before, during (for sessions > 30 min), and after exercise. Carry fast-acting glucose source. Consider reducing insulin dose on exercise days (with physician guidance).",
      });
    }

    // ── Diuretics ──
    if (meds.includes("diuretics")) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICATION_INTERACTION",
        field: "medications",
        detail: `Diuretic use increases risk of dehydration and electrolyte imbalance during exercise. Sweat loss combined with diuretic effects can lead to hyponatremia or heat-related illness.`,
        medical_reference: REFERENCE,
        recommendation: "Increase fluid intake before and during exercise. Avoid exercising in extreme heat. Monitor for symptoms of dehydration (dizziness, cramping, dark urine).",
      });
    }

    // ── Statins ──
    if (meds.includes("statins")) {
      const isHighLoad = ["muscle_gain"].includes(profile.fitness_goal);
      if (isHighLoad) {
        conflicts.push({
          rule: this.name,
          severity: "WARN",
          category: "MEDICATION_INTERACTION",
          field: "medications",
          detail: `Statin use combined with muscle gain goal. Statins can cause myalgia (muscle pain) and rhabdomyolysis in rare cases, particularly under heavy resistance training loads.`,
          medical_reference: "ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition",
          recommendation: "Monitor for unusual muscle pain, tenderness, or weakness. Avoid sudden increases in training volume. Report persistent myalgia to physician.",
        });
      }
    }

    return conflicts;
  }
}
