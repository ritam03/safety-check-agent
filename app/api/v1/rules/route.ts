/**
 * GET /api/v1/rules
 *
 * Meta-endpoint — lists all registered safety rules with their
 * descriptions and medical references.
 *
 * This serves two purposes:
 * 1. Demo UI "How it works" section can fetch and display all active rules
 * 2. Any downstream service can introspect what checks are being applied
 *
 * This is a design signal: the system can explain itself.
 */

import { NextResponse } from "next/server";
import { SafetyCheckAgent } from "@/lib/rules/registry";

const agent = new SafetyCheckAgent();

export async function GET() {
  const rules = agent.listRules();

  return NextResponse.json({
    total_rules: rules.length,
    rules,
  });
}
