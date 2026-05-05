import type { DegreeRequirement, RemainingRequirement } from "../types/index.js";

function getCourseCredits(code: string, req: DegreeRequirement): number {
  return req.credits_map?.[code] ?? 3;
}

/**
 * Build a set of all satisfied courses including equivalents.
 * Both completed and in-progress courses count as "satisfied" for this purpose.
 */
export function buildSatisfiedSet(
  excludedCourses: Set<string>,
  requirements: DegreeRequirement[],
): Set<string> {
  const satisfied = new Set(excludedCourses);
  for (const req of requirements) {
    if (!req.equivalents) continue;
    for (const [canonical, equivs] of Object.entries(req.equivalents)) {
      if (excludedCourses.has(canonical.toUpperCase())) {
        for (const eq of equivs) satisfied.add(eq.toUpperCase());
      } else {
        for (const eq of equivs) {
          if (excludedCourses.has(eq.toUpperCase())) {
            satisfied.add(canonical.toUpperCase());
            break;
          }
        }
      }
    }
  }
  return satisfied;
}

/**
 * Compute remaining requirements for a degree plan given completed/in-progress courses.
 * Returns per-category breakdown with credits tracking and satisfaction status.
 */
export function computeRemaining(
  requirements: DegreeRequirement[],
  completedSet: Set<string>,
  inProgressSet: Set<string>,
): {
  remaining: RemainingRequirement[];
  totalRequired: number;
  totalCompleted: number;
  totalInProgress: number;
  progressPct: number;
} {
  const excludedSet = new Set([...completedSet, ...inProgressSet]);
  const satisfiedCourses = buildSatisfiedSet(excludedSet, requirements);

  const remaining: RemainingRequirement[] = requirements.map((req) => {
    const selectionRule: "all" | "pick" = req.selection_rule ?? "all";
    const completedFromCategory: string[] = [];
    const inProgressFromCategory: string[] = [];
    const remainingCourses: string[] = [];
    const equivalentMatches: Record<string, string> = {};
    let creditsCompleted = 0;
    let creditsInProgress = 0;

    for (const course of req.courses) {
      const courseUpper = course.toUpperCase();

      if (completedSet.has(courseUpper)) {
        completedFromCategory.push(course);
        creditsCompleted += getCourseCredits(course, req);
      } else if (inProgressSet.has(courseUpper)) {
        inProgressFromCategory.push(course);
        creditsInProgress += getCourseCredits(course, req);
      } else {
        const equivs: string[] | undefined = req.equivalents?.[course];
        const matchedCompleted = equivs?.find((eq: string) => completedSet.has(eq.toUpperCase()));

        if (matchedCompleted) {
          completedFromCategory.push(course);
          equivalentMatches[course] = matchedCompleted;
          creditsCompleted += getCourseCredits(matchedCompleted, req);
        } else {
          const matchedIP = equivs?.find((eq: string) => inProgressSet.has(eq.toUpperCase()));
          if (matchedIP) {
            inProgressFromCategory.push(course);
            equivalentMatches[course] = matchedIP;
            creditsInProgress += getCourseCredits(matchedIP, req);
          } else {
            remainingCourses.push(course);
          }
        }
      }
    }

    let isSatisfied: boolean;
    if (selectionRule === "all") {
      isSatisfied = remainingCourses.length === 0 && inProgressFromCategory.length === 0;
    } else {
      isSatisfied = creditsCompleted >= req.credits_needed;
      if (isSatisfied) {
        remainingCourses.length = 0;
        inProgressFromCategory.length = 0;
      }
    }

    return {
      ...req,
      remaining_courses: remainingCourses,
      completed_courses: completedFromCategory,
      in_progress_courses: inProgressFromCategory,
      credits_completed: creditsCompleted,
      credits_in_progress: creditsInProgress,
      is_satisfied: isSatisfied,
      equivalent_matches: Object.keys(equivalentMatches).length > 0 ? equivalentMatches : undefined,
    };
  });

  const totalRequired = requirements.reduce((sum, r) => sum + r.credits_needed, 0);
  const totalCompleted = remaining.reduce(
    (sum, r) => sum + Math.min(r.credits_completed, r.credits_needed), 0
  );
  const totalInProgress = remaining.reduce(
    (sum, r) => sum + Math.min(r.credits_in_progress, Math.max(0, r.credits_needed - r.credits_completed)), 0
  );

  return {
    remaining,
    totalRequired,
    totalCompleted,
    totalInProgress,
    progressPct: totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0,
  };
}

/**
 * Compute remaining course keys from requirements, filtering out satisfied courses.
 * Simplified version for the recommendations route that just needs the course list.
 */
export function computeRemainingCourseKeys(
  requirements: DegreeRequirement[],
  satisfiedCourses: Set<string>,
): { remainingReqs: DegreeRequirement[]; allRemainingKeys: string[] } {
  const remainingReqs = requirements
    .map((req) => {
      const selectionRule = req.selection_rule ?? "all";

      let creditsCompleted = 0;
      for (const course of req.courses) {
        if (satisfiedCourses.has(course.toUpperCase())) {
          creditsCompleted += getCourseCredits(course, req);
        }
      }

      if (selectionRule === "pick" && creditsCompleted >= req.credits_needed) {
        return { ...req, courses: [] as string[] };
      }

      return {
        ...req,
        courses: req.courses.filter((c: string) => !satisfiedCourses.has(c.toUpperCase())),
      };
    })
    .filter((req) => req.courses.length > 0);

  const allRemainingKeys = remainingReqs.flatMap((r) => r.courses);
  return { remainingReqs, allRemainingKeys };
}
