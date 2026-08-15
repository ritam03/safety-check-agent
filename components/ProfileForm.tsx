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

// ──────────────────────────────────────────────
//  Context-Aware Field Filtering
//
//  Downstream fields are filtered based on upstream selections
//  to prevent logically impossible combinations at the UI level.
//  The backend DataIntegrityRule acts as a safety net for direct
//  API callers who bypass this form.
// ──────────────────────────────────────────────

/**
 * Maps health conditions to the medications that are medically
 * relevant for exercise interaction purposes.
 *
 * Only medications that have a clinical reason given the user's
 * conditions are shown. "none" is always available.
 */
const CONDITION_TO_MEDICATIONS: Record<string, string[]> = {
  hypertension:    ["beta_blockers", "diuretics"],
  heart_disease:   ["beta_blockers", "blood_thinners", "statins"],
  diabetes_type1:  ["insulin"],
  diabetes_type2:  ["insulin", "statins"],
  recent_surgery:  ["blood_thinners"],
};

/** Returns health conditions available given the user's sex. */
function getAvailableConditions(sex: string): readonly string[] {
  return HEALTH_CONDITIONS.filter((c) => {
    // Pregnancy is only relevant for female / other
    if (c === "pregnancy" && sex === "male") return false;
    return true;
  });
}

/** Returns medications available given selected health conditions. */
function getAvailableMedications(conditions: readonly string[]): readonly string[] {
  const available = new Set<string>(["none"]);

  for (const condition of conditions) {
    const meds = CONDITION_TO_MEDICATIONS[condition];
    if (meds) meds.forEach((m) => available.add(m));
  }

  return MEDICATIONS.filter((m) => available.has(m));
}

/**
 * Apply cascading constraints after any field change.
 *
 * When an upstream field changes (e.g. sex), downstream fields
 * (conditions, medications) are automatically cleaned to remove
 * any now-invalid selections.
 */
function applyConstraints(p: UserProfile): UserProfile {
  const result = { ...p };

  // ── Sex → Conditions: remove pregnancy for males ──
  if (result.sex === "male") {
    const filtered = (result.self_reported_conditions as string[]).filter(
      (c) => c !== "pregnancy"
    );
    result.self_reported_conditions =
      filtered.length === 0 ? ["none"] : (filtered as typeof result.self_reported_conditions);
  }

  // ── Conditions → Medications: remove meds with no clinical basis ──
  const availableMeds = getAvailableMedications(result.self_reported_conditions);
  const filteredMeds = (result.medications as string[]).filter((m) =>
    availableMeds.includes(m)
  );
  result.medications =
    filteredMeds.length === 0 ? ["none"] : (filteredMeds as typeof result.medications);

  return result;
}

// ──────────────────────────────────────────────

/** Readable label from snake_case enum value */
function toLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfileForm({ profile, onChange, onSubmit, loading }: Props) {
  /**
   * Central update function — applies cascading constraints
   * after every field change before propagating to parent.
   */
  function updateProfile(updates: Partial<UserProfile>) {
    const merged = { ...profile, ...updates };
    onChange(applyConstraints(merged));
  }

  function toggleArrayItem(
    key: "self_reported_conditions" | "medications",
    item: string
  ) {
    const arr = profile[key] as string[];
    if (item === "none") {
      updateProfile({ [key]: ["none"] });
      return;
    }
    let newArr = arr.filter((v) => v !== "none");
    if (newArr.includes(item)) {
      newArr = newArr.filter((v) => v !== item);
    } else {
      newArr.push(item);
    }
    if (newArr.length === 0) newArr = ["none"];
    updateProfile({ [key]: newArr });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  // ── Compute available options based on current profile state ──
  const availableConditions = getAvailableConditions(profile.sex);
  const availableMedications = getAvailableMedications(
    profile.self_reported_conditions
  );

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
              value={profile.age || ""}
              placeholder="e.g. 25"
              onChange={(e) => updateProfile({ age: Number(e.target.value) })}
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
                updateProfile({ sex: e.target.value as UserProfile["sex"] })
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
              value={profile.height_cm || ""}
              placeholder="e.g. 175"
              onChange={(e) =>
                updateProfile({ height_cm: Number(e.target.value) })
              }
              min={100}
              max={250}
            />
          </div>
          <div className="form-group">
            <label htmlFor="weight_kg">Weight (kg)</label>
            <input
              id="weight_kg"
              type="number"
              value={profile.weight_kg || ""}
              placeholder="e.g. 72"
              onChange={(e) =>
                updateProfile({ weight_kg: Number(e.target.value) })
              }
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
              value={profile.resting_heart_rate || ""}
              placeholder="e.g. 72"
              onChange={(e) =>
                updateProfile({
                  resting_heart_rate: Number(e.target.value),
                })
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
              value={profile.blood_pressure_systolic || ""}
              placeholder="e.g. 120"
              onChange={(e) =>
                updateProfile({
                  blood_pressure_systolic: Number(e.target.value),
                })
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
              value={profile.blood_pressure_diastolic || ""}
              placeholder="e.g. 80"
              onChange={(e) =>
                updateProfile({
                  blood_pressure_diastolic: Number(e.target.value),
                })
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
                updateProfile({
                  fitness_goal: e.target.value as UserProfile["fitness_goal"],
                })
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
                updateProfile({
                  activity_level: e.target.value as UserProfile["activity_level"],
                })
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
                updateProfile({
                  experience_level: e.target.value as UserProfile["experience_level"],
                })
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
              value={profile.weekly_workout_days || ""}
              placeholder="e.g. 4"
              onChange={(e) =>
                updateProfile({
                  weekly_workout_days: Number(e.target.value),
                })
              }
              min={0}
              max={7}
            />
          </div>
        </div>
      </div>

      {/* ── Health Conditions (filtered by sex) ── */}
      <div className="form-section">
        <div className="form-section-title">Health Conditions</div>
        <div className="form-grid">
          <div className="checkbox-grid">
            {availableConditions.map((c) => (
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

      {/* ── Medications (filtered by conditions) ── */}
      <div className="form-section">
        <div className="form-section-title">
          Medications
          {availableMedications.length <= 1 && (
            <span className="form-section-hint">
              {" "}— select a health condition to see relevant medications
            </span>
          )}
        </div>
        <div className="form-grid">
          <div className="checkbox-grid">
            {availableMedications.map((m) => (
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
                    onChange={(e) =>
                      updateProfile({ [q.key]: e.target.checked })
                    }
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
