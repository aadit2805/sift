"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface WeightConfig {
  key: string;
  label: string;
  description: string;
  color: string;
}

const WEIGHTS: WeightConfig[] = [
  {
    key: "weight_gpa",
    label: "GPA",
    description: "Prioritize courses with higher average grades",
    color: "text-sift-green",
  },
  {
    key: "weight_professor",
    label: "Professor",
    description: "Prioritize highly-rated professors on RMP",
    color: "text-sift-blue",
  },
  {
    key: "weight_difficulty",
    label: "Difficulty",
    description: "Penalize courses with high difficulty ratings",
    color: "text-sift-red",
  },
  {
    key: "weight_requirement",
    label: "Requirement",
    description: "Prioritize core requirements over electives",
    color: "text-sift-amber",
  },
];

export function WeightControls({
  weights,
  onWeightsChange,
}: {
  weights: Record<string, number>;
  onWeightsChange: (weights: Record<string, number>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <line x1="4" x2="4" y1="21" y2="14" />
            <line x1="4" x2="4" y1="10" y2="3" />
            <line x1="12" x2="12" y1="21" y2="12" />
            <line x1="12" x2="12" y1="8" y2="3" />
            <line x1="20" x2="20" y1="21" y2="16" />
            <line x1="20" x2="20" y1="12" y2="3" />
            <line x1="2" x2="6" y1="14" y2="14" />
            <line x1="10" x2="14" y1="8" y2="8" />
            <line x1="18" x2="22" y1="16" y2="16" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Scoring Weights
          </span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/50">
            {WEIGHTS.map((w) => (
              <div key={w.key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className={`text-sm font-medium ${w.color}`}>
                      {w.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {w.description}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground ml-3">
                    {((weights[w.key] || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(weights[w.key] || 0) * 100]}
                  onValueChange={(v) =>
                    onWeightsChange({ ...weights, [w.key]: v[0] / 100 })
                  }
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
