"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCourses } from "@/lib/queries";

type CourseState = "none" | "completed" | "in_progress";

export function CourseEditor({
  initialCourses,
  initialInProgress = [],
  onSave,
  onCancel,
}: {
  initialCourses: string[];
  initialInProgress?: string[];
  onSave: (completed: string[], inProgress: string[]) => void;
  onCancel?: () => void;
}) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCourses.map((c) => c.toUpperCase()))
  );
  const [inProgress, setInProgress] = useState<Set<string>>(
    new Set(initialInProgress.map((c) => c.toUpperCase()))
  );
  const [search, setSearch] = useState("");

  const { data: allCourses = [], isLoading: loading } = useCourses();

  const filtered = useMemo(() => {
    if (!search.trim()) return allCourses;
    const q = search.toLowerCase();
    return allCourses.filter(
      (c) =>
        `${c.department} ${c.number}`.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [search, allCourses]);

  const getState = (code: string): CourseState => {
    if (completed.has(code)) return "completed";
    if (inProgress.has(code)) return "in_progress";
    return "none";
  };

  // Tri-state cycle: none → completed → in_progress → none
  const toggle = (code: string) => {
    const state = getState(code);
    const nextCompleted = new Set(completed);
    const nextIP = new Set(inProgress);

    if (state === "none") {
      nextCompleted.add(code);
    } else if (state === "completed") {
      nextCompleted.delete(code);
      nextIP.add(code);
    } else {
      nextIP.delete(code);
    }

    setCompleted(nextCompleted);
    setInProgress(nextIP);
  };

  const removeChip = (code: string) => {
    const nextCompleted = new Set(completed);
    const nextIP = new Set(inProgress);
    nextCompleted.delete(code);
    nextIP.delete(code);
    setCompleted(nextCompleted);
    setInProgress(nextIP);
  };

  const handleSave = () => {
    onSave(Array.from(completed), Array.from(inProgress));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            My Courses
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completed.size} completed, {inProgress.size} in progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs h-7"
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            className="text-xs h-7 bg-sift-amber text-primary-foreground hover:bg-sift-amber/90"
          >
            Save
          </Button>
        </div>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search courses..."
        className="h-8 bg-background border-border text-xs"
      />

      {/* Selected chips */}
      {(completed.size > 0 || inProgress.size > 0) && (
        <div className="flex flex-wrap gap-1">
          {Array.from(completed)
            .sort()
            .map((code) => (
              <Badge
                key={code}
                className="bg-sift-green/10 text-sift-green border-sift-green/15 text-[9px] font-mono px-1.5 py-0 h-5 cursor-pointer hover:bg-sift-green/20 rounded-full"
                onClick={() => removeChip(code)}
              >
                {code}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ml-1"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Badge>
            ))}
          {Array.from(inProgress)
            .sort()
            .map((code) => (
              <Badge
                key={code}
                className="bg-sift-amber/10 text-sift-amber border-sift-amber/15 text-[9px] font-mono px-1.5 py-0 h-5 cursor-pointer hover:bg-sift-amber/20 rounded-full"
                onClick={() => removeChip(code)}
              >
                {code}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ml-1"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Badge>
            ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-border" />
          Not taken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sift-green border-sift-green" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sift-amber border-sift-amber" />
          In Progress
        </span>
      </div>

      {/* Course list */}
      <ScrollArea className="h-64 border border-border rounded-lg">
        {loading ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Loading courses...
            </p>
          </div>
        ) : (
          <div className="p-1">
            {filtered.map((course) => {
              const code = `${course.department} ${course.number}`;
              const state = getState(code);
              return (
                <button
                  key={course.id}
                  onClick={() => toggle(code)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                    ${state === "completed" ? "bg-sift-green/6" : state === "in_progress" ? "bg-sift-amber/6" : "hover:bg-accent/50"}
                  `}
                >
                  <div
                    className={`
                      w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                      ${
                        state === "completed"
                          ? "bg-sift-green border-sift-green"
                          : state === "in_progress"
                            ? "bg-sift-amber border-sift-amber"
                            : "border-border"
                      }
                    `}
                  >
                    {state === "completed" && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {state === "in_progress" && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <circle cx="12" cy="12" r="4" fill="white" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-medium text-foreground">
                      {code}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 truncate">
                      {course.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto shrink-0">
                    {course.credits} cr
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                No courses found
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
