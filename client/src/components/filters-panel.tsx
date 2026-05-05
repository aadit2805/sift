"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { UserPreferences } from "@/lib/types";

export function FiltersPanel({
  preferences,
  onFiltersChange,
}: {
  preferences: UserPreferences;
  onFiltersChange: (filters: Partial<UserPreferences>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [courseInput, setCourseInput] = useState("");

  const addExcludedCourse = () => {
    const code = courseInput.trim().toUpperCase();
    if (!code) return;
    if (preferences.excluded_courses.includes(code)) {
      setCourseInput("");
      return;
    }
    onFiltersChange({
      excluded_courses: [...preferences.excluded_courses, code],
    });
    setCourseInput("");
  };

  const removeExcludedCourse = (code: string) => {
    onFiltersChange({
      excluded_courses: preferences.excluded_courses.filter((c) => c !== code),
    });
  };

  const toggleTime = (time: "morning" | "afternoon" | "evening") => {
    const current = preferences.preferred_times;
    const next = current.includes(time)
      ? current.filter((t) => t !== time)
      : [...current, time];
    onFiltersChange({ preferred_times: next.length > 0 ? next : current });
  };

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Filters
          </span>
        </div>
        <div className="flex items-center gap-2">
          {preferences.excluded_courses.length > 0 && (
            <span className="text-[10px] font-mono text-sift-amber tabular-nums">
              {preferences.excluded_courses.length} excluded
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/50">
            {/* Excluded courses */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Exclude Courses
              </span>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={courseInput}
                  onChange={(e) => setCourseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExcludedCourse();
                    }
                  }}
                  placeholder="e.g. CSCE 314"
                  className="h-8 text-xs font-mono bg-background"
                />
                <button
                  onClick={addExcludedCourse}
                  className="shrink-0 h-8 px-2.5 text-xs rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Add
                </button>
              </div>
              {preferences.excluded_courses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {preferences.excluded_courses.map((code) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="font-mono text-[10px] px-1.5 py-0 h-5 gap-1 cursor-pointer hover:bg-destructive/10 hover:text-sift-red transition-colors"
                      onClick={() => removeExcludedCourse(code)}
                    >
                      {code}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Credit hours */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Credit Hours
              </span>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Target semester load
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {preferences.min_credits}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full relative">
                  <div
                    className="absolute inset-y-0 bg-sift-amber/30 rounded-full"
                    style={{
                      left: `${((preferences.min_credits - 1) / 20) * 100}%`,
                      right: `${100 - ((preferences.max_credits - 1) / 20) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {preferences.max_credits}
                </span>
              </div>
            </div>

            {/* Time preferences */}
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Preferred Times
              </span>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Applies when section data is available
              </p>
              <div className="flex gap-1.5 mt-1.5">
                {(["morning", "afternoon", "evening"] as const).map((time) => {
                  const active = preferences.preferred_times.includes(time);
                  return (
                    <button
                      key={time}
                      onClick={() => toggleTime(time)}
                      className={`flex-1 h-7 text-[10px] rounded-md border transition-colors ${
                        active
                          ? "border-sift-amber/30 bg-sift-amber/8 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent/50"
                      }`}
                    >
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
