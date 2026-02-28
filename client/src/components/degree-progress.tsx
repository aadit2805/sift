"use client";

import type { RemainingRequirement } from "@/lib/types";

const CATEGORY_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  "CS Lower Division": { bar: "bg-sift-amber", text: "text-sift-amber", bg: "bg-sift-amber/8" },
  "CS Upper Division Required": { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/8" },
  "Senior Capstone": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/8" },
  "CS Track Electives": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/8" },
  "Mathematics": { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/8" },
  "Science": { bar: "bg-chart-5", text: "text-chart-5", bg: "bg-chart-5/8" },
  "Statistics": { bar: "bg-chart-2", text: "text-chart-2", bg: "bg-chart-2/8" },
};

function getColor(category: string) {
  return CATEGORY_COLORS[category] || { bar: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" };
}

export function DegreeProgress({
  remaining,
  totalRequired,
  totalCompleted,
  progressPct,
}: {
  remaining: RemainingRequirement[];
  totalRequired: number;
  totalCompleted: number;
  progressPct: number;
}) {
  return (
    <div className="space-y-5">
      {/* Overall progress */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Degree Progress
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-sift-amber leading-none">
            {progressPct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-sift-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sift-amber/80 to-sift-amber transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground tabular-nums">
          <span>{totalCompleted} cr completed</span>
          <span>{totalRequired - totalCompleted} cr remaining</span>
        </div>
      </div>

      {/* Category breakdowns */}
      <div className="space-y-3">
        {remaining.map((req) => {
          const color = getColor(req.category);
          const pct = req.credits_needed > 0
            ? Math.min(100, Math.round((req.credits_completed / req.credits_needed) * 100))
            : 0;

          return (
            <div key={req.category}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${color.text}`}>
                  {req.category}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                  {req.credits_completed}/{req.credits_needed} cr
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-sift-surface-raised overflow-hidden">
                <div
                  className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {req.completed_courses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {req.completed_courses.map((c) => (
                    <span
                      key={c}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${color.bg} ${color.text}`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {req.remaining_courses.length > 0 && (
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {req.remaining_courses.length} course{req.remaining_courses.length !== 1 ? 's' : ''} remaining
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
