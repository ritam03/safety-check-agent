/**
 * POST /api/v1/check
 *
 * Primary endpoint — the core of the Safety Check Agent.
 *
 * Accepts a UserProfile JSON body, validates it with Zod,
 * runs all 8 safety rules, and returns a CheckResult.
 *
 * The `is_safe` boolean is the primary gate for the session generator.
 * The `conflicts` array provides full detail for the frontend and audit trail.
 */

import { NextRequest, NextResponse } from "next/server";
import { UserProfileSchema } from "@/lib/schema";
import { SafetyCheckAgent } from "@/lib/rules/registry";
import type { ValidationError } from "@/lib/types";

// Singleton agent — rules are stateless, so one instance is sufficient
const agent = new SafetyCheckAgent();

export async function POST(request: NextRequest) {
  try {
    // ── Parse request body ──
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON",
          details: [{ field: "body", message: "Request body must be valid JSON" }],
        } satisfies ValidationError,
        { status: 400 }
      );
    }

    // ── Validate with Zod ──
    const parseResult = UserProfileSchema.safeParse(body);

    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join(".") || "unknown",
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Invalid profile data",
          details,
        } satisfies ValidationError,
        { status: 422 }
      );
    }

    // ── Run safety check ──
    const profile = parseResult.data;
    const result = await agent.evaluate(profile);

    // ── Return result ──
    return NextResponse.json(result, {
      status: result.is_safe ? 200 : 200, // Always 200 — is_safe flag is the signal
      headers: {
        "X-Safety-Check-Result": result.is_safe ? "SAFE" : "UNSAFE",
        "X-Risk-Level": result.risk_level,
      },
    });
  } catch (error) {
    console.error("[SafetyCheckAgent] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: [{ field: "server", message: "An unexpected error occurred during safety check" }],
      } satisfies ValidationError,
      { status: 500 }
    );
  }
}
