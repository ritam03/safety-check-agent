/**
 * Data Integrity Rule
 *
 * Purpose: Catches physiologically impossible or contradictory profile data
 * BEFORE medical rules evaluate the numbers.
 *
 * This is NOT a medical rule — it's a data quality gate. It ensures that
 * the values being passed to medical rules are plausible, so that medical
 * rules can trust their inputs.
 *
 * Catches:
 * - Diastolic BP ≥ Systolic BP (medically impossible)
 * - Experience/activity inconsistencies
 * - Goal contradictions (e.g., underweight user with weight-loss goal)
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "Physiological plausibility bounds (clinical consensus)";

export class DataIntegrityRule implements Rule {
  name = "DataIntegrityRule";
  description = "Validates physiological plausibility and internal consistency of profile data";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];

    // ── Diastolic ≥ Systolic (medically impossible) ──
    if (profile.blood_pressure_diastolic >= profile.blood_pressure_systolic) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "DATA_INCONSISTENCY",
        field: "blood_pressure",
        detail: `Diastolic BP (${profile.blood_pressure_diastolic} mmHg) is greater than or equal to Systolic BP (${profile.blood_pressure_systolic} mmHg). This is physiologically impossible — systolic pressure always exceeds diastolic.`,
        medical_reference: REFERENCE,
        recommendation: "Please verify your blood pressure reading. Systolic (top number) should always be higher than diastolic (bottom number).",
      });
    }

    // ── Male with pregnancy condition (biologically impossible) ──
    if (
      profile.sex === "male" &&
      profile.self_reported_conditions.includes("pregnancy")
    ) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "DATA_INCONSISTENCY",
        field: "self_reported_conditions",
        detail: `User sex is "male" but "pregnancy" is listed as a health condition. This is a data entry error.`,
        medical_reference: REFERENCE,
        recommendation: "Correct either the sex field or remove pregnancy from health conditions.",
      });
    }

    // ── Pulse pressure too narrow ──
    const pulsePressure = profile.blood_pressure_systolic - profile.blood_pressure_diastolic;
    if (
      pulsePressure > 0 &&
      pulsePressure < 15 &&
      profile.blood_pressure_diastolic < profile.blood_pressure_systolic
    ) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "DATA_INCONSISTENCY",
        field: "blood_pressure",
        detail: `Pulse pressure is unusually narrow (${pulsePressure} mmHg). Normal pulse pressure is 30–50 mmHg. This may indicate a data entry error or a cardiovascular condition.`,
        medical_reference: "AHA Guidelines on Pulse Pressure",
        recommendation: "Verify blood pressure values. If accurate, consult a physician as narrow pulse pressure may indicate cardiac output concerns.",
      });
    }

    // ── Beginner claiming 6–7 workout days ──
    if (profile.experience_level === "beginner" && profile.weekly_workout_days >= 6) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "DATA_INCONSISTENCY",
        field: "weekly_workout_days",
        detail: `User identifies as "beginner" but reports ${profile.weekly_workout_days} workout days per week. This combination is inconsistent — beginners typically train 2–4 days/week.`,
        medical_reference: "ACSM Frequency Guidelines for Novice Exercisers",
        recommendation: "Verify experience level. If truly a beginner, reduce frequency to 3–4 days/week to allow adequate recovery.",
      });
    }

    // ── Sedentary claiming 5+ workout days ──
    if (profile.activity_level === "sedentary" && profile.weekly_workout_days >= 5) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "DATA_INCONSISTENCY",
        field: "activity_level",
        detail: `User describes their activity level as "sedentary" but reports ${profile.weekly_workout_days} workout days per week. These are contradictory.`,
        medical_reference: REFERENCE,
        recommendation: "Verify activity level or workout frequency. Consistent 5+ day training is categorised as 'moderately active' or higher.",
      });
    }

    // ── Underweight user with weight-loss goal ──
    const heightM = profile.height_cm / 100;
    const bmi = profile.weight_kg / (heightM * heightM);
    if (bmi < 18.5 && profile.fitness_goal === "weight_loss") {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "DATA_INCONSISTENCY",
        field: "fitness_goal",
        detail: `User has a BMI of ${bmi.toFixed(1)} (underweight) but selected a "weight loss" fitness goal. Pursuing further weight loss at this BMI is medically inadvisable and potentially dangerous.`,
        medical_reference: "WHO BMI Classification, 2004",
        recommendation: "Reconsider the fitness goal. A 'general fitness' or 'muscle gain' goal would be safer and more appropriate.",
      });
    }

    // ── "None" mixed with actual conditions ──
    if (
      profile.self_reported_conditions.includes("none") &&
      profile.self_reported_conditions.length > 1
    ) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "DATA_INCONSISTENCY",
        field: "self_reported_conditions",
        detail: `User selected "none" alongside other health conditions. This is contradictory.`,
        medical_reference: REFERENCE,
        recommendation: "Clarify: either remove 'none' or remove the other conditions.",
      });
    }

    // ── "None" mixed with actual medications ──
    if (
      profile.medications.includes("none") &&
      profile.medications.length > 1
    ) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "DATA_INCONSISTENCY",
        field: "medications",
        detail: `User selected "none" alongside other medications. This is contradictory.`,
        medical_reference: REFERENCE,
        recommendation: "Clarify: either remove 'none' or remove the other medications.",
      });
    }

    return conflicts;
  }
}
