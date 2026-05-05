import type { Course } from "../types/index.js";

/**
 * Prereq graph built from courses.prereqs data.
 * Operates on course keys like "CSCE 312".
 */
export class PrereqGraph {
  // course → courses that directly depend on it
  private dependents = new Map<string, Set<string>>();
  // course → its direct prerequisites (all mentioned across OR/AND groups)
  private prerequisites = new Map<string, string[][]>();
  private courseSet: Set<string>;

  constructor(courses: Course[]) {
    this.courseSet = new Set(courses.map((c) => `${c.department} ${c.number}`.toUpperCase()));

    for (const course of courses) {
      const key = `${course.department} ${course.number}`.toUpperCase();
      this.prerequisites.set(key, course.prereqs || []);

      // Build dependents map: for every prereq mentioned, this course depends on it
      for (const group of course.prereqs || []) {
        for (const prereq of group) {
          const pKey = prereq.toUpperCase();
          if (!this.dependents.has(pKey)) this.dependents.set(pKey, new Set());
          this.dependents.get(pKey)!.add(key);
        }
      }
    }
  }

  /**
   * Check if a course's prereqs are satisfied.
   * prereqs is OR-of-AND: at least one AND group must be fully satisfied.
   */
  arePrereqsMet(courseKey: string, completed: Set<string>): boolean {
    const prereqs = this.prerequisites.get(courseKey.toUpperCase());
    if (!prereqs || prereqs.length === 0) return true;
    return prereqs.some((group) =>
      group.every((p) => completed.has(p.toUpperCase()))
    );
  }

  /**
   * Get courses from the remaining set that are ready to take
   * (prereqs met + offered in the given season).
   */
  getReadyCourses(
    remaining: string[],
    completed: Set<string>,
    courseLookup: Map<string, Course>,
    season: string,
  ): string[] {
    return remaining.filter((key) => {
      if (!this.arePrereqsMet(key, completed)) return false;
      const course = courseLookup.get(key.toUpperCase());
      if (!course) return false;
      if (!course.semesters_offered || course.semesters_offered.length === 0) return true;
      return course.semesters_offered.some(
        (s) => s.toLowerCase() === season.toLowerCase()
      );
    });
  }

  /**
   * Count how many remaining courses are transitively unlocked by completing a course.
   * Used by the "fastest" objective to prioritize courses that unblock the most dependents.
   */
  countUnlocked(courseKey: string, remaining: Set<string>, completed: Set<string>): number {
    const simCompleted = new Set(completed);
    simCompleted.add(courseKey.toUpperCase());

    let count = 0;
    const queue = [courseKey.toUpperCase()];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = this.dependents.get(current);
      if (!deps) continue;

      for (const dep of deps) {
        if (!remaining.has(dep) || visited.has(dep)) continue;
        if (this.arePrereqsMet(dep, simCompleted)) {
          count++;
          queue.push(dep);
          simCompleted.add(dep);
        }
      }
    }

    return count;
  }

  /**
   * Topological sort of the given course keys using Kahn's algorithm.
   * Returns courses in valid prerequisite order.
   */
  topologicalSort(courseKeys: string[]): string[] {
    const keySet = new Set(courseKeys.map((k) => k.toUpperCase()));
    const inDegree = new Map<string, number>();
    const localDeps = new Map<string, string[]>();

    // Initialize
    for (const key of keySet) {
      inDegree.set(key, 0);
      localDeps.set(key, []);
    }

    // Build local edges (only within the given course set)
    for (const key of keySet) {
      const prereqs = this.prerequisites.get(key);
      if (!prereqs) continue;
      // Use all mentioned prereqs as edges for ordering purposes
      for (const group of prereqs) {
        for (const p of group) {
          const pKey = p.toUpperCase();
          if (keySet.has(pKey)) {
            inDegree.set(key, (inDegree.get(key) || 0) + 1);
            if (!localDeps.has(pKey)) localDeps.set(pKey, []);
            localDeps.get(pKey)!.push(key);
          }
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [key, deg] of inDegree) {
      if (deg === 0) queue.push(key);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);
      for (const dep of localDeps.get(node) || []) {
        const newDeg = (inDegree.get(dep) || 1) - 1;
        inDegree.set(dep, newDeg);
        if (newDeg === 0) queue.push(dep);
      }
    }

    // If some courses weren't reached (cycle), append them at the end
    for (const key of keySet) {
      if (!sorted.includes(key)) sorted.push(key);
    }

    return sorted;
  }

  /**
   * Compute the critical path length — the longest chain of prereqs
   * within the remaining courses. This is the minimum number of semesters needed.
   */
  criticalPath(remainingKeys: string[]): { path: string[]; length: number } {
    const keySet = new Set(remainingKeys.map((k) => k.toUpperCase()));
    const memo = new Map<string, string[]>();

    const longestFrom = (key: string): string[] => {
      if (memo.has(key)) return memo.get(key)!;

      const deps = this.dependents.get(key);
      let best: string[] = [];

      if (deps) {
        for (const dep of deps) {
          if (!keySet.has(dep)) continue;
          const chain = longestFrom(dep);
          if (chain.length > best.length) best = chain;
        }
      }

      const result = [key, ...best];
      memo.set(key, result);
      return result;
    };

    let longest: string[] = [];
    for (const key of keySet) {
      // Only start from roots (courses with no prereqs in the remaining set)
      const prereqs = this.prerequisites.get(key);
      const hasPrereqInSet = prereqs?.some((group) =>
        group.some((p) => keySet.has(p.toUpperCase()))
      );
      if (!hasPrereqInSet) {
        const chain = longestFrom(key);
        if (chain.length > longest.length) longest = chain;
      }
    }

    return { path: longest, length: longest.length };
  }
}
