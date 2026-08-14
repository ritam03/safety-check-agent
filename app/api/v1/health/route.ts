/**
 * GET /api/v1/health
 *
 * Health check endpoint for monitoring and deployment verification.
 * Returns service status, rule count, and version.
 */

import { NextResponse } from "next/server";
import { SafetyCheckAgent } from "@/lib/rules/registry";

const agent = new SafetyCheckAgent();

export async function GET() {
  return NextResponse.json({
    status: "ok",
    rules_loaded: agent.ruleCount,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
