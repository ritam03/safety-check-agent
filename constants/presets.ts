/**
 * Preset profiles for the demo UI.
 *
 * Each preset demonstrates a different safety outcome:
 * - Healthy Beginner → SAFE (zero conflicts)
 * - Hypertensive + Aggressive → BLOCK (medical + goal conflict)
 * - Borderline Caution → WARN only (multiple warnings, no blocks)
 * - PARQ Positive → BLOCK (screening failure)
 * - Data Contradictions → BLOCK (integrity failures)
 */

import type { UserProfile } from "@/lib/schema";

export interface Preset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  expectedResult: "SAFE" | "WARN" | "BLOCK";
  profile: UserProfile;
}

export const PRESETS: Preset[] = [
  {
    id: "healthy-beginner",
    name: "Healthy Beginner",
    emoji: "🟢",
    description: "Normal vitals, no conditions",
    expectedResult: "SAFE",
    profile: {
      age: 25,
      sex: "male",
      height_cm: 178,
      weight_kg: 74,
      resting_heart_rate: 72,
      blood_pressure_systolic: 118,
      blood_pressure_diastolic: 76,
      fitness_goal: "general_fitness",
      activity_level: "lightly_active",
      experience_level: "beginner",
      weekly_workout_days: 3,
      self_reported_conditions: ["none"],
      medications: ["none"],
      parq_chest_pain_activity: false,
      parq_chest_pain_rest: false,
      parq_dizziness_or_faint: false,
      parq_bone_joint_problem: false,
      parq_doctor_said_no_exercise: false,
    },
  },
  {
    id: "hypertensive-aggressive",
    name: "Hypertensive + Aggressive Goal",
    emoji: "🔴",
    description: "Stage 2 HT with weight loss",
    expectedResult: "BLOCK",
    profile: {
      age: 48,
      sex: "male",
      height_cm: 172,
      weight_kg: 98,
      resting_heart_rate: 82,
      blood_pressure_systolic: 162,
      blood_pressure_diastolic: 102,
      fitness_goal: "weight_loss",
      activity_level: "sedentary",
      experience_level: "beginner",
      weekly_workout_days: 5,
      self_reported_conditions: ["hypertension"],
      medications: ["none"],
      parq_chest_pain_activity: false,
      parq_chest_pain_rest: false,
      parq_dizziness_or_faint: false,
      parq_bone_joint_problem: false,
      parq_doctor_said_no_exercise: false,
    },
  },
  {
    id: "borderline-caution",
    name: "Borderline — Use with Caution",
    emoji: "🟡",
    description: "Stage 1 HT, beta-blockers, diabetes",
    expectedResult: "WARN",
    profile: {
      age: 55,
      sex: "female",
      height_cm: 162,
      weight_kg: 68,
      resting_heart_rate: 64,
      blood_pressure_systolic: 134,
      blood_pressure_diastolic: 84,
      fitness_goal: "general_fitness",
      activity_level: "lightly_active",
      experience_level: "intermediate",
      weekly_workout_days: 3,
      self_reported_conditions: ["diabetes_type2"],
      medications: ["beta_blockers"],
      parq_chest_pain_activity: false,
      parq_chest_pain_rest: false,
      parq_dizziness_or_faint: false,
      parq_bone_joint_problem: false,
      parq_doctor_said_no_exercise: false,
    },
  },
  {
    id: "parq-positive",
    name: "PAR-Q Positive",
    emoji: "🚨",
    description: "Chest pain + dizziness flagged",
    expectedResult: "BLOCK",
    profile: {
      age: 38,
      sex: "male",
      height_cm: 180,
      weight_kg: 85,
      resting_heart_rate: 76,
      blood_pressure_systolic: 122,
      blood_pressure_diastolic: 78,
      fitness_goal: "endurance",
      activity_level: "moderately_active",
      experience_level: "intermediate",
      weekly_workout_days: 4,
      self_reported_conditions: ["none"],
      medications: ["none"],
      parq_chest_pain_activity: true,
      parq_chest_pain_rest: false,
      parq_dizziness_or_faint: true,
      parq_bone_joint_problem: false,
      parq_doctor_said_no_exercise: false,
    },
  },
  {
    id: "data-contradictions",
    name: "Contradictory Data",
    emoji: "⚠️",
    description: "Impossible BP + inconsistent data",
    expectedResult: "BLOCK",
    profile: {
      age: 22,
      sex: "female",
      height_cm: 158,
      weight_kg: 45,
      resting_heart_rate: 70,
      blood_pressure_systolic: 80,
      blood_pressure_diastolic: 90,
      fitness_goal: "weight_loss",
      activity_level: "sedentary",
      experience_level: "beginner",
      weekly_workout_days: 7,
      self_reported_conditions: ["none"],
      medications: ["none"],
      parq_chest_pain_activity: false,
      parq_chest_pain_rest: false,
      parq_dizziness_or_faint: false,
      parq_bone_joint_problem: false,
      parq_doctor_said_no_exercise: false,
    },
  },
];
