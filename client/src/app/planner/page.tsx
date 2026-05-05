"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  useUserProfile,
  useGeneratePlans,
  useSavePlan,
  useSavedPlans,
  useDeletePlan,
} from "@/lib/queries";
import type { GeneratedPlan, PlannedCourse } from "@/lib/types";

function getUpcomingSemesters(): string[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const semesters: string[] = [];
  let season: "Spring" | "Summer" | "Fall" = month <= 4 ? "Fall" : month <= 6 ? "Fall" : "Spring";
  let y = season === "Spring" ? year + 1 : year;
  const order: ("Spring" | "Summer" | "Fall")[] = ["Spring", "Summer", "Fall"];
  let idx = order.indexOf(season);
  for (let i = 0; i < 6; i++) {
    semesters.push(`${order[idx]} ${y}`);
    idx++;
    if (idx >= order.length) { idx = 0; y++; }
  }
  return semesters;
}

const SEMESTERS = getUpcomingSemesters();

const OBJECTIVE_META: Record<string, { label: string; description: string; icon: string; color: string }> = {
  fastest: {
    label: "Fastest Graduation",
    description: "Minimize semesters to graduate",
    icon: "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
    color: "text-sift-amber",
  },
  highest_gpa: {
    label: "Highest GPA",
    description: "Prioritize easier courses first",
    icon: "M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z",
    color: "text-sift-green",
  },
  balanced: {
    label: "Balanced Workload",
    description: "Even difficulty across semesters",
    icon: "M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13",
    color: "text-sift-blue",
  },
  best_professors: {
    label: "Best Professors",
    description: "Optimize for top-rated instructors",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    color: "text-sift-purple",
  },
};

const REQUIREMENT_COLORS: Record<string, string> = {
  core: "bg-sift-amber/12 text-sift-amber border-sift-amber/20",
  capstone: "bg-sift-purple/12 text-sift-purple border-sift-purple/20",
  elective: "bg-sift-blue/12 text-sift-blue border-sift-blue/20",
  math: "bg-sift-green/12 text-sift-green border-sift-green/20",
  science: "bg-sift-green/12 text-sift-green border-sift-green/20",
  lab: "bg-sift-green/12 text-sift-green border-sift-green/20",
};

export default function PlannerPage() {
  const { data: profile, isPending: profileLoading } = useUserProfile();
  const generateMutation = useGeneratePlans();
  const saveMutation = useSavePlan();
  const { data: savedPlans } = useSavedPlans(!!profile);
  const deleteMutation = useDeletePlan();

  const [startSemester, setStartSemester] = useState(SEMESTERS[0]);
  const [maxCredits, setMaxCredits] = useState(18);
  const [minCredits, setMinCredits] = useState(12);
  const [includeSummer, setIncludeSummer] = useState(false);
  const [plans, setPlans] = useState<GeneratedPlan[] | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const completedCourses = profile?.completed_courses ?? [];
  const inProgressCourses = profile?.in_progress_courses ?? [];
  const major = profile?.major || "CS";

  const handleGenerate = useCallback(() => {
    generateMutation.mutate(
      {
        major,
        completed_courses: completedCourses,
        in_progress_courses: inProgressCourses,
        start_semester: startSemester,
        min_credits: minCredits,
        max_credits: maxCredits,
        include_summer: includeSummer,
      },
      {
        onSuccess: (data) => {
          setPlans(data);
          setSelectedIdx(0);
        },
      }
    );
  }, [generateMutation, major, completedCourses, inProgressCourses, startSemester, minCredits, maxCredits, includeSummer]);

  const handleSave = useCallback(
    (plan: GeneratedPlan) => {
      saveMutation.mutate({
        name: OBJECTIVE_META[plan.objective]?.label || plan.objective,
        objective: plan.objective,
        semesters: plan.semesters,
        scores: plan.scores,
      });
    },
    [saveMutation]
  );

  const selectedPlan = plans?.[selectedIdx] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">
            Semester Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate multi-semester degree plans optimized for different goals
          </p>
        </div>

        {/* Generate controls */}
        <div className="border border-border rounded-lg bg-card shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Start semester */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Start Semester
                </label>
                <select
                  value={startSemester}
                  onChange={(e) => setStartSemester(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Min credits */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Min Credits
                </label>
                <select
                  value={minCredits}
                  onChange={(e) => setMinCredits(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground"
                >
                  {[9, 12, 13, 14, 15].map((n) => (
                    <option key={n} value={n}>{n} cr</option>
                  ))}
                </select>
              </div>

              {/* Max credits */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Max Credits
                </label>
                <select
                  value={maxCredits}
                  onChange={(e) => setMaxCredits(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground"
                >
                  {[15, 16, 17, 18, 19, 20, 21].map((n) => (
                    <option key={n} value={n}>{n} cr</option>
                  ))}
                </select>
              </div>

              {/* Include summer */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Include Summer
                </label>
                <button
                  onClick={() => setIncludeSummer(!includeSummer)}
                  className={`w-full h-9 px-3 rounded-md border text-sm transition-colors ${
                    includeSummer
                      ? "border-sift-amber/30 bg-sift-amber/8 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {includeSummer ? "Yes" : "No"}
                </button>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || profileLoading}
              className="bg-sift-amber hover:bg-sift-amber/90 text-primary-foreground h-9 px-5 text-sm font-medium shrink-0"
            >
              {generateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Plans"
              )}
            </Button>
          </div>
        </div>

        {/* Plan comparison cards */}
        {plans && plans.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Plan Comparison
              </h2>
              <span className="text-xs text-sift-amber-dim">
                {plans.length} variants generated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {plans.map((plan, idx) => {
                const meta = OBJECTIVE_META[plan.objective];
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={plan.objective}
                    onClick={() => setSelectedIdx(idx)}
                    className={`text-left rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-sift-amber/40 bg-sift-amber/4 shadow-md ring-1 ring-sift-amber/10"
                        : "border-border bg-card shadow-sm hover:border-border/80 hover:shadow"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={meta?.color || "text-muted-foreground"}
                        >
                          <path d={meta?.icon || ""} />
                        </svg>
                        <span className="text-sm font-medium text-foreground">
                          {meta?.label || plan.objective}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-sift-amber" />
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground mb-3">
                      {meta?.description}
                    </p>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Semesters</span>
                        <div className="font-mono text-sm tabular-nums text-foreground">
                          {plan.scores.total_semesters}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Proj. GPA</span>
                        <div className="font-mono text-sm tabular-nums text-foreground">
                          {plan.scores.projected_gpa.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Balance</span>
                        <div className="font-mono text-sm tabular-nums text-foreground">
                          {plan.scores.workload_variance.toFixed(1)}
                          <span className="text-[9px] text-muted-foreground ml-0.5">var</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Prof Rating</span>
                        <div className="font-mono text-sm tabular-nums text-foreground">
                          {plan.scores.avg_professor_rating.toFixed(1)}
                          <span className="text-[9px] text-muted-foreground ml-0.5">/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(plan);
                        }}
                        disabled={saveMutation.isPending}
                      >
                        {saveMutation.isPending ? "Saving..." : "Save Plan"}
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Semester timeline */}
        {selectedPlan && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Semester Timeline
              </h2>
              <Badge className="bg-sift-amber/10 text-sift-amber border-sift-amber/15 text-[10px] font-mono px-1.5 py-0 h-4 rounded-full">
                {OBJECTIVE_META[selectedPlan.objective]?.label}
              </Badge>
            </div>

            <div className="space-y-3">
              {selectedPlan.semesters.map((sem, semIdx) => {
                const totalCredits = sem.courses.reduce((sum, c) => sum + c.credits, 0);
                return (
                  <div
                    key={sem.term}
                    className="border border-border rounded-lg bg-card shadow-sm overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${semIdx * 60}ms` }}
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 bg-sift-surface-raised/50 border-b border-border/50">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-foreground">
                          {sem.term}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Semester {semIdx + 1}
                        </span>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {totalCredits} credits
                      </span>
                    </div>

                    <div className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {sem.courses.map((course: PlannedCourse) => {
                          const colorClass = REQUIREMENT_COLORS[course.requirement_type] || REQUIREMENT_COLORS.elective;
                          return (
                            <div
                              key={course.code}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 ${colorClass}`}
                            >
                              <span className="font-mono text-xs font-medium">
                                {course.code}
                              </span>
                              <span className="text-[10px] opacity-70">
                                {course.credits}cr
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!plans && !generateMutation.isPending && (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-muted-foreground/40 mb-3"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <line x1="8" x2="8" y1="14" y2="14" />
              <line x1="12" x2="12" y1="14" y2="14" />
              <line x1="16" x2="16" y1="14" y2="14" />
              <line x1="8" x2="8" y1="18" y2="18" />
              <line x1="12" x2="12" y1="18" y2="18" />
            </svg>
            <p className="text-sm text-muted-foreground mb-1">
              No plans generated yet
            </p>
            <p className="text-xs text-muted-foreground/60">
              Configure your preferences above and click Generate Plans
            </p>
          </div>
        )}

        {/* Generating state */}
        {generateMutation.isPending && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg bg-card shadow-sm p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-8 w-24 bg-muted rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {generateMutation.isError && (
          <div className="text-center py-12 border border-sift-red/20 bg-sift-red/5 rounded-lg">
            <p className="text-sift-red text-sm font-medium mb-1">
              Unable to generate plans
            </p>
            <p className="text-muted-foreground text-xs">
              Please try again in a moment.
            </p>
          </div>
        )}

        {/* Saved plans */}
        {savedPlans && savedPlans.length > 0 && (
          <div className="mt-8 mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Saved Plans
            </h2>
            <div className="space-y-2">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between border border-border rounded-lg bg-card shadow-sm px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {plan.name}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">
                        {plan.scores.total_semesters} sem
                      </span>
                      <span className="font-mono tabular-nums">
                        {plan.scores.projected_gpa.toFixed(2)} GPA
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(plan.id)}
                    className="text-muted-foreground hover:text-sift-red transition-colors"
                    disabled={deleteMutation.isPending}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
