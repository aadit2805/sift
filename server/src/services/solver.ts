import { PrereqGraph } from "./prereq-graph.js";
import type { Course, DegreeRequirement, GeneratedPlan, PlannedCourse, PlanScores } from "../types/index.js";

export type PlanObjective = "fastest" | "highest_gpa" | "balanced" | "best_professors";

interface SolverInput {
  remainingCourses: Course[];
  completedCourses: Set<string>;
  inProgressCourses: Set<string>;
  startSemester: string;
  minCredits: number;
  maxCredits: number;
  includeSummer: boolean;
  requirements: DegreeRequirement[];
  gradeData: Map<string, number>;     // courseKey → avg_gpa
  professorData: Map<string, { rating: number; difficulty: number }>;  // courseKey → best prof
}

const OBJECTIVES: PlanObjective[] = ["fastest", "highest_gpa", "balanced", "best_professors"];

/**
 * Generate semester sequences starting from the given semester.
 * e.g. "Fall 2026" → ["Fall 2026", "Spring 2027", "Fall 2027", ...]
 */
function* semesterSequence(start: string, includeSummer: boolean): Generator<{ term: string; season: string }> {
  const parts = start.split(" ");
  let season = parts[0];
  let year = parseInt(parts[1], 10);

  const seasons = includeSummer ? ["Spring", "Summer", "Fall"] : ["Spring", "Fall"];

  // Find starting index
  let idx = seasons.indexOf(season);
  if (idx === -1) idx = 0;

  for (let i = 0; i < 30; i++) { // max 30 semesters (safety)
    const s = seasons[idx % seasons.length];
    yield { term: `${s} ${year}`, season: s };
    idx++;
    if (s === "Fall" || (!includeSummer && s === "Spring" && seasons[idx % seasons.length] === "Fall")) {
      // Don't increment year mid-cycle
    }
    // Increment year after Fall
    if (s === "Fall") year++;
  }
}

function getRequirementType(courseKey: string, requirements: DegreeRequirement[]): string {
  for (const req of requirements) {
    if (req.courses.some((c) => c.toUpperCase() === courseKey.toUpperCase())) {
      return req.type;
    }
  }
  return "elective";
}

/**
 * Priority function for course selection within a semester.
 * Returns a score — higher is better (selected first).
 */
function prioritize(
  courseKey: string,
  objective: PlanObjective,
  graph: PrereqGraph,
  remaining: Set<string>,
  completed: Set<string>,
  courseLookup: Map<string, Course>,
  gradeData: Map<string, number>,
  professorData: Map<string, { rating: number; difficulty: number }>,
): number {
  switch (objective) {
    case "fastest":
      // Prefer courses that unlock the most dependents
      return graph.countUnlocked(courseKey, remaining, completed) * 10 + 1;

    case "highest_gpa":
      // Prefer courses with higher avg GPA (easier courses first)
      return gradeData.get(courseKey.toUpperCase()) ?? 2.5;

    case "balanced": {
      // Prefer courses that are mid-difficulty (spread hard ones out)
      const diff = professorData.get(courseKey.toUpperCase())?.difficulty ?? 3.0;
      // Score inversely to how extreme the difficulty is (prefer ~3.0)
      return 5.0 - Math.abs(diff - 3.0);
    }

    case "best_professors":
      // Prefer courses with the highest-rated professors
      return professorData.get(courseKey.toUpperCase())?.rating ?? 2.5;
  }
}

/**
 * Run a single greedy-topological plan generation for a given objective.
 */
function generateSinglePlan(
  input: SolverInput,
  objective: PlanObjective,
): GeneratedPlan {
  const graph = new PrereqGraph(input.remainingCourses);
  const courseLookup = new Map<string, Course>();
  for (const c of input.remainingCourses) {
    courseLookup.set(`${c.department} ${c.number}`.toUpperCase(), c);
  }

  const completed = new Set([...input.completedCourses, ...input.inProgressCourses]);
  const remaining = new Set(
    input.remainingCourses.map((c) => `${c.department} ${c.number}`.toUpperCase())
  );

  const semesters: { term: string; courses: PlannedCourse[] }[] = [];
  const semGen = semesterSequence(input.startSemester, input.includeSummer);

  while (remaining.size > 0) {
    const { value: sem, done } = semGen.next();
    if (done) break;

    const ready = graph.getReadyCourses([...remaining], completed, courseLookup, sem.season);
    if (ready.length === 0) {
      // No courses available this semester — skip it (might be summer with nothing offered)
      continue;
    }

    // Score and sort by priority
    const scored = ready.map((key) => ({
      key,
      priority: prioritize(key, objective, graph, remaining, completed, courseLookup, input.gradeData, input.professorData),
    }));
    scored.sort((a, b) => b.priority - a.priority);

    // Greedily assign courses up to credit limit
    let credits = 0;
    const assigned: PlannedCourse[] = [];

    for (const { key } of scored) {
      const course = courseLookup.get(key);
      if (!course) continue;
      if (credits + course.credits > input.maxCredits) continue;
      if (assigned.length > 0 && credits + course.credits < input.minCredits && scored.length > assigned.length) {
        // Keep going to try to meet minimum
      }

      assigned.push({
        code: `${course.department} ${course.number}`,
        name: course.name,
        credits: course.credits,
        requirement_type: getRequirementType(key, input.requirements),
      });
      credits += course.credits;
      remaining.delete(key);
      completed.add(key);

      if (credits >= input.maxCredits) break;
    }

    if (assigned.length > 0) {
      semesters.push({ term: sem.term, courses: assigned });
    }
  }

  // Compute scores
  const scores = scorePlan(semesters, input);

  return { objective, semesters, scores };
}

function scorePlan(
  semesters: { term: string; courses: PlannedCourse[] }[],
  input: SolverInput,
): PlanScores {
  let totalGpaWeighted = 0;
  let totalCredits = 0;
  const semesterDifficulties: number[] = [];

  for (const sem of semesters) {
    let semDifficulty = 0;
    for (const course of sem.courses) {
      const key = course.code.toUpperCase();
      const gpa = input.gradeData.get(key) ?? 3.0;
      totalGpaWeighted += gpa * course.credits;
      totalCredits += course.credits;
      semDifficulty += input.professorData.get(key)?.difficulty ?? 3.0;
    }
    semesterDifficulties.push(semDifficulty);
  }

  const projectedGpa = totalCredits > 0 ? totalGpaWeighted / totalCredits : 0;

  // Workload variance — lower is more balanced
  const avgDiff = semesterDifficulties.length > 0
    ? semesterDifficulties.reduce((a, b) => a + b, 0) / semesterDifficulties.length
    : 0;
  const variance = semesterDifficulties.length > 0
    ? semesterDifficulties.reduce((sum, d) => sum + (d - avgDiff) ** 2, 0) / semesterDifficulties.length
    : 0;

  // Avg professor rating across all planned courses
  let totalRating = 0;
  let ratedCourses = 0;
  for (const sem of semesters) {
    for (const course of sem.courses) {
      const prof = input.professorData.get(course.code.toUpperCase());
      if (prof) {
        totalRating += prof.rating;
        ratedCourses++;
      }
    }
  }

  return {
    total_semesters: semesters.length,
    projected_gpa: Math.round(projectedGpa * 100) / 100,
    workload_variance: Math.round(variance * 100) / 100,
    avg_professor_rating: ratedCourses > 0 ? Math.round((totalRating / ratedCourses) * 100) / 100 : 0,
  };
}

/**
 * Generate 4 plan variants, one per objective.
 */
export function generatePlans(input: SolverInput): GeneratedPlan[] {
  return OBJECTIVES.map((objective) => generateSinglePlan(input, objective));
}
