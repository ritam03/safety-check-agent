"use client";

import type { UserProfile } from "@/lib/schema";
import {
  FITNESS_GOALS,
  ACTIVITY_LEVELS,
  EXPERIENCE_LEVELS,
  HEALTH_CONDITIONS,
  MEDICATIONS,
} from "@/lib/schema";

interface Props {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  onSubmit: () => void;
  loading: boolean;
}

/** Readable label from snake_case enum value */
function toLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfileForm({ profile, onChange, onSubmit, loading }: Props) {
  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    onChange({ ...profile, [key]: value });
  }

  function toggleArrayItem(
    key: "self_reported_conditions" | "medications",
    item: string
  ) {
    const arr = profile[key] as string[];
    if (item === "none") {
      updateField(key, ["none"] as UserProfile[typeof key]);
      return;
    }
    let newArr = arr.filter((v) => v !== "none");
    if (newArr.includes(item)) {
      newArr = newArr.filter((v) => v !== item);
    } else {
      newArr.push(item);
    }
    if (newArr.length === 0) newArr = ["none"];
    updateField(key, newArr as UserProfile[typeof key]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Demographics ── */}
      <div className="form-section">
        <div className="form-section-title">Demographics</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              value={profile.age}
              onChange={(e) => updateField("age", Number(e.target.value))}
              min={12}
              max={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="sex">Sex</label>
            <select
              id="sex"
              value={profile.sex}
              onChange={(e) =>
                updateField("sex", e.target.value as UserProfile["sex"])
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="height_cm">Height (cm)</label>
            <input
              id="height_cm"
              type="number"
              value={profile.height_cm}
              onChange={(e) => updateField("height_cm", Number(e.target.value))}
              min={100}
              max={250}
            />
          </div>
          <div className="form-group">
            <label htmlFor="weight_kg">Weight (kg)</label>
            <input
              id="weight_kg"
              type="number"
              value={profile.weight_kg}
              onChange={(e) => updateField("weight_kg", Number(e.target.value))}
              min={20}
              max={300}
            />
          </div>
        </div>
      </div>

      {/* ── Vitals ── */}
      <div className="form-section">
        <div className="form-section-title">Vitals (at rest)</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="resting_heart_rate">Resting Heart Rate (BPM)</label>
            <input
              id="resting_heart_rate"
              type="number"
              value={profile.resting_heart_rate}
              onChange={(e) =>
                updateField("resting_heart_rate", Number(e.target.value))
              }
              min={25}
              max={220}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bp_systolic">Blood Pressure — Systolic</label>
            <input
              id="bp_systolic"
              type="number"
              value={profile.blood_pressure_systolic}
              onChange={(e) =>
                updateField("blood_pressure_systolic", Number(e.target.value))
              }
              min={60}
              max={250}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bp_diastolic">Blood Pressure — Diastolic</label>
            <input
              id="bp_diastolic"
              type="number"
              value={profile.blood_pressure_diastolic}
              onChange={(e) =>
                updateField("blood_pressure_diastolic", Number(e.target.value))
              }
              min={30}
              max={150}
            />
          </div>
        </div>
      </div>

      {/* ── Fitness ── */}
      <div className="form-section">
        <div className="form-section-title">Fitness Profile</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="fitness_goal">Fitness Goal</label>
            <select
              id="fitness_goal"
              value={profile.fitness_goal}
              onChange={(e) =>
                updateField(
                  "fitness_goal",
                  e.target.value as UserProfile["fitness_goal"]
                )
              }
            >
              {FITNESS_GOALS.map((g) => (
                <option key={g} value={g}>
                  {toLabel(g)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="activity_level">Activity Level</label>
            <select
              id="activity_level"
              value={profile.activity_level}
              onChange={(e) =>
                updateField(
                  "activity_level",
                  e.target.value as UserProfile["activity_level"]
                )
              }
            >
              {ACTIVITY_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {toLabel(l)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="experience_level">Experience Level</label>
            <select
              id="experience_level"
              value={profile.experience_level}
              onChange={(e) =>
                updateField(
                  "experience_level",
                  e.target.value as UserProfile["experience_level"]
                )
              }
            >
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {toLabel(l)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="weekly_workout_days">Workout Days / Week</label>
            <input
              id="weekly_workout_days"
              type="number"
              value={profile.weekly_workout_days}
              onChange={(e) =>
                updateField("weekly_workout_days", Number(e.target.value))
              }
              min={0}
              max={7}
            />
          </div>
        </div>
      </div>

      {/* ── Health Conditions ── */}
      <div className="form-section">
        <div className="form-section-title">Health Conditions</div>
        <div className="form-grid">
          <div className="checkbox-grid">
            {HEALTH_CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`checkbox-chip ${
                  (profile.self_reported_conditions as string[]).includes(c)
                    ? c === "none"
                      ? "selected"
                      : "selected warn-chip"
                    : ""
                }`}
                onClick={() => toggleArrayItem("self_reported_conditions", c)}
              >
                {toLabel(c)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Medications ── */}
      <div className="form-section">
        <div className="form-section-title">Medications</div>
        <div className="form-grid">
          <div className="checkbox-grid">
            {MEDICATIONS.map((m) => (
              <button
                key={m}
                type="button"
                className={`checkbox-chip ${
                  (profile.medications as string[]).includes(m)
                    ? m === "none"
                      ? "selected"
                      : "selected warn-chip"
                    : ""
                }`}
                onClick={() => toggleArrayItem("medications", m)}
              >
                {toLabel(m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAR-Q+ Screening ── */}
      <div className="form-section">
        <div className="form-section-title">PAR-Q+ Screening</div>
        <div className="form-grid">
          <div className="parq-grid">
            {[
              {
                key: "parq_chest_pain_activity" as const,
                label: "Do you experience chest pain during physical activity?",
              },
              {
                key: "parq_chest_pain_rest" as const,
                label: "Have you had chest pain at rest in the past month?",
              },
              {
                key: "parq_dizziness_or_faint" as const,
                label:
                  "Have you ever lost balance from dizziness or lost consciousness?",
              },
              {
                key: "parq_bone_joint_problem" as const,
                label:
                  "Do you have a bone/joint problem worsened by exercise?",
              },
              {
                key: "parq_doctor_said_no_exercise" as const,
                label: "Has a doctor ever said you should not exercise?",
              },
            ].map((q) => (
              <label
                key={q.key}
                className={`parq-item ${profile[q.key] ? "active" : ""}`}
              >
                <span className="parq-label">{q.label}</span>
                <div className="toggle">
                  <input
                    type="checkbox"
                    checked={profile[q.key]}
                    onChange={(e) => updateField(q.key, e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        id="submit-check"
        type="submit"
        className="submit-btn"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analyzing Profile...
          </>
        ) : (
          "Run Safety Check"
        )}
      </button>
    </form>
  );
}
