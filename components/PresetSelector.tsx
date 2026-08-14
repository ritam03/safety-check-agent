"use client";

import { PRESETS, type Preset } from "@/constants/presets";

interface Props {
  activePreset: string | null;
  onSelect: (preset: Preset) => void;
}

export default function PresetSelector({ activePreset, onSelect }: Props) {
  return (
    <div>
      <div className="form-section-title">Quick Demo Profiles</div>
      <div className="preset-grid">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-${preset.id}`}
            className={`preset-btn ${activePreset === preset.id ? "active" : ""}`}
            onClick={() => onSelect(preset)}
            type="button"
          >
            <span className="emoji">{preset.emoji}</span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
