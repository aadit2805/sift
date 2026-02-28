"use client";

import Link from "next/link";
import type { ScoredCourse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function getRequirementStyle(type: string) {
  switch (type) {
    case "core":
      return {
        accent: "border-l-sift-amber",
        badge: "bg-sift-amber/10 text-sift-amber border-sift-amber/20",
        label: "Core",
      };
    case "capstone":
      return {
        accent: "border-l-sift-purple",
        badge: "bg-sift-purple/10 text-sift-purple border-sift-purple/20",
        label: "Capstone",
      };
    case "elective":
      return {
        accent: "border-l-sift-blue",
        badge: "bg-sift-blue/8 text-sift-blue border-sift-blue/15",
        label: "Elective",
      };
    case "math":
    case "science":
      return {
        accent: "border-l-sift-green",
        badge: "bg-sift-green/8 text-sift-green border-sift-green/15",
        label: type.charAt(0).toUpperCase() + type.slice(1),
      };
    default:
      return {
        accent: "border-l-border",
        badge: "bg-muted text-muted-foreground",
        label: "Course",
      };
  }
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.5) return "text-sift-green";
  if (gpa >= 3.0) return "text-sift-amber";
  if (gpa >= 2.5) return "text-foreground";
  return "text-sift-red";
}

function rmpColor(rating: number): string {
  if (rating >= 4.0) return "text-sift-green";
  if (rating >= 3.5) return "text-sift-amber";
  if (rating >= 3.0) return "text-foreground";
  return "text-sift-red";
}

export function CourseCard({
  scored,
  index,
  requirementType = "core",
}: {
  scored: ScoredCourse;
  index: number;
  requirementType?: string;
}) {
  const style = getRequirementStyle(requirementType);
  const { course, professor, grade_distribution, section, score, breakdown, reasoning } = scored;
  const scorePercent = Math.min(Math.max(score, 0), 1);

  return (
    <div
      className={`
        animate-fade-up group relative rounded-lg border border-l-4 bg-card p-4 shadow-sm
        transition-all duration-200 hover:shadow-md
        ${style.accent}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <Link
              href={`/courses/${course.id}`}
              className="font-mono text-sm font-semibold tracking-wide text-foreground hover:text-sift-amber transition-colors"
            >
              {course.department} {course.number}
            </Link>
            <Badge
              className={`text-[10px] font-medium px-1.5 py-0 h-4 rounded-full ${style.badge}`}
            >
              {style.label}
            </Badge>
          </div>
          <h3 className="text-sm leading-snug text-muted-foreground truncate">
            {course.name}
          </h3>
        </div>

        {/* Score */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center shrink-0 bg-sift-amber/8 rounded-lg px-2.5 py-1.5">
              <span className="font-mono text-lg font-bold tabular-nums text-sift-amber leading-none">
                {(scorePercent * 100).toFixed(0)}
              </span>
              <span className="text-[9px] text-sift-amber-dim mt-0.5">
                match
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs space-y-1.5 p-3">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">GPA</span>
              <span className="font-mono">{(breakdown.gpa_score * 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Professor</span>
              <span className="font-mono">{(breakdown.professor_score * 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Take again</span>
              <span className="font-mono">{(breakdown.would_take_again_score * 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Difficulty</span>
              <span className="font-mono text-sift-red">-{(breakdown.difficulty_penalty * 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Req. bonus</span>
              <span className="font-mono text-sift-green">+{(breakdown.requirement_bonus * 100).toFixed(0)}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Score bar */}
      <div className="h-1 rounded-full bg-sift-surface-raised mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-sift-amber score-bar-fill"
          style={{ "--score": scorePercent } as React.CSSProperties}
        />
      </div>

      {/* Data grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
        {professor && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Prof</span>
            <Link
              href={`/professors/${professor.id}`}
              className="text-foreground truncate text-xs hover:text-sift-amber transition-colors"
            >
              {professor.name.split(', ')[0]}
            </Link>
            {professor.rmp_rating !== null && (
              <span className={`font-mono text-xs font-medium tabular-nums ${rmpColor(professor.rmp_rating)}`}>
                {professor.rmp_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {grade_distribution && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">GPA</span>
            <span className={`font-mono text-xs font-medium tabular-nums ${gpaColor(grade_distribution.avg_gpa)}`}>
              {grade_distribution.avg_gpa.toFixed(2)}
            </span>
            <span className="text-muted-foreground/60 text-[10px]">
              ({(grade_distribution.a_pct * 100).toFixed(0)}% A)
            </span>
          </div>
        )}

        {section && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Time</span>
              <span className="font-mono text-xs text-foreground/80">{section.days} {section.time_slot}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Seats</span>
              <span className="font-mono text-xs tabular-nums text-foreground/80">
                {section.enrolled}/{section.capacity}
              </span>
              {section.enrolled / section.capacity > 0.9 && (
                <span className="text-[9px] text-sift-red font-medium">FULL</span>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Credits</span>
          <span className="font-mono text-xs text-foreground/80">{course.credits}</span>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2.5 mt-1">
          {reasoning}
        </p>
      )}
    </div>
  );
}
