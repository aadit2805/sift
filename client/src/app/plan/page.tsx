"use client";

import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useRemainingRequirements, useUserProfile } from "@/lib/queries";
import type { RemainingRequirement } from "@/lib/types";

const CATEGORY_COLORS: Record<
  string,
  { bar: string; text: string; bg: string; border: string }
> = {
  // CS Core & Electives
  "CS Core": { bar: "bg-sift-amber", text: "text-sift-amber", bg: "bg-sift-amber/10", border: "border-sift-amber/20" },
  "Systems Directed Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/10", border: "border-sift-green/20" },
  "Software Directed Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/10", border: "border-sift-green/20" },
  "Intelligence Directed Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/10", border: "border-sift-green/20" },
  "CSCE Tracked Electives": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/10", border: "border-sift-green/20" },
  "CSCE Elective": { bar: "bg-sift-green", text: "text-sift-green", bg: "bg-sift-green/10", border: "border-sift-green/20" },
  // Math & Stats
  Mathematics: { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" },
  "MATH 304": { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" },
  "Math/Stat Elective": { bar: "bg-chart-3", text: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" },
  Statistics: { bar: "bg-chart-2", text: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/20" },
  // Science
  "Required Science": { bar: "bg-chart-5", text: "text-chart-5", bg: "bg-chart-5/10", border: "border-chart-5/20" },
  "Science Electives": { bar: "bg-chart-5", text: "text-chart-5", bg: "bg-chart-5/10", border: "border-chart-5/20" },
  // English, Communications, Engineering
  English: { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/10", border: "border-sift-blue/20" },
  Communications: { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/10", border: "border-sift-blue/20" },
  "Engineering Foundations": { bar: "bg-sift-blue", text: "text-sift-blue", bg: "bg-sift-blue/10", border: "border-sift-blue/20" },
  // University Core Curriculum
  "American History": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/10", border: "border-sift-purple/20" },
  Government: { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/10", border: "border-sift-purple/20" },
  "Creative Arts": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/10", border: "border-sift-purple/20" },
  "Social & Behavioral Sciences": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/10", border: "border-sift-purple/20" },
  "Language, Philosophy & Culture": { bar: "bg-sift-purple", text: "text-sift-purple", bg: "bg-sift-purple/10", border: "border-sift-purple/20" },
  // Emphasis & General
  "Emphasis Area": { bar: "bg-chart-4", text: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/20" },
  "General Elective": { bar: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
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
  const { data: profile, isPending: profileLoading } = useUserProfile();

  const completedCourses = profile?.completed_courses ?? [];
  const inProgressCourses = profile?.in_progress_courses ?? [];

  const { data: degreeData, isLoading: degreeLoading } = useRemainingRequirements(
    "CS",
    completedCourses,
    inProgressCourses,
    !!profile
  );

  const loading = profileLoading || degreeLoading;

  const remaining = degreeData?.remaining ?? [];
  const totalRequired = degreeData?.total_credits_required ?? 0;
  const totalCompleted = degreeData?.total_credits_completed ?? 0;
  const totalInProgress = degreeData?.total_credits_in_progress ?? 0;
  const progressPct = degreeData?.progress_pct ?? 0;
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
                  {totalInProgress > 0 && (
                    <span className="text-muted-foreground">
                      <span className="font-mono text-sift-amber tabular-nums">
                        {totalInProgress}
                      </span>{" "}
                      in progress
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    <span className="font-mono text-foreground tabular-nums">
                      {totalRequired - totalCompleted - totalInProgress}
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
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-sift-amber/80 to-sift-amber transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
              {totalInProgress > 0 && (
                <div
                  className="h-full bg-sift-amber/30 transition-all duration-700"
                  style={{ width: `${totalRequired > 0 ? Math.round((totalInProgress / totalRequired) * 100) : 0}%` }}
                />
              )}
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
            {remaining.filter((r) => !r.track).map((req, i) => {
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
                      {req.selection_rule === "pick" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground"
                        >
                          choose from list
                        </Badge>
                      )}
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
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4 flex">
                    <div
                      className={`h-full ${color.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                    {(req.credits_in_progress ?? 0) > 0 && (
                      <div
                        className="h-full bg-sift-amber/30 transition-all duration-500"
                        style={{ width: `${Math.min(100 - pct, Math.round(((req.credits_in_progress ?? 0) / req.credits_needed) * 100))}%` }}
                      />
                    )}
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
                          {req.completed_courses.map((course) => {
                            const equiv = req.equivalent_matches?.[course];
                            return (
                              <span
                                key={course}
                                className="inline-flex items-center bg-sift-green/10 text-sift-green rounded-full text-xs font-mono px-2.5 py-0.5"
                                title={equiv ? `Satisfied by ${equiv}` : undefined}
                              >
                                {equiv ?? course}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* In-progress courses */}
                    {(req.in_progress_courses?.length ?? 0) > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          In Progress
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {req.in_progress_courses.map((course) => {
                            const equiv = req.equivalent_matches?.[course];
                            return (
                              <span
                                key={course}
                                className="inline-flex items-center bg-sift-amber/10 text-sift-amber rounded-full text-xs font-mono px-2.5 py-0.5"
                                title={equiv ? `Satisfied by ${equiv}` : "In progress"}
                              >
                                {equiv ?? course}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Remaining courses */}
                    {req.remaining_courses.length > 0 && (() => {
                      const creditsStillNeeded = req.credits_needed - req.credits_completed - (req.credits_in_progress ?? 0);
                      if (req.selection_rule === "pick" && creditsStillNeeded <= 0) return null;
                      return (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground mb-1.5 block">
                            {req.selection_rule === "pick"
                              ? `Remaining (choose ${creditsStillNeeded} more credits)`
                              : "Remaining"}
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
                      );
                    })()}
                  </div>
                </div>
              );
            })}

            {/* CS Track Electives grouped section */}
            {remaining.filter((r) => r.track).length > 0 && (
              <div className="rounded-lg border border-border bg-card shadow-sm p-5">
                <h2 className="text-sm font-semibold text-sift-green mb-4">
                  CS Track Electives
                </h2>
                <div className="space-y-4">
                  {remaining.filter((r) => r.track).map((req) => {
                    const color = getColor(req.category);
                    const pct =
                      req.credits_needed > 0
                        ? Math.min(100, Math.round((req.credits_completed / req.credits_needed) * 100))
                        : 0;

                    return (
                      <div key={req.category} className={`rounded-md border ${color.border} ${color.bg} p-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className={`text-xs font-semibold ${color.text}`}>
                              {req.category}
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground"
                            >
                              choose from list
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

                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3 flex">
                          <div
                            className={`h-full ${color.bar} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                          {(req.credits_in_progress ?? 0) > 0 && (
                            <div
                              className="h-full bg-sift-amber/30 transition-all duration-500"
                              style={{ width: `${Math.min(100 - pct, Math.round(((req.credits_in_progress ?? 0) / req.credits_needed) * 100))}%` }}
                            />
                          )}
                        </div>

                        {req.completed_courses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {req.completed_courses.map((course) => (
                              <span key={course} className="inline-flex items-center bg-sift-green/10 text-sift-green rounded-full text-xs font-mono px-2.5 py-0.5">
                                {course}
                              </span>
                            ))}
                          </div>
                        )}

                        {(req.in_progress_courses?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {req.in_progress_courses.map((course) => (
                              <span key={course} className="inline-flex items-center bg-sift-amber/10 text-sift-amber rounded-full text-xs font-mono px-2.5 py-0.5">
                                {course}
                              </span>
                            ))}
                          </div>
                        )}

                        {req.remaining_courses.length > 0 && (() => {
                          const creditsStillNeeded = req.credits_needed - req.credits_completed - (req.credits_in_progress ?? 0);
                          if (creditsStillNeeded <= 0) return null;
                          return (
                            <div>
                              <span className="text-[10px] text-muted-foreground block mb-1">
                                choose {creditsStillNeeded} more credits
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {req.remaining_courses.map((course) => (
                                  <span key={course} className="inline-flex items-center bg-muted text-muted-foreground rounded-full text-xs font-mono px-2.5 py-0.5">
                                    {course}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
