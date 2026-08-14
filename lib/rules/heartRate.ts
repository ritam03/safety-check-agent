/**
 * Resting Heart Rate Safety Rule
 *
 * Medical Authority: ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition
 *
 * Normal RHR range: 60–100 BPM (adults)
 * Athletic bradycardia: 40–59 BPM (trained athletes — generally safe)
 * Extreme bradycardia: < 40 BPM (requires medical evaluation)
 * Tachycardia: 100–119 BPM (caution advised)
 * Severe tachycardia: ≥ 120 BPM (exercise contraindicated without clearance)
 *
 * Special consideration: Beta-blocker users have artificially suppressed HR.
 * HR-based exercise intensity (target HR zones) is unreliable for these users.
 * Rate of Perceived Exertion (RPE) must be used instead.
 */

import type { UserProfile } from "@/lib/schema";
import type { Conflict, Rule } from "@/lib/types";

const REFERENCE = "ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition";

export class HeartRateRule implements Rule {
  name = "HeartRateRule";
  description = "Evaluates resting heart rate for bradycardia, tachycardia, and beta-blocker interactions";
  medical_reference = REFERENCE;

  evaluate(profile: UserProfile): Conflict[] {
    const conflicts: Conflict[] = [];
    const rhr = profile.resting_heart_rate;

    // Implausible / Extreme bradycardia (< 30 BPM)
    if (rhr < 30) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "MEDICAL_RISK",
        field: "resting_heart_rate",
        detail: `Resting heart rate of ${rhr} BPM is critically low (extreme bradycardia). This may indicate a serious cardiac condition or a data entry error.`,
        medical_reference: REFERENCE,
        recommendation: "Verify the entered value. If accurate, seek immediate cardiac evaluation before any physical activity.",
      });
      return conflicts;
    }

    // Extreme athletic bradycardia (30–39 BPM)
    if (rhr < 40) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICAL_RISK",
        field: "resting_heart_rate",
        detail: `Resting heart rate of ${rhr} BPM is unusually low. While this can occur in elite athletes, it may also indicate a cardiac conduction abnormality.`,
        medical_reference: REFERENCE,
        recommendation: "If you are not a trained endurance athlete, consider consulting a physician. Proceed with caution and avoid max-effort training.",
      });
    }

    // Severe tachycardia (≥ 120 BPM)
    if (rhr >= 120) {
      conflicts.push({
        rule: this.name,
        severity: "BLOCK",
        category: "MEDICAL_RISK",
        field: "resting_heart_rate",
        detail: `Resting heart rate of ${rhr} BPM indicates severe tachycardia. Exercise is contraindicated until the underlying cause is evaluated.`,
        medical_reference: REFERENCE,
        recommendation: "Seek medical evaluation for the elevated resting heart rate before beginning any exercise program.",
      });
      return conflicts;
    }

    // Tachycardia (100–119 BPM)
    if (rhr >= 100) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICAL_RISK",
        field: "resting_heart_rate",
        detail: `Resting heart rate of ${rhr} BPM is elevated (tachycardia). This may be caused by stress, dehydration, fever, or an underlying condition.`,
        medical_reference: REFERENCE,
        recommendation: "Limit exercise to low-to-moderate intensity. If tachycardia persists at rest, consult a physician.",
      });
    }

    // Beta-blocker interaction — HR zones are unreliable
    if (profile.medications.includes("beta_blockers")) {
      conflicts.push({
        rule: this.name,
        severity: "WARN",
        category: "MEDICATION_INTERACTION",
        field: "resting_heart_rate",
        detail: `Beta-blocker use detected. Heart rate is pharmacologically suppressed, making HR-based exercise intensity zones (e.g., target heart rate) unreliable.`,
        medical_reference: "AHA Scientific Statement on Exercise Standards for Testing and Training, 2013",
        recommendation: "Use Rate of Perceived Exertion (RPE scale 1–10) instead of heart rate to gauge exercise intensity.",
      });
    }

    return conflicts;
  }
}
