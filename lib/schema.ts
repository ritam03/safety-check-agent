/**
 * User Profile Schema — Zod v4 validation
 *
 * Schema design follows the PAR-Q+ (Physical Activity Readiness Questionnaire Plus)
 * framework used by certified fitness professionals for pre-exercise screening.
 *
 * Every field is justified by its role in at least one safety rule.
 * Fields are grouped logically: Demographics → Vitals → Fitness → Health → Screening
 */

import { z } from "zod";

// ──────────────────────────────────────────────
//  Enum definitions (used across schema + rules)
// ──────────────────────────────────────────────

export const SEX_OPTIONS = ["male", "female", "other"] as const;

export const FITNESS_GOALS = [
  "weight_loss",
  "muscle_gain",
  "endurance",
  "flexibility",
  "general_fitness",
] as const;

export const ACTIVITY_LEVELS = [
  "sedentary",         // < 30 min/week
  "lightly_active",    // 30–149 min/week
  "moderately_active", // 150–299 min/week (WHO recommended minimum)
  "very_active",       // ≥ 300 min/week
] as const;

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const HEALTH_CONDITIONS = [
  "none",
  "hypertension",
  "heart_disease",
  "diabetes_type1",
  "diabetes_type2",
  "asthma",
  "osteoporosis",
  "osteoarthritis",
  "pregnancy",
  "recent_surgery",     // Within last 3 months
  "chronic_back_pain",
] as const;

export const MEDICATIONS = [
  "none",
  "beta_blockers",     // Suppress HR → invalidates HR-based intensity zones
  "blood_thinners",    // Bruising/injury risk with high-impact exercise
  "insulin",           // Blood sugar management required during exercise
  "diuretics",         // Dehydration risk during high-sweat activity
  "statins",           // Muscle pain risk under high load
] as const;

// ──────────────────────────────────────────────
//  Core User Profile Schema
// ──────────────────────────────────────────────

export const UserProfileSchema = z.object({
  // ── Demographics ──
  age: z
    .number({ error: "Age is required and must be a number" })
    .int({ message: "Age must be a whole number" })
    .min(12, { message: "Minimum age for exercise programs is 12 years" })
    .max(100, { message: "Age must be 100 or below" }),

  sex: z.enum(SEX_OPTIONS),

  height_cm: z
    .number({ error: "Height is required and must be a number" })
    .min(100, { message: "Height must be at least 100 cm" })
    .max(250, { message: "Height must be 250 cm or below" }),

  weight_kg: z
    .number({ error: "Weight is required and must be a number" })
    .min(20, { message: "Weight must be at least 20 kg" })
    .max(300, { message: "Weight must be 300 kg or below" }),

  // ── Vitals (self-reported, at rest) ──
  resting_heart_rate: z
    .number({ error: "Resting heart rate is required" })
    .int({ message: "Heart rate must be a whole number" })
    .min(25, { message: "Heart rate below 25 BPM is not physiologically viable" })
    .max(220, { message: "Heart rate above 220 BPM is not physiologically viable" }),

  blood_pressure_systolic: z
    .number({ error: "Systolic blood pressure is required" })
    .int({ message: "Blood pressure must be a whole number" })
    .min(60, { message: "Systolic BP below 60 mmHg is critically low" })
    .max(250, { message: "Systolic BP above 250 mmHg is critically high" }),

  blood_pressure_diastolic: z
    .number({ error: "Diastolic blood pressure is required" })
    .int({ message: "Blood pressure must be a whole number" })
    .min(30, { message: "Diastolic BP below 30 mmHg is critically low" })
    .max(150, { message: "Diastolic BP above 150 mmHg is critically high" }),

  // ── Fitness Profile ──
  fitness_goal: z.enum(FITNESS_GOALS),

  activity_level: z.enum(ACTIVITY_LEVELS),

  experience_level: z.enum(EXPERIENCE_LEVELS),

  weekly_workout_days: z
    .number({ error: "Weekly workout days is required" })
    .int({ message: "Must be a whole number" })
    .min(0, { message: "Cannot be negative" })
    .max(7, { message: "Maximum 7 days per week" }),

  // ── Health Conditions (PAR-Q+ inspired) ──
  self_reported_conditions: z
    .array(z.enum(HEALTH_CONDITIONS))
    .min(1, { message: "Select at least one option (choose 'none' if no conditions)" })
    .default(["none"]),

  // ── Medications ──
  medications: z
    .array(z.enum(MEDICATIONS))
    .min(1, { message: "Select at least one option (choose 'none' if no medications)" })
    .default(["none"]),

  // ── PAR-Q+ Screening Questions ──
  // Based on Canadian Society for Exercise Physiology PAR-Q+ 2020
  parq_chest_pain_activity: z.boolean().default(false),
  parq_chest_pain_rest: z.boolean().default(false),
  parq_dizziness_or_faint: z.boolean().default(false),
  parq_bone_joint_problem: z.boolean().default(false),
  parq_doctor_said_no_exercise: z.boolean().default(false),
});

// ──────────────────────────────────────────────
//  Derived type from schema
// ──────────────────────────────────────────────

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ──────────────────────────────────────────────
//  Utility: Compute derived health metrics
// ──────────────────────────────────────────────

export interface DerivedMetrics {
  bmi: number;
  bmi_category: string;
  bp_category: string;
  rhr_category: string;
}

/**
 * Compute BMI and classify vitals according to medical guidelines.
 *
 * BMI: WHO Expert Consultation, 2004
 * BP:  AHA/ACC 2017 Guideline for High Blood Pressure
 * RHR: ACSM Guidelines for Exercise Testing & Prescription, 11th Ed.
 */
export function computeDerivedMetrics(profile: UserProfile): DerivedMetrics {
  const heightM = profile.height_cm / 100;
  const bmi = parseFloat((profile.weight_kg / (heightM * heightM)).toFixed(1));

  // WHO BMI Classification
  let bmi_category: string;
  if (bmi < 15) bmi_category = "Severe Thinness";
  else if (bmi < 16) bmi_category = "Moderate Thinness";
  else if (bmi < 18.5) bmi_category = "Underweight";
  else if (bmi < 25) bmi_category = "Normal Weight";
  else if (bmi < 30) bmi_category = "Overweight";
  else if (bmi < 35) bmi_category = "Obese Class I";
  else if (bmi < 40) bmi_category = "Obese Class II";
  else bmi_category = "Obese Class III (Morbid)";

  // AHA 2017 Blood Pressure Classification
  const sys = profile.blood_pressure_systolic;
  const dia = profile.blood_pressure_diastolic;
  let bp_category: string;
  if (sys < 90 || dia < 60) bp_category = "Hypotension";
  else if (sys < 120 && dia < 80) bp_category = "Normal";
  else if (sys >= 120 && sys <= 129 && dia < 80) bp_category = "Elevated";
  else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89))
    bp_category = "Stage 1 Hypertension";
  else if ((sys >= 140 && sys < 180) || (dia >= 90 && dia < 120))
    bp_category = "Stage 2 Hypertension";
  else if (sys >= 180 || dia >= 120) bp_category = "Hypertensive Crisis";
  else bp_category = "Normal";

  // ACSM Resting Heart Rate Classification
  const rhr = profile.resting_heart_rate;
  let rhr_category: string;
  if (rhr < 30) rhr_category = "Implausible Bradycardia";
  else if (rhr < 40) rhr_category = "Extreme Athletic Bradycardia";
  else if (rhr < 60) rhr_category = "Athletic / Low Normal";
  else if (rhr <= 100) rhr_category = "Normal";
  else if (rhr < 120) rhr_category = "Tachycardia";
  else rhr_category = "Severe Tachycardia";

  return { bmi, bmi_category, bp_category, rhr_category };
}
