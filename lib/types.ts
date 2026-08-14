/**
 * Core types for the Safety Check Agent.
 *
 * These types define the contract between the rule engine and
 * all consumers (API routes, frontend components).
 */

import type { UserProfile } from "./schema";

// ──────────────────────────────────────────────
//  Severity & Categories
// ──────────────────────────────────────────────

/** BLOCK = unsafe, halt pipeline. WARN = borderline, proceed with caution. */
export type Severity = "BLOCK" | "WARN";

/** Classification of what kind of problem was detected. */
export type ConflictCategory =
  | "DATA_INCONSISTENCY"
  | "MEDICAL_RISK"
  | "GOAL_MISMATCH"
  | "CONTRAINDICATION"
  | "MEDICATION_INTERACTION";

/** Overall risk assessment. */
export type RiskLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

// ──────────────────────────────────────────────
//  Conflict — a single violation detected by a rule
// ──────────────────────────────────────────────

export interface Conflict {
  /** Rule that fired (e.g., "BloodPressureRule") */
  rule: string;
  /** Severity of this specific conflict */
  severity: Severity;
  /** Category of conflict */
  category: ConflictCategory;
  /** Profile field(s) involved */
  field: string;
  /** Human-readable description of the issue */
  detail: string;
  /** Published medical guideline backing this rule */
  medical_reference: string;
  /** Actionable recommendation for the user */
  recommendation: string;
}

// ──────────────────────────────────────────────
//  CheckResult — aggregated output of all rules
// ──────────────────────────────────────────────

export interface CheckResult {
  /** Primary boolean gate: false if any BLOCK-level conflict exists */
  is_safe: boolean;
  /** Computed risk level based on conflict counts and severities */
  risk_level: RiskLevel;
  /** Total number of conflicts found */
  total_conflicts: number;
  /** Count of BLOCK-level conflicts */
  blocks: number;
  /** Count of WARN-level conflicts */
  warnings: number;
  /** All detected conflicts, ordered by severity (BLOCK first) */
  conflicts: Conflict[];
  /** ISO 8601 timestamp of when this check was performed */
  checked_at: string;
  /** SHA-256 hash of the input profile for audit traceability */
  profile_hash: string;
}

// ──────────────────────────────────────────────
//  Rule — interface every rule module must implement
// ──────────────────────────────────────────────

export interface Rule {
  /** Unique identifier (e.g., "BloodPressureRule") */
  name: string;
  /** What this rule checks */
  description: string;
  /** Published medical guideline backing this rule */
  medical_reference: string;
  /** Evaluate the profile and return zero or more conflicts */
  evaluate(profile: UserProfile): Conflict[];
}

// ──────────────────────────────────────────────
//  API response types
// ──────────────────────────────────────────────

export interface RuleInfo {
  name: string;
  description: string;
  medical_reference: string;
}

export interface HealthResponse {
  status: "ok";
  rules_loaded: number;
  version: string;
  timestamp: string;
}

export interface ValidationError {
  error: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}
