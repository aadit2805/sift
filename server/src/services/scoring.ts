import type {
  Course,
  Professor,
  GradeDistribution,
  Section,
  UserPreferences,
  ScoredCourse,
  ScoreBreakdown,
  DegreeRequirement,
  DEFAULT_PREFERENCES,
} from "../types/index.js";

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function getTimeBucket(timeSlot: string): "morning" | "afternoon" | "evening" {
  const match = timeSlot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "morning";
  const hour = parseInt(match[1], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function scoreCourse(
  course: Course,
  professor: Professor | null,
  gradeDistribution: GradeDistribution | null,
  section: Section | null,
  preferences: UserPreferences,
  remainingRequirements: DegreeRequirement[],
): ScoredCourse {
  let gpaScore = 0.5;
  let professorScore = 0.5;
  let wouldTakeAgainScore = 0.5;
  let difficultyPenalty = 0.5;
  let requirementBonus = 0;
  let scheduleFit = 0.5;

  // Grade distribution scoring (0-1, higher is better)
  if (gradeDistribution) {
    gpaScore = normalize(gradeDistribution.avg_gpa, 1.5, 4.0);
  }

  // Professor scoring
  if (professor) {
    if (professor.rmp_rating !== null) {
      professorScore = normalize(professor.rmp_rating, 1.0, 5.0);
    }
    if (professor.rmp_would_take_again !== null) {
      wouldTakeAgainScore = normalize(professor.rmp_would_take_again, 0, 100);
    }
    if (professor.rmp_difficulty !== null) {
      difficultyPenalty = normalize(professor.rmp_difficulty, 1.0, 5.0);
    }
  }

  // Requirement priority
  const courseKey = `${course.department} ${course.number}`;
  for (const req of remainingRequirements) {
    if (req.courses.includes(courseKey)) {
      if (req.type === "core" || req.type === "capstone") {
        requirementBonus = 1.0;
      } else if (req.type === "lab" || req.type === "math" || req.type === "science") {
        requirementBonus = 0.8;
      } else {
        requirementBonus = 0.5;
      }
      break;
    }
  }

  // Schedule fit
  if (section && section.time_slot) {
    const bucket = getTimeBucket(section.time_slot);
    scheduleFit = preferences.preferred_times.includes(bucket) ? 1.0 : 0.2;
  }

  // Composite score
  const total =
    preferences.weight_gpa * gpaScore +
    preferences.weight_professor * professorScore +
    preferences.weight_would_take_again * wouldTakeAgainScore -
    preferences.weight_difficulty * difficultyPenalty +
    preferences.weight_requirement * requirementBonus +
    preferences.weight_schedule * scheduleFit;

  const breakdown: ScoreBreakdown = {
    gpa_score: gpaScore,
    professor_score: professorScore,
    would_take_again_score: wouldTakeAgainScore,
    difficulty_penalty: difficultyPenalty,
    requirement_bonus: requirementBonus,
    schedule_fit: scheduleFit,
    total,
  };

  // Generate reasoning string
  const parts: string[] = [];
  if (gradeDistribution) {
    parts.push(`avg GPA ${gradeDistribution.avg_gpa.toFixed(2)} (${(gradeDistribution.a_pct * 100).toFixed(0)}% A rate)`);
  }
  if (professor?.rmp_rating) {
    parts.push(`${professor.name}: ${professor.rmp_rating}/5 RMP`);
  }
  if (requirementBonus > 0) {
    parts.push(requirementBonus === 1.0 ? "core requirement" : "degree requirement");
  }

  return {
    course,
    professor,
    grade_distribution: gradeDistribution,
    section,
    score: total,
    breakdown,
    reasoning: parts.join(" · "),
  };
}

export function rankCourses(scoredCourses: ScoredCourse[]): ScoredCourse[] {
  return [...scoredCourses].sort((a, b) => b.score - a.score);
}
