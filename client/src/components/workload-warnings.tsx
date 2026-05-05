"use client";

import { useState } from "react";
import type { WorkloadWarning } from "@/lib/types";

export function WorkloadWarnings({
  warnings,
}: {
  warnings: WorkloadWarning[];
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (warnings.length === 0) return null;

  const visible = warnings.filter(
    (w) => !dismissed.has(w.courses.join("|"))
  );
  if (visible.length === 0) return null;

  const dismiss = (w: WorkloadWarning) => {
    setDismissed((prev) => new Set([...prev, w.courses.join("|")]));
  };

  return (
    <div className="space-y-2 mb-4">
      {visible.map((w) => {
        const isDanger = w.severity === "danger";
        return (
          <div
            key={w.courses.join("|")}
            className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-xs ${
              isDanger
                ? "border-sift-red/20 bg-sift-red/5"
                : "border-sift-amber/20 bg-sift-amber/5"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`shrink-0 mt-0.5 ${isDanger ? "text-sift-red" : "text-sift-amber"}`}
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-foreground">
                {w.courses[0]}
              </span>
              {" + "}
              <span className="font-mono text-foreground">
                {w.courses[1]}
              </span>
              <span className="text-muted-foreground ml-1.5">
                — {w.reason}
              </span>
            </div>
            <button
              onClick={() => dismiss(w)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
