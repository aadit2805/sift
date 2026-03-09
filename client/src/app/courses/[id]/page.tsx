"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCourse } from "@/lib/queries";
import type {
  Course,
  Section,
  Professor,
  GradeDistribution,
} from "@/lib/types";

type CourseDetail = Course & {
  sections: (Section & { professors: Professor })[];
  grade_distributions: (GradeDistribution & {
    professors: { name: string };
  })[];
};

interface ProfessorGroup {
  professor_id: string;
  professor_name: string;
  distributions: (GradeDistribution & { professors: { name: string } })[];
  avg_gpa: number;
  total_enrollment: number;
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.5) return "text-sift-green";
  if (gpa >= 3.0) return "text-sift-amber";
  if (gpa >= 2.5) return "text-foreground";
  return "text-sift-red";
}

function gpaBgColor(gpa: number): string {
  if (gpa >= 3.5) return "bg-sift-green/15 text-sift-green border-sift-green/20";
  if (gpa >= 3.0) return "bg-sift-amber/15 text-sift-amber border-sift-amber/20";
  if (gpa >= 2.5) return "bg-muted text-foreground border-border";
  return "bg-sift-red/15 text-sift-red border-sift-red/20";
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: course, isLoading: loading, error: queryError } = useCourse(id);
  const error = queryError ? queryError.message : null;

  // Group grade distributions by professor
  const professorGroups = useMemo(() => {
    if (!course) return [];

    const groups = new Map<string, ProfessorGroup>();

    for (const dist of course.grade_distributions) {
      const profId = dist.professor_id || "unknown";
      const profName = dist.professors?.name || "Unknown";

      if (!groups.has(profId)) {
        groups.set(profId, {
          professor_id: profId,
          professor_name: profName,
          distributions: [],
          avg_gpa: 0,
          total_enrollment: 0,
        });
      }

      const group = groups.get(profId)!;
      group.distributions.push(dist);
      group.total_enrollment += dist.enrollment;
    }

    // Calculate weighted average GPA per professor
    for (const group of groups.values()) {
      if (group.total_enrollment > 0) {
        const weightedSum = group.distributions.reduce(
          (sum, d) => sum + d.avg_gpa * d.enrollment,
          0
        );
        group.avg_gpa = weightedSum / group.total_enrollment;
      }
    }

    // Sort by avg GPA descending
    return Array.from(groups.values()).sort((a, b) => b.avg_gpa - a.avg_gpa);
  }, [course]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Back link */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sift-amber transition-colors mb-5"
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
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to courses
        </Link>

        {loading ? (
          <LoadingSkeleton />
        ) : error && !course ? (
          <div className="text-center py-16 bg-card shadow-sm border border-border rounded-lg">
            <p className="text-sift-red text-sm font-medium mb-2">
              Unable to load course
            </p>
            <p className="text-muted-foreground text-xs">
              Something went wrong. Please try again in a moment.
            </p>
          </div>
        ) : course ? (
          <>
            {/* Course Header */}
            <div className="bg-card shadow-sm border border-border rounded-lg p-5 mb-6 animate-fade-up hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-lg font-bold tracking-wide text-foreground">
                      {course.department} {course.number}
                    </span>
                    <Badge className="bg-sift-amber/15 text-sift-amber border-sift-amber/20 text-[10px] font-mono px-1.5 py-0 h-4">
                      {course.credits} cr
                    </Badge>
                  </div>
                  <h1 className="text-xl font-medium text-foreground mb-2">
                    {course.name}
                  </h1>
                  {course.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Sections</span>
                    <span className="font-mono text-foreground tabular-nums">
                      {course.sections.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Professors</span>
                    <span className="font-mono text-foreground tabular-nums">
                      {professorGroups.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-mono text-foreground tabular-nums">
                      {course.grade_distributions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prereqs & Semesters */}
              <div className="flex flex-wrap gap-4 pt-3 border-t border-border/50">
                {/* Prerequisites */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Prereqs
                  </span>
                  {course.prereqs && course.prereqs.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {course.prereqs.map((group, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-[10px] text-muted-foreground/60 mx-0.5">
                              AND
                            </span>
                          )}
                          {group.map((prereq, j) => (
                            <span key={j} className="flex items-center gap-1">
                              {j > 0 && (
                                <span className="text-[10px] text-muted-foreground/60">
                                  or
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0 h-4 border-border text-muted-foreground"
                              >
                                {prereq}
                              </Badge>
                            </span>
                          ))}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">
                      none
                    </span>
                  )}
                </div>

                <div className="h-4 w-px bg-border hidden sm:block" />

                {/* Semesters offered */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Offered
                  </span>
                  {course.semesters_offered && course.semesters_offered.length > 0 ? (
                    <div className="flex gap-1">
                      {course.semesters_offered.map((sem) => (
                        <Badge
                          key={sem}
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0 h-4 border-sift-blue/20 text-sift-blue"
                        >
                          {sem}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">
                      varies
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Professor Breakdown */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                Grade Distribution by Professor
              </h2>

              {professorGroups.length === 0 ? (
                <div className="text-center py-12 bg-card shadow-sm border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    No grade distribution data available
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {professorGroups.map((group, i) => (
                    <div
                      key={group.professor_id}
                      className="animate-fade-up bg-card shadow-sm border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {/* Professor header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          {group.professor_id !== "unknown" ? (
                            <Link
                              href={`/professors/${group.professor_id}`}
                              className="text-sm font-semibold text-foreground hover:text-sift-amber transition-colors"
                            >
                              {group.professor_name}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">
                              Unknown Professor
                            </span>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              <span className="font-mono">{group.total_enrollment}</span> students
                            </span>
                            <span className="text-xs text-muted-foreground">
                              <span className="font-mono">{group.distributions.length}</span> semester{group.distributions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <Badge
                            className={`text-xs font-mono font-bold tabular-nums px-2 py-0.5 h-5 ${gpaBgColor(group.avg_gpa)}`}
                          >
                            {group.avg_gpa.toFixed(2)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                            avg GPA
                          </span>
                        </div>
                      </div>

                      {/* Per-semester distributions */}
                      <div className="space-y-2">
                        {group.distributions
                          .sort((a, b) => b.semester.localeCompare(a.semester))
                          .map((dist) => (
                            <div key={dist.id}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  {dist.semester}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-mono tabular-nums ${gpaColor(dist.avg_gpa)}`}>
                                    {dist.avg_gpa.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                                    <span className="font-mono">{dist.enrollment}</span> students
                                  </span>
                                </div>
                              </div>

                              {/* Stacked bar chart */}
                              <div className="flex h-4 rounded-sm overflow-hidden border border-border/50">
                                {dist.a_pct > 0 && (
                                  <div
                                    className="bg-sift-green h-full relative group/bar"
                                    style={{ width: `${dist.a_pct * 100}%` }}
                                    title={`A: ${(dist.a_pct * 100).toFixed(1)}%`}
                                  >
                                    {dist.a_pct >= 0.08 && (
                                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white">
                                        {(dist.a_pct * 100).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {dist.b_pct > 0 && (
                                  <div
                                    className="bg-sift-blue h-full relative group/bar"
                                    style={{ width: `${dist.b_pct * 100}%` }}
                                    title={`B: ${(dist.b_pct * 100).toFixed(1)}%`}
                                  >
                                    {dist.b_pct >= 0.08 && (
                                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white">
                                        {(dist.b_pct * 100).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {dist.c_pct > 0 && (
                                  <div
                                    className="bg-sift-amber h-full relative group/bar"
                                    style={{ width: `${dist.c_pct * 100}%` }}
                                    title={`C: ${(dist.c_pct * 100).toFixed(1)}%`}
                                  >
                                    {dist.c_pct >= 0.08 && (
                                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white">
                                        {(dist.c_pct * 100).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {(dist.d_pct + dist.f_pct) > 0 && (
                                  <div
                                    className="bg-sift-red h-full relative group/bar"
                                    style={{ width: `${(dist.d_pct + dist.f_pct) * 100}%` }}
                                    title={`D/F: ${((dist.d_pct + dist.f_pct) * 100).toFixed(1)}%`}
                                  >
                                    {(dist.d_pct + dist.f_pct) >= 0.08 && (
                                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white">
                                        {((dist.d_pct + dist.f_pct) * 100).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {dist.q_pct > 0 && (
                                  <div
                                    className="bg-muted-foreground/30 h-full relative group/bar"
                                    style={{ width: `${dist.q_pct * 100}%` }}
                                    title={`Q: ${(dist.q_pct * 100).toFixed(1)}%`}
                                  >
                                    {dist.q_pct >= 0.08 && (
                                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-muted-foreground">
                                        Q
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Bar chart legend (only on first card) */}
                      {i === 0 && (
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/30">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-sm bg-sift-green" /> A
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-sm bg-sift-blue" /> B
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-sm bg-sift-amber" /> C
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-sm bg-sift-red" /> D/F
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-sm bg-muted-foreground/30" /> Q
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sections */}
            {course.sections.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">
                  Available Sections
                </h2>
                <div className="bg-card shadow-sm border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Professor</span>
                    <span>Schedule</span>
                    <span>Location</span>
                    <span>Seats</span>
                    <span>Status</span>
                  </div>
                  {course.sections.map((section) => {
                    const fillPct =
                      section.capacity > 0
                        ? section.enrolled / section.capacity
                        : 0;
                    return (
                      <div
                        key={section.id}
                        className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors items-center"
                      >
                        <div>
                          {section.professors ? (
                            <Link
                              href={`/professors/${section.professor_id}`}
                              className="text-sm text-foreground hover:text-sift-amber transition-colors"
                            >
                              {section.professors.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              TBA
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-foreground/80">
                          {section.days} {section.time_slot}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {section.location || "TBA"}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-foreground/80">
                          {section.enrolled}/{section.capacity}
                        </span>
                        <Badge
                          className={`text-[10px] font-mono px-1.5 py-0 h-4 ${
                            fillPct >= 1.0
                              ? "bg-sift-red/15 text-sift-red border-sift-red/20"
                              : fillPct >= 0.9
                                ? "bg-sift-amber/15 text-sift-amber border-sift-amber/20"
                                : "bg-sift-green/15 text-sift-green border-sift-green/20"
                          }`}
                        >
                          {fillPct >= 1.0
                            ? "FULL"
                            : fillPct >= 0.9
                              ? "FILLING"
                              : "OPEN"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      <SiteFooter />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-card shadow-sm border border-border rounded-lg p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-12 bg-muted rounded-full" />
            </div>
            <div className="h-6 w-64 bg-muted rounded mb-2" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        </div>
        <div className="flex gap-4 pt-3 border-t border-border/50">
          <div className="flex gap-1">
            <div className="h-4 w-16 bg-muted rounded-full" />
            <div className="h-4 w-20 bg-muted rounded-full" />
          </div>
          <div className="flex gap-1">
            <div className="h-4 w-12 bg-muted rounded-full" />
            <div className="h-4 w-12 bg-muted rounded-full" />
          </div>
        </div>
      </div>

      {/* Professor breakdown skeleton */}
      <div>
        <div className="h-3 w-48 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card shadow-sm border border-border rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-5 w-12 bg-muted rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded mb-1" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded mb-1" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
