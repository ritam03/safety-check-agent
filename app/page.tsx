"use client";

import { useState } from "react";
import type { UserProfile } from "@/lib/schema";
import type { CheckResult } from "@/lib/types";
import type { Preset } from "@/constants/presets";
import PresetSelector from "@/components/PresetSelector";
import ProfileForm from "@/components/ProfileForm";
import ResultCard from "@/components/ResultCard";

/** Field-level validation error returned by the API or client-side checks */
export interface FieldError {
  field: string;
  message: string;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 0,
  sex: "male",
  height_cm: 0,
  weight_kg: 0,
  resting_heart_rate: 0,
  blood_pressure_systolic: 0,
  blood_pressure_diastolic: 0,
  fitness_goal: "general_fitness",
  activity_level: "moderately_active",
  experience_level: "intermediate",
  weekly_workout_days: 0,
  self_reported_conditions: ["none"],
  medications: ["none"],
  parq_chest_pain_activity: false,
  parq_chest_pain_rest: false,
  parq_dizziness_or_faint: false,
  parq_bone_joint_problem: false,
  parq_doctor_said_no_exercise: false,
};

/**
 * Client-side pre-validation — catches obvious empty fields
 * before hitting the API, giving instant feedback.
 */
function validateProfile(profile: UserProfile): FieldError[] {
  const errors: FieldError[] = [];

  if (!profile.age || profile.age < 12)
    errors.push({ field: "age", message: "Age is required (12–100)" });
  if (!profile.height_cm || profile.height_cm < 100)
    errors.push({ field: "height_cm", message: "Height is required (100–250 cm)" });
  if (!profile.weight_kg || profile.weight_kg < 20)
    errors.push({ field: "weight_kg", message: "Weight is required (20–300 kg)" });
  if (!profile.resting_heart_rate)
    errors.push({ field: "resting_heart_rate", message: "Resting heart rate is required" });
  if (!profile.blood_pressure_systolic)
    errors.push({ field: "blood_pressure_systolic", message: "Systolic blood pressure is required" });
  if (!profile.blood_pressure_diastolic)
    errors.push({ field: "blood_pressure_diastolic", message: "Diastolic blood pressure is required" });
  if (!profile.weekly_workout_days && profile.weekly_workout_days !== 0)
    errors.push({ field: "weekly_workout_days", message: "Workout days per week is required" });

  return errors;
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  async function runCheck() {
    // Client-side pre-validation
    const clientErrors = validateProfile(profile);
    if (clientErrors.length > 0) {
      setFieldErrors(clientErrors);
      setError(`Please fix ${clientErrors.length} field${clientErrors.length > 1 ? "s" : ""} before running the safety check`);
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors([]);
    try {
      const res = await fetch("/api/v1/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        // API returned validation errors — show them inline
        if (data.details && Array.isArray(data.details)) {
          setFieldErrors(data.details as FieldError[]);
        }
        setError(data.error || "Validation failed");
        setResult(null);
      } else {
        setResult(data as CheckResult);
        setFieldErrors([]);
      }
    } catch {
      setError("Failed to connect to the safety check API");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePresetSelect(preset: Preset) {
    setActivePreset(preset.id);
    setProfile({ ...preset.profile });
    setResult(null);
    setError(null);
    setFieldErrors([]);
  }

  return (
    <main className="container">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="dot" />
          Deterministic Rule Engine — 8 Medically-Grounded Rules
        </div>
        <h1>Safety &amp; Conflict-Check Agent</h1>
        <p>
          A pre-exercise screening system that validates user profiles against
          published medical guidelines (AHA, ACSM, WHO, PAR-Q+) before workout
          session generation.
        </p>
      </section>

      {/* How it Works */}
      <section className="steps">
        <div className="step glass-card">
          <div className="step-number">1</div>
          <h3>Submit Profile</h3>
          <p>Enter health data, fitness goals, conditions, and medications</p>
        </div>
        <div className="step glass-card">
          <div className="step-number">2</div>
          <h3>Run 8 Safety Rules</h3>
          <p>Every rule fires — no short-circuiting. Complete conflict picture.</p>
        </div>
        <div className="step glass-card">
          <div className="step-number">3</div>
          <h3>Get Decision</h3>
          <p>SAFE, WARN, or BLOCK — with cited medical references</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="main-grid">
        {/* Left: Form */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="icon">📋</span>
            <h2>User Profile</h2>
          </div>

          <PresetSelector
            activePreset={activePreset}
            onSelect={handlePresetSelect}
          />

          <ProfileForm
            profile={profile}
            fieldErrors={fieldErrors}
            onChange={(p) => {
              setProfile(p);
              setActivePreset(null);
              // Clear error for the field being edited
              if (fieldErrors.length > 0) {
                setFieldErrors([]);
                setError(null);
              }
            }}
            onSubmit={runCheck}
            loading={loading}
          />
        </div>

        {/* Right: Results */}
        <div className="glass-card results-panel">
          <div className="section-header">
            <span className="icon">🛡️</span>
            <h2>Safety Check Result</h2>
          </div>

          {error && (
            <div
              className="result-header block"
              style={{ marginBottom: 16 }}
            >
              <div className="result-status-icon">❌</div>
              <div className="result-status-text" style={{ fontSize: "1rem" }}>
                {error}
              </div>
            </div>
          )}

          {result ? (
            <ResultCard result={result} />
          ) : (
            !error && (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <h3>No results yet</h3>
                <p>
                  Select a preset profile or fill in the form, then click
                  &quot;Run Safety Check&quot; to see the analysis.
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
