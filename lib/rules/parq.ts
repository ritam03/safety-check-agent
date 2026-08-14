/**
 * PAR-Q+ (Physical Activity Readiness Questionnaire) Screening Rule
 *
 * Medical Authority: Canadian Society for Exercise Physiology (CSEP)
 * Reference: Warburton DER, et al. Health & Fitness Journal of Canada. 2011;4(2):3-23
 * Updated: PAR-Q+ 2020 Revision
 *
 * The PAR-Q+ is the internationally recognized pre-exercise screening tool.
 * Any "YES" answer to a PAR-Q question requires medical clearance before
 * beginning any exercise program. This is a universal standard in clinical
 * exercise physiology.
 *
 * This is the strictest rule in the system. A single positive response
 * triggers an unconditional BLOCK.
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "Canadian Society for Exercise Physiology PAR-Q+ (2020 Revision)";

interface PARQCheck {
  field: keyof UserProfile;
  label: string;
  detail: string;
}

const PARQ_CHECKS: PARQCheck[] = [
  {
    field: "parq_chest_pain_activity",
    label: "Chest pain during activity",
    detail: "User reports experiencing chest pain during physical activity. This is a cardinal symptom of exercise-induced angina and may indicate coronary artery disease.",
  },
  {
    field: "parq_chest_pain_rest",
    label: "Chest pain at rest",
    detail: "User reports chest pain at rest within the past month. Resting chest pain may indicate unstable angina or other serious cardiac conditions.",
  },
  {
    field: "parq_dizziness_or_faint",
    label: "Dizziness or fainting",
    detail: "User reports a history of losing balance due to dizziness or losing consciousness. This may indicate orthostatic hypotension, arrhythmia, or other cardiovascular conditions.",
  },
  {
    field: "parq_bone_joint_problem",
    label: "Bone or joint problem",
    detail: "User reports a known bone or joint condition that is worsened by physical activity. Exercise programming must account for structural limitations to prevent injury.",
  },
  {
    field: "parq_doctor_said_no_exercise",
    label: "Doctor-restricted exercise",
    detail: "User reports that a doctor has advised them not to exercise. Medical restriction supersedes any fitness programming.",
  },
];

export class PARQRule implements Rule {
  name = "PARQRule";
  description = "PAR-Q+ pre-exercise screening — any positive response requires physician clearance before exercise";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const check of PARQ_CHECKS) {
      if (profile[check.field] === true) {
        conflicts.push({
          rule: this.name,
          severity: "BLOCK",
          category: "CONTRAINDICATION",
          field: check.field,
          detail: `PAR-Q+ Positive: ${check.label}. ${check.detail}`,
          medical_reference: REFERENCE,
          recommendation: "Obtain written physician clearance before beginning any exercise program. The PAR-Q+ protocol requires medical evaluation for all positive responses.",
        });
      }
    }

    return conflicts;
  }
}
