export interface Course {
  id: string;
  department: string;
  number: string;
  name: string;
  credits: number;
  description: string;
  prereqs: string[][];
  coreqs: string[];
  semesters_offered: string[];
}

export interface Section {
  id: string;
  course_id: string;
  semester: string;
  professor_id: string;
  time_slot: string;
  days: string;
  location: string;
  capacity: number;
  enrolled: number;
}

export interface Professor {
  id: string;
  name: string;
  department: string;
  rmp_id: string | null;
  rmp_rating: number | null;
  rmp_difficulty: number | null;
  rmp_would_take_again: number | null;
  rmp_tags: string[];
}

export interface GradeDistribution {
  id: string;
  course_id: string;
  professor_id: string | null;
  semester: string;
  a_pct: number;
  b_pct: number;
  c_pct: number;
  d_pct: number;
  f_pct: number;
  q_pct: number;
  avg_gpa: number;
  enrollment: number;
}

export interface DegreeRequirement {
  type: "core" | "elective" | "lab" | "math" | "science" | "capstone";
  category: string;
  courses: string[];
  credits_needed: number;
}

export interface DegreePlan {
  id: string;
  major: string;
  catalog_year: string;
  requirements: DegreeRequirement[];
}

export interface UserProfile {
  id: string;
  email: string;
  major: string;
  catalog_year: string;
  completed_courses: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  weight_gpa: number;
  weight_professor: number;
  weight_would_take_again: number;
  weight_difficulty: number;
  weight_requirement: number;
  weight_schedule: number;
  min_credits: number;
  max_credits: number;
  preferred_times: ("morning" | "afternoon" | "evening")[];
  excluded_courses: string[];
}

export interface ScoredCourse {
  course: Course;
  professor: Professor | null;
  grade_distribution: GradeDistribution | null;
  section: Section | null;
  score: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
}

export interface ScoreBreakdown {
  gpa_score: number;
  professor_score: number;
  would_take_again_score: number;
  difficulty_penalty: number;
  requirement_bonus: number;
  schedule_fit: number;
  total: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  weight_gpa: 0.25,
  weight_professor: 0.20,
  weight_would_take_again: 0.15,
  weight_difficulty: 0.15,
  weight_requirement: 0.15,
  weight_schedule: 0.10,
  min_credits: 12,
  max_credits: 18,
  preferred_times: ["morning", "afternoon"],
  excluded_courses: [],
};
