"use client";

import type { RemainingRequirement } from "@/lib/types";

const CATEGORY_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  // CS Core & Electives
  "CS Core": { bar: "bg-sift-amber", text: "text-sift-amber", bg: "bg-sift-amber/8" },
  "Systems Directed Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/8" },
  "Software Directed Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/8" },
  "Intelligence Directed Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/8" },
  "CSCE Tracked Electives": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/8" },
  "CSCE Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/8" },
  // Math & Stats
  "Mathematics": { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/8" },
  "MATH 304": { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/8" },
  "Math/Stat Elective": { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/8" },
  "Statistics": { bar: "bg-chart-2", text: "text-chart-2", bg: "bg-chart-2/8" },
  // Science
  "Required Science": { bar: "bg-chart-5", text: "text-chart-5", bg: "bg-chart-5/8" },
  "Science Electives": { bar: "bg-chart-5", text: "text-chart-5", bg: "bg-chart-5/8" },
  // English, Communications, Engineering
  "English": { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/8" },
  "Communications": { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/8" },
  "Engineering Foundations": { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/8" },
  // University Core Curriculum
  "American History": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/8" },
  "Government": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/8" },
  "Creative Arts": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/8" },
  "Social & Behavioral Sciences": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/8" },
  "Language, Philosophy & Culture": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/8" },
  // Emphasis & General
  "Emphasis Area": { bar: "bg-chart-4", text: "text-chart-4", bg: "bg-chart-4/8" },
  "General Elective": { bar: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted/50" },
};

function getColor(category: string) {
  return CATEGORY_COLORS[category] || { bar: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" };
}

export function DegreeProgress({
  remaining,
  totalRequired,
  totalCompleted,
  totalInProgress = 0,
  progressPct,
}: {
  remaining: RemainingRequirement[];
  totalRequired: number;
  totalCompleted: number;
  totalInProgress?: number;
  progressPct: number;
}) {
  const ipPct = totalRequired > 0 ? Math.round((totalInProgress / totalRequired) * 100) : 0;

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
        <div className="h-2.5 rounded-full bg-sift-surface-raised overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-sift-amber/80 to-sift-amber transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
          {ipPct > 0 && (
            <div
              className="h-full bg-sift-amber/30 transition-all duration-700"
              style={{ width: `${ipPct}%` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground tabular-nums">
          <span>
            {totalCompleted} cr completed
            {totalInProgress > 0 && ` · ${totalInProgress} cr in progress`}
          </span>
          <span>{totalRequired - totalCompleted - totalInProgress} cr remaining</span>
        </div>
      </div>

      {/* Category breakdowns */}
      <div className="space-y-3">
        {remaining.map((req) => {
          const color = getColor(req.category);
          const pct = req.credits_needed > 0
            ? Math.min(100, Math.round((req.credits_completed / req.credits_needed) * 100))
            : 0;
          const catIpPct = req.credits_needed > 0
            ? Math.min(100 - pct, Math.round(((req.credits_in_progress ?? 0) / req.credits_needed) * 100))
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
              <div className="h-1.5 rounded-full bg-sift-surface-raised overflow-hidden flex">
                <div
                  className={`h-full ${color.bar} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
                {catIpPct > 0 && (
                  <div
                    className="h-full bg-sift-amber/30 transition-all duration-500"
                    style={{ width: `${catIpPct}%` }}
                  />
                )}
              </div>

              {req.completed_courses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {req.completed_courses.map((c) => {
                    const equiv = req.equivalent_matches?.[c];
                    return (
                      <span
                        key={c}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${color.bg} ${color.text}`}
                        title={equiv ? `Satisfied by ${equiv}` : undefined}
                      >
                        {equiv ?? c}
                      </span>
                    );
                  })}
                </div>
              )}

              {(req.in_progress_courses?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {req.in_progress_courses.map((c) => {
                    const equiv = req.equivalent_matches?.[c];
                    return (
                      <span
                        key={c}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-sift-amber/10 text-sift-amber"
                        title={equiv ? `Satisfied by ${equiv}` : "In progress"}
                      >
                        {equiv ?? c}
                      </span>
                    );
                  })}
                </div>
              )}

              {req.remaining_courses.length > 0 && (() => {
                const creditsStillNeeded = req.credits_needed - req.credits_completed - (req.credits_in_progress ?? 0);
                if (req.selection_rule === "pick" && creditsStillNeeded <= 0) return null;
                return (
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {req.selection_rule === "pick"
                      ? `choose ${creditsStillNeeded} more credits`
                      : `${req.remaining_courses.length} course${req.remaining_courses.length !== 1 ? 's' : ''} remaining`}
                  </span>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
