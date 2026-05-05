import type { ScoredCourse } from "../types/index.js";

export interface WorkloadWarning {
  courses: [string, string];
  severity: "caution" | "danger";
  reason: string;
}

// Known tough pairings for CSCE — expand as needed
const KILLER_COMBOS: Record<string, { pair: string; reason: string }[]> = {
  "CSCE 312": [
    { pair: "CSCE 313", reason: "Computer Organization + Systems Programming is a heavy hardware-to-systems workload" },
  ],
  "CSCE 313": [
    { pair: "CSCE 314", reason: "Systems Programming + Programming Languages is notoriously heavy together" },
    { pair: "CSCE 315", reason: "Both have large team projects with tight deadlines" },
  ],
  "CSCE 410": [
    { pair: "CSCE 411", reason: "Operating Systems + Design & Analysis of Algorithms demands extreme time commitment" },
  ],
};

export function detectKillerCombos(
  scoredCourses: ScoredCourse[],
  maxCredits: number = 18,
): WorkloadWarning[] {
  // Only check top courses that would fit in a semester
  let credits = 0;
  const topCourses: ScoredCourse[] = [];
  for (const sc of scoredCourses) {
    if (credits + sc.course.credits > maxCredits) continue;
    topCourses.push(sc);
    credits += sc.course.credits;
  }

  const courseKeys = topCourses.map(
    (sc) => `${sc.course.department} ${sc.course.number}`
  );
  const warnings: WorkloadWarning[] = [];
  const seen = new Set<string>();

  // Check hardcoded combos
  for (let i = 0; i < courseKeys.length; i++) {
    const combos = KILLER_COMBOS[courseKeys[i]];
    if (!combos) continue;
    for (const combo of combos) {
      const j = courseKeys.indexOf(combo.pair);
      if (j === -1 || j === i) continue;
      const key = [courseKeys[i], combo.pair].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push({
        courses: [courseKeys[i], combo.pair],
        severity: "danger",
        reason: combo.reason,
      });
    }
  }

  // Heuristic: flag pairs where both professors have rmp_difficulty >= 4.0
  for (let i = 0; i < topCourses.length; i++) {
    const a = topCourses[i];
    if (!a.professor?.rmp_difficulty || a.professor.rmp_difficulty < 4.0) continue;
    for (let j = i + 1; j < topCourses.length; j++) {
      const b = topCourses[j];
      if (!b.professor?.rmp_difficulty || b.professor.rmp_difficulty < 4.0) continue;
      const key = [courseKeys[i], courseKeys[j]].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push({
        courses: [courseKeys[i], courseKeys[j]],
        severity: "caution",
        reason: `Both professors rated ${a.professor.rmp_difficulty.toFixed(1)} and ${b.professor.rmp_difficulty.toFixed(1)} difficulty — consider spreading these out`,
      });
    }
  }

  return warnings;
}
