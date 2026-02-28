"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCourses } from "@/lib/queries";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const { data: courses = [], isLoading: loading } = useCourses({ department: "CSCE" });

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        `${c.department} ${c.number}`.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [search, courses]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-foreground mb-1">
            Course Catalog
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse CSCE courses, prerequisites, and availability.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 rounded-lg">
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
              placeholder="Search by course code or name..."
              className="pl-10 h-10 bg-card border-border text-sm placeholder:text-muted-foreground/50"
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

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-muted-foreground">Showing</span>
            <span className="font-mono text-foreground tabular-nums">
              {loading ? "-" : filteredCourses.length}
            </span>
            <span className="text-muted-foreground">
              {filteredCourses.length === 1 ? "course" : "courses"}
            </span>
          </div>
        </div>

        {/* Course grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card shadow-sm p-4 animate-pulse"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="h-4 w-20 bg-muted rounded mb-2" />
                    <div className="h-3 w-36 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-10 bg-muted rounded-full" />
                </div>
                <div className="flex gap-1.5 mb-3">
                  <div className="h-4 w-16 bg-muted rounded-full" />
                  <div className="h-4 w-16 bg-muted rounded-full" />
                </div>
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">
              {search
                ? `No courses match "${search}"`
                : "No courses found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCourses.map((course, i) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="rounded-lg border border-border bg-card shadow-sm p-4 h-full transition-shadow hover:shadow-md">
                  {/* Header: code + credits */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-mono font-bold text-sift-amber">
                        {course.department} {course.number}
                      </span>
                      <p className="text-xs text-foreground mt-0.5 leading-snug">
                        {course.name}
                      </p>
                    </div>
                    <Badge className="bg-sift-blue/15 text-sift-blue border-sift-blue/20 text-[10px] font-mono px-1.5 py-0 h-4 shrink-0">
                      {course.credits} cr
                    </Badge>
                  </div>

                  {/* Prerequisites */}
                  {course.prereqs.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Prereqs
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {course.prereqs.map((group, gi) => (
                          <div key={gi} className="flex items-center gap-1">
                            {gi > 0 && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                +
                              </span>
                            )}
                            {group.map((prereq, pi) => (
                              <span key={pi} className="flex items-center gap-1">
                                {pi > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.prereqs.length === 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Prereqs
                      </span>
                      <p className="text-[10px] text-sift-green mt-1">
                        None
                      </p>
                    </div>
                  )}

                  {/* Semesters offered */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-muted-foreground">
                      Offered
                    </span>
                    <div className="flex gap-1">
                      {course.semesters_offered.map((sem) => (
                        <Badge
                          key={sem}
                          className="bg-sift-amber/10 text-sift-amber border-sift-amber/15 text-[10px] px-1.5 py-0 h-4"
                        >
                          {sem}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
