"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CourseCard } from "@/components/course-card";
import { DegreeProgress } from "@/components/degree-progress";
import { WeightControls } from "@/components/weight-controls";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TranscriptUpload } from "@/components/transcript-upload";
import {
  CourseEditor,
  getCompletedCourses,
  setCompletedCourses,
  getInProgressCourses,
  setInProgressCourses,
} from "@/components/course-editor";
import { useRecommendations, useRemainingRequirements, queryKeys } from "@/lib/queries";

function getNextSemester(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  // If we're in Jan-May → planning for Fall of same year
  // If we're in Jun-Jul → planning for Fall of same year
  // If we're in Aug-Dec → planning for Spring of next year
  if (month <= 6) return `Fall ${year}`;
  return `Spring ${year + 1}`;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState(() => {
    if (typeof window === "undefined") return getNextSemester();
    try {
      const stored = localStorage.getItem("sift_semester");
      return stored || getNextSemester();
    } catch {
      return getNextSemester();
    }
  });
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return { weight_gpa: 0.25, weight_professor: 0.2, weight_difficulty: 0.15, weight_requirement: 0.15 };
    try {
      const stored = localStorage.getItem("sift_weights");
      return stored ? JSON.parse(stored) : { weight_gpa: 0.25, weight_professor: 0.2, weight_difficulty: 0.15, weight_requirement: 0.15 };
    } catch {
      return { weight_gpa: 0.25, weight_professor: 0.2, weight_difficulty: 0.15, weight_requirement: 0.15 };
    }
  });

  const [completedCourses, setCompleted] = useState<string[]>([]);
  const [inProgressCourses, setIP] = useState<string[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    setCompleted(getCompletedCourses());
    setIP(getInProgressCourses());
    setCoursesLoaded(true);
  }, []);

  const recsQuery = useRecommendations(
    {
      major: "CS",
      completed_courses: completedCourses,
      in_progress_courses: inProgressCourses,
      preferences: weights,
      semester,
    },
    coursesLoaded
  );

  const degreeQuery = useRemainingRequirements("CS", completedCourses, inProgressCourses, coursesLoaded);

  const courses = recsQuery.data ?? [];
  const remaining = degreeQuery.data?.remaining ?? [];
  const totalRequired = degreeQuery.data?.total_credits_required ?? 0;
  const totalCompleted = degreeQuery.data?.total_credits_completed ?? 0;
  const totalInProgress = degreeQuery.data?.total_credits_in_progress ?? 0;
  const progressPct = degreeQuery.data?.progress_pct ?? 0;
  const loading = !coursesLoaded || recsQuery.isPending || degreeQuery.isPending;
  const apiStatus: "connected" | "error" | "loading" = loading
    ? "loading"
    : recsQuery.isError || degreeQuery.isError
      ? "error"
      : "connected";

  const requirementTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of remaining) {
      for (const course of req.courses) {
        map.set(course.toUpperCase(), req.type);
      }
    }
    return map;
  }, [remaining]);

  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (sc) =>
          `${sc.course.department} ${sc.course.number}`
            .toLowerCase()
            .includes(q) ||
          sc.course.name.toLowerCase().includes(q) ||
          sc.professor?.name.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => b.score - a.score);
  }, [search, courses]);

  const handleTranscriptCourses = useCallback(
    (parsed: { code: string; name: string; credits: number; grade: string }[]) => {
      const completed = parsed
        .filter((c) => !["W", "IP", "I"].includes(c.grade))
        .map((c) => c.code);
      const ip = parsed
        .filter((c) => c.grade === "IP")
        .map((c) => c.code);
      setCompleted(completed);
      setCompletedCourses(completed);
      setIP(ip);
      setInProgressCourses(ip);
      setShowTranscript(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.degreePlan.all });
    },
    [queryClient]
  );

  const handleEditorSave = useCallback((completed: string[], inProgress: string[]) => {
    setCompleted(completed);
    setIP(inProgress);
    setShowEditor(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.degreePlan.all });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader semester={semester} onSemesterChange={(s) => { setSemester(s); localStorage.setItem("sift_semester", s); }} />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Search + stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 sift-glow rounded-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, professors, or topics..."
              className="pl-10 h-10 bg-card border-border text-sm placeholder:text-muted-foreground/50 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Eligible</span>
              <span className="font-mono text-foreground tabular-nums">
                {loading ? "-" : filteredCourses.length}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-mono text-foreground tabular-nums">
                {loading ? "-" : `${totalRequired - totalCompleted - totalInProgress} cr`}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Completed</span>
              <Badge className="bg-sift-green/10 text-sift-green border-sift-green/15 text-xs font-mono px-1.5 py-0 h-5 rounded-full">
                {loading ? "-" : `${progressPct}%`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Recommendations */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Recommended for You
                </h2>
                <span className="text-xs text-sift-amber-dim">
                  {semester}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-sift-amber/40" />
                  core
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-sift-purple/40" />
                  capstone
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-sift-blue/40" />
                  elective
                </span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 animate-pulse shadow-sm"
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <div className="h-4 w-24 bg-muted rounded mb-2" />
                        <div className="h-3 w-40 bg-muted rounded" />
                      </div>
                      <div className="h-10 w-12 bg-muted rounded-lg" />
                    </div>
                    <div className="h-1 bg-muted rounded mb-3" />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded" />
                    </div>
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : apiStatus === "error" && courses.length === 0 ? (
              <div className="text-center py-16 border border-sift-red/20 bg-sift-red/5 rounded-lg">
                <p className="text-sift-red text-sm font-medium mb-2">
                  Failed to connect to API
                </p>
                <p className="text-muted-foreground text-xs">
                  Make sure the backend is running on port 3001
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCourses.map((sc, i) => (
                    <CourseCard
                      key={`${sc.course.id}-${sc.professor?.id || i}`}
                      scored={sc}
                      index={i}
                      requirementType={
                        requirementTypeMap.get(
                          `${sc.course.department} ${sc.course.number}`.toUpperCase()
                        ) || "elective"
                      }
                    />
                  ))}
                </div>

                {filteredCourses.length === 0 && search && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">
                      No courses match &ldquo;{search}&rdquo;
                    </p>
                  </div>
                )}

                {filteredCourses.length === 0 && !search && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">
                      No eligible courses found for {semester}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-5">
            {/* Course management */}
            <div className="border border-border rounded-lg p-4 bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  My Courses
                </span>
                <span className="text-xs text-sift-amber font-mono tabular-nums">
                  {completedCourses.length} done{inProgressCourses.length > 0 ? `, ${inProgressCourses.length} IP` : ""}
                </span>
              </div>

              <div className="flex gap-2">
                <Sheet open={showTranscript} onOpenChange={setShowTranscript}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mr-1.5"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Upload Transcript
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[450px]">
                    <SheetHeader>
                      <SheetTitle>Upload Transcript</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <TranscriptUpload
                        onCoursesExtracted={handleTranscriptCourses}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={showEditor} onOpenChange={setShowEditor}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mr-1.5"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                      </svg>
                      Edit Courses
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[450px]">
                    <SheetHeader>
                      <SheetTitle>Edit Completed Courses</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <CourseEditor
                        initialCourses={completedCourses}
                        initialInProgress={inProgressCourses}
                        onSave={handleEditorSave}
                        onCancel={() => setShowEditor(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Degree Progress */}
            <div className="border border-border rounded-lg p-4 bg-card shadow-sm">
              <DegreeProgress
                remaining={remaining}
                totalRequired={totalRequired}
                totalCompleted={totalCompleted}
                totalInProgress={totalInProgress}
                progressPct={progressPct}
              />
            </div>

            {/* Weights */}
            <WeightControls weights={weights} onWeightsChange={(w) => { setWeights(w); localStorage.setItem("sift_weights", JSON.stringify(w)); }} />

          </aside>
        </div>
      </div>

      <SiteFooter apiStatus={apiStatus} />
    </div>
  );
}
