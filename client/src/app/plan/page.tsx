"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getRemainingRequirements } from "@/lib/api";
import type { RemainingRequirement, DegreeProgress } from "@/lib/types";

function getCompletedCourses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("sift_completed_courses");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const CATEGORY_COLORS: Record<
  string,
  { bar: string; text: string; bg: string; border: string }
> = {
  "CS Lower Division": {
    bar: "bg-sift-amber",
    text: "text-sift-amber",
    bg: "bg-sift-amber/10",
    border: "border-sift-amber/20",
  },
  "CS Upper Division Required": {
    bar: "bg-sift-blue",
    text: "text-sift-blue",
    bg: "bg-sift-blue/10",
    border: "border-sift-blue/20",
  },
  "Senior Capstone": {
    bar: "bg-sift-purple",
    text: "text-sift-purple",
    bg: "bg-sift-purple/10",
    border: "border-sift-purple/20",
  },
  "CS Track Electives": {
    bar: "bg-sift-green",
    text: "text-sift-green",
    bg: "bg-sift-green/10",
    border: "border-sift-green/20",
  },
  Mathematics: {
    bar: "bg-chart-3",
    text: "text-chart-3",
    bg: "bg-chart-3/10",
    border: "border-chart-3/20",
  },
  Science: {
    bar: "bg-chart-5",
    text: "text-chart-5",
    bg: "bg-chart-5/10",
    border: "border-chart-5/20",
  },
  Statistics: {
    bar: "bg-chart-2",
    text: "text-chart-2",
    bg: "bg-chart-2/10",
    border: "border-chart-2/20",
  },
};

function getColor(category: string) {
  return (
    CATEGORY_COLORS[category] || {
      bar: "bg-muted-foreground",
      text: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    }
  );
}

const TYPE_LABELS: Record<string, string> = {
  core: "Core Requirement",
  elective: "Elective",
  lab: "Lab Requirement",
  math: "Mathematics",
  science: "Science",
  capstone: "Capstone",
};

export default function PlanPage() {
  const [remaining, setRemaining] = useState<RemainingRequirement[]>([]);
  const [totalRequired, setTotalRequired] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDegreeProgress() {
      setLoading(true);
      const completedCourses = getCompletedCourses();
      const result = await getRemainingRequirements("CS", completedCourses);

      if (cancelled) return;

      if (result.data) {
        setRemaining(result.data.remaining);
        setTotalRequired(result.data.total_credits_required);
        setTotalCompleted(result.data.total_credits_completed);
        setProgressPct(result.data.progress_pct);
      }

      setLoading(false);
    }

    loadDegreeProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const satisfiedCount = remaining.filter((r) => r.is_satisfied).length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground mb-1">
            Degree Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your progress toward a B.S. in Computer Science.
          </p>
        </div>

        {/* Overall progress card */}
        {loading ? (
          <div className="rounded-lg border border-border bg-card shadow-sm p-6 mb-6 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
              <div className="h-12 w-24 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-48 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full" />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-5xl font-bold tabular-nums text-sift-amber leading-none">
                  {progressPct}
                </span>
                <span className="font-mono text-lg text-sift-amber/60">%</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                  <span className="text-muted-foreground">
                    <span className="font-mono text-sift-green tabular-nums">
                      {totalCompleted}
                    </span>{" "}
                    credits completed
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-mono text-foreground tabular-nums">
                      {totalRequired - totalCompleted}
                    </span>{" "}
                    credits remaining
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-mono text-foreground tabular-nums">
                      {totalRequired}
                    </span>{" "}
                    total required
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-mono text-sift-green tabular-nums">
                      {satisfiedCount}
                    </span>
                    /{remaining.length} categories complete
                  </span>
                </div>
              </div>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sift-amber/80 to-sift-amber transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground tabular-nums">
              <span>0 cr</span>
              <span>{totalRequired} cr</span>
            </div>
          </div>
        )}

        {/* Requirement categories */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card shadow-sm p-5 animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="h-1.5 bg-muted rounded-full mb-4" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-6 w-20 bg-muted rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {remaining.map((req, i) => {
              const color = getColor(req.category);
              const pct =
                req.credits_needed > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (req.credits_completed / req.credits_needed) * 100
                      )
                    )
                  : 0;

              return (
                <div
                  key={req.category}
                  className="rounded-lg border border-border bg-card shadow-sm p-5 animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Category header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <h2
                        className={`text-sm font-semibold ${color.text}`}
                      >
                        {req.category}
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground"
                      >
                        {TYPE_LABELS[req.type] || req.type}
                      </Badge>
                      {req.is_satisfied && (
                        <Badge className="bg-sift-green/10 text-sift-green border-sift-green/20 text-[10px] px-1.5 py-0 h-4">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      <span className="font-mono">{req.credits_completed}/{req.credits_needed}</span> credits
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Course chips */}
                  <div className="space-y-3">
                    {/* Completed courses */}
                    {req.completed_courses.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Completed
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {req.completed_courses.map((course) => (
                            <span
                              key={course}
                              className="inline-flex items-center bg-sift-green/10 text-sift-green rounded-full text-xs font-mono px-2.5 py-0.5"
                            >
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining courses */}
                    {req.remaining_courses.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Remaining
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {req.remaining_courses.map((course) => (
                            <span
                              key={course}
                              className="inline-flex items-center bg-muted text-muted-foreground rounded-full text-xs font-mono px-2.5 py-0.5"
                            >
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && remaining.length === 0 && (
          <div className="text-center py-16 border border-border bg-card shadow-sm rounded-lg">
            <p className="text-muted-foreground text-sm mb-2">
              No degree plan data available
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure the backend is running on port 3001
            </p>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
