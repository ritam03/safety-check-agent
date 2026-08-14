"use client";

import type { CheckResult } from "@/lib/types";
import { useState } from "react";

interface Props {
  result: CheckResult;
}

function getStatusClass(result: CheckResult): string {
  if (result.blocks > 0) return "block";
  if (result.warnings > 0) return "warn";
  return "safe";
}

function getStatusIcon(result: CheckResult): string {
  if (result.blocks > 0) return "🚫";
  if (result.warnings > 0) return "⚠️";
  return "✅";
}

function getStatusText(result: CheckResult): string {
  if (result.blocks > 0) return "Unsafe — Session Blocked";
  if (result.warnings > 0) return "Caution — Proceed with Modifications";
  return "Safe — Ready for Session";
}

export default function ResultCard({ result }: Props) {
  const [showJson, setShowJson] = useState(false);
  const status = getStatusClass(result);

  return (
    <div>
      {/* Status Header */}
      <div className={`result-header ${status}`}>
        <div className="result-status-icon">{getStatusIcon(result)}</div>
        <div className="result-status-text">{getStatusText(result)}</div>
        <span className="result-risk-badge">
          Risk: {result.risk_level}
        </span>
      </div>

      {/* Stats */}
      <div className="result-stats">
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--text-primary)" }}>
            {result.total_conflicts}
          </div>
          <div className="stat-label">Total Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--block)" }}>
            {result.blocks}
          </div>
          <div className="stat-label">Blocks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--warn)" }}>
            {result.warnings}
          </div>
          <div className="stat-label">Warnings</div>
        </div>
      </div>

      {/* Conflict Cards */}
      {result.conflicts.length > 0 && (
        <div className="conflicts-list">
          {result.conflicts.map((conflict, i) => (
            <div key={i} className={`conflict-card ${conflict.severity}`}>
              <div className="conflict-top">
                <span className="conflict-severity">{conflict.severity}</span>
                <span className="conflict-category">
                  {conflict.category.replace(/_/g, " ")}
                </span>
                <span className="conflict-rule">{conflict.rule}</span>
              </div>
              <div className="conflict-detail">{conflict.detail}</div>
              <div className="conflict-recommendation">
                💡 {conflict.recommendation}
              </div>
              <div className="conflict-reference">
                📚 {conflict.medical_reference}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meta Info */}
      <div className="meta-info">
        <span className="meta-item">{result.profile_hash}</span>
        <span className="meta-item">
          {new Date(result.checked_at).toLocaleTimeString()}
        </span>
      </div>

      {/* JSON Toggle */}
      <button
        className="json-toggle"
        onClick={() => setShowJson(!showJson)}
        type="button"
      >
        {showJson ? "▾ Hide" : "▸ Show"} Raw JSON Response
      </button>

      {showJson && (
        <div className="json-viewer">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
