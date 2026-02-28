"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useProfessor } from "@/lib/queries";
import type { Professor, GradeDistribution } from "@/lib/types";

type ProfessorDetail = Professor & {
  grade_history: (GradeDistribution & {
    courses: { department: string; number: string; name: string };
  })[];
};

function ratingColor(rating: number | null): string {
  if (rating == null) return "text-muted-foreground";
  if (rating >= 4.0) return "text-sift-green";
  if (rating >= 3.0) return "text-sift-amber";
  return "text-sift-red";
}

function difficultyColor(difficulty: number | null): string {
  if (difficulty == null) return "text-muted-foreground";
  if (difficulty <= 2.5) return "text-sift-green";
  if (difficulty <= 3.5) return "text-sift-amber";
  return "text-sift-red";
}

function wtaColor(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 70) return "text-sift-green";
  if (pct >= 50) return "text-sift-amber";
  return "text-sift-red";
}

export default function ProfessorDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: professor, isLoading: loading, error: queryError } = useProfessor(id);
  const error = queryError ? queryError.message : null;

  // Group grade history by course
  const courseGroups = useMemo(() => {
    if (!professor?.grade_history) return [];

    const groups = new Map<
      string,
      {
        code: string;
        name: string;
        entries: (GradeDistribution & {
          courses: { department: string; number: string; name: string };
        })[];
      }
    >();

    for (const entry of professor.grade_history) {
      const code = `${entry.courses.department} ${entry.courses.number}`;
      if (!groups.has(code)) {
        groups.set(code, {
          code,
          name: entry.courses.name,
          entries: [],
        });
      }
      groups.get(code)!.entries.push(entry);
    }

    // Sort entries within each group by semester
    for (const group of groups.values()) {
      group.entries.sort((a, b) => {
        const order = (s: string) => {
          const [term, year] = s.split(" ");
          const y = parseInt(year, 10);
          const t = term === "Spring" ? 0 : term === "Summer" ? 1 : 2;
          return y * 10 + t;
        };
        return order(b.semester) - order(a.semester);
      });
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }, [professor]);

  // Overall stats
  const overallStats = useMemo(() => {
    if (!professor?.grade_history?.length) return null;
    const entries = professor.grade_history;
    const totalEnrollment = entries.reduce((s, e) => s + e.enrollment, 0);
    const avgGpa =
      entries.reduce((s, e) => s + e.avg_gpa * e.enrollment, 0) /
      totalEnrollment;
    return {
      totalSections: entries.length,
      totalEnrollment,
      avgGpa: avgGpa.toFixed(2),
      coursesCount: new Set(
        entries.map((e) => `${e.courses.department} ${e.courses.number}`)
      ).size,
    };
  }, [professor]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Back link */}
        <Link
          href="/professors"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sift-amber transition-colors mb-5"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Professors
        </Link>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-16 border border-sift-red/20 bg-sift-red/5 rounded-lg">
            <p className="text-sift-red text-sm font-medium mb-2">{error}</p>
            <p className="text-muted-foreground text-xs">
              Could not load professor data. Make sure the API is running.
            </p>
          </div>
        ) : professor ? (
          <div className="space-y-6">
            {/* Professor Header */}
            <div className="border border-border rounded-lg bg-card shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                {/* Name + Department */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-foreground mb-1">
                    {professor.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {professor.department} Department
                  </p>
                  {overallStats && (
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-muted-foreground">
                        {overallStats.coursesCount} courses
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {overallStats.totalSections} sections
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {overallStats.totalEnrollment.toLocaleString()} total students
                      </span>
                      <span className="text-xs text-muted-foreground">
                        avg GPA{" "}
                        <span className="font-mono font-medium text-foreground">{overallStats.avgGpa}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* RMP Summary */}
                <div className="flex items-start gap-4">
                  {/* Rating */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Rating
                    </p>
                    <p
                      className={`font-mono text-3xl font-bold tabular-nums ${ratingColor(
                        professor.rmp_rating
                      )}`}
                    >
                      {professor.rmp_rating?.toFixed(1) ?? "-"}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      / 5.0
                    </p>
                  </div>

                  <div className="h-14 w-px bg-border" />

                  {/* Difficulty */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Difficulty
                    </p>
                    <p
                      className={`font-mono text-3xl font-bold tabular-nums ${difficultyColor(
                        professor.rmp_difficulty
                      )}`}
                    >
                      {professor.rmp_difficulty?.toFixed(1) ?? "-"}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      / 5.0
                    </p>
                  </div>

                  <div className="h-14 w-px bg-border" />

                  {/* Would Take Again */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Take Again
                    </p>
                    <p
                      className={`font-mono text-3xl font-bold tabular-nums ${wtaColor(
                        professor.rmp_would_take_again
                      )}`}
                    >
                      {professor.rmp_would_take_again != null
                        ? `${Math.round(professor.rmp_would_take_again)}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* RMP Tags */}
              {professor.rmp_tags && professor.rmp_tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Student Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {professor.rmp_tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 bg-sift-amber/5 border-sift-amber/20 text-sift-amber"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grade History */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                Grade History
              </h2>

              {courseGroups.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-lg bg-card shadow-sm">
                  <p className="text-muted-foreground text-sm">
                    No grade distribution data available
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseGroups.map((group) => (
                    <div
                      key={group.code}
                      className="border border-border rounded-lg bg-card shadow-sm overflow-hidden"
                    >
                      {/* Course header */}
                      <div className="px-4 py-3 border-b border-border bg-card">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-sift-amber">
                            {group.code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {group.name}
                          </span>
                        </div>
                      </div>

                      {/* Semester entries */}
                      <div className="divide-y divide-border">
                        {group.entries.map((entry) => {
                          const total =
                            entry.a_pct +
                            entry.b_pct +
                            entry.c_pct +
                            entry.d_pct +
                            entry.f_pct;

                          return (
                            <div
                              key={entry.id}
                              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                            >
                              {/* Semester label */}
                              <span className="text-xs text-foreground w-28 shrink-0">
                                {entry.semester}
                              </span>

                              {/* Stacked bar */}
                              <div className="flex-1 min-w-0">
                                <div className="flex h-5 rounded overflow-hidden bg-muted/30">
                                  {total > 0 && (
                                    <>
                                      {entry.a_pct > 0 && (
                                        <div
                                          className="bg-sift-green flex items-center justify-center"
                                          style={{
                                            width: `${(entry.a_pct / total) * 100}%`,
                                          }}
                                          title={`A: ${(entry.a_pct * 100).toFixed(1)}%`}
                                        >
                                          {entry.a_pct >= 0.10 && (
                                            <span className="text-[10px] font-mono font-bold text-black/70">
                                              A
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {entry.b_pct > 0 && (
                                        <div
                                          className="bg-sift-blue flex items-center justify-center"
                                          style={{
                                            width: `${(entry.b_pct / total) * 100}%`,
                                          }}
                                          title={`B: ${(entry.b_pct * 100).toFixed(1)}%`}
                                        >
                                          {entry.b_pct >= 0.10 && (
                                            <span className="text-[10px] font-mono font-bold text-black/70">
                                              B
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {entry.c_pct > 0 && (
                                        <div
                                          className="bg-sift-amber flex items-center justify-center"
                                          style={{
                                            width: `${(entry.c_pct / total) * 100}%`,
                                          }}
                                          title={`C: ${(entry.c_pct * 100).toFixed(1)}%`}
                                        >
                                          {entry.c_pct >= 0.10 && (
                                            <span className="text-[10px] font-mono font-bold text-black/70">
                                              C
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {entry.d_pct + entry.f_pct > 0 && (
                                        <div
                                          className="bg-sift-red flex items-center justify-center"
                                          style={{
                                            width: `${((entry.d_pct + entry.f_pct) / total) * 100}%`,
                                          }}
                                          title={`D/F: ${((entry.d_pct + entry.f_pct) * 100).toFixed(1)}%`}
                                        >
                                          {(entry.d_pct + entry.f_pct) >= 0.10 && (
                                            <span className="text-[10px] font-mono font-bold text-black/70">
                                              D/F
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                                {/* Bar legend */}
                                <div className="flex gap-3 mt-1">
                                  <span className="text-[10px] font-mono text-sift-green">
                                    A {(entry.a_pct * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-[10px] font-mono text-sift-blue">
                                    B {(entry.b_pct * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-[10px] font-mono text-sift-amber">
                                    C {(entry.c_pct * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-[10px] font-mono text-sift-red">
                                    D/F {((entry.d_pct + entry.f_pct) * 100).toFixed(1)}%
                                  </span>
                                  {entry.q_pct > 0 && (
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      Q {(entry.q_pct * 100).toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-center">
                                  <p className="text-[10px] text-muted-foreground">
                                    GPA
                                  </p>
                                  <p className="text-sm font-mono font-semibold tabular-nums text-foreground">
                                    {entry.avg_gpa.toFixed(2)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] text-muted-foreground">
                                    Students
                                  </p>
                                  <p className="text-sm font-mono font-semibold tabular-nums text-foreground">
                                    {entry.enrollment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <SiteFooter />
    </div>
  );
}

/* Loading Skeleton */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="border border-border rounded-lg bg-card shadow-sm p-5 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex-1">
            <div className="h-6 w-48 bg-muted rounded mb-2" />
            <div className="h-3 w-32 bg-muted rounded mb-3" />
            <div className="flex gap-4">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center space-y-1">
              <div className="h-3 w-12 bg-muted rounded mx-auto" />
              <div className="h-9 w-14 bg-muted rounded mx-auto" />
              <div className="h-3 w-8 bg-muted rounded mx-auto" />
            </div>
            <div className="h-14 w-px bg-border" />
            <div className="text-center space-y-1">
              <div className="h-3 w-16 bg-muted rounded mx-auto" />
              <div className="h-9 w-14 bg-muted rounded mx-auto" />
              <div className="h-3 w-8 bg-muted rounded mx-auto" />
            </div>
            <div className="h-14 w-px bg-border" />
            <div className="text-center space-y-1">
              <div className="h-3 w-16 bg-muted rounded mx-auto" />
              <div className="h-9 w-14 bg-muted rounded mx-auto" />
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="h-3 w-20 bg-muted rounded mb-2" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 w-20 bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Grade history skeleton */}
      <div>
        <div className="h-3 w-28 bg-muted rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-border rounded-lg bg-card shadow-sm mb-4 animate-pulse"
          >
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            </div>
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="flex-1 h-5 bg-muted rounded" />
                  <div className="flex gap-4">
                    <div className="h-6 w-10 bg-muted rounded" />
                    <div className="h-6 w-10 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
