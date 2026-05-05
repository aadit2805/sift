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
  equivalents?: Record<string, string[]>;
  selection_rule?: "all" | "pick";
  track?: string;
  credits_map?: Record<string, number>;
}

export interface DegreePlan {
  id: string;
  major: string;
  catalog_year: string;
  requirements: DegreeRequirement[];
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

export interface ScoredCourse {
  course: Course;
  professor: Professor | null;
  grade_distribution: GradeDistribution | null;
  section: Section | null;
  score: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
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

export interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  major: string;
  catalog_year: string;
  completed_courses: string[];
  in_progress_courses: string[];
  preferences: UserPreferences;
  semester: string | null;
}

export interface RemainingRequirement extends DegreeRequirement {
  remaining_courses: string[];
  completed_courses: string[];
  in_progress_courses: string[];
  credits_completed: number;
  credits_in_progress: number;
  is_satisfied: boolean;
  equivalent_matches?: Record<string, string>;
}

export interface DegreeProgress {
  plan: DegreePlan;
  remaining: RemainingRequirement[];
  total_credits_required: number;
  total_credits_completed: number;
  total_credits_in_progress: number;
  progress_pct: number;
}

// --- V2: Multi-Semester Planner Types ---

export interface PlannedCourse {
  code: string;
  name: string;
  credits: number;
  requirement_type: string;
}

export interface PlanScores {
  total_semesters: number;
  projected_gpa: number;
  workload_variance: number;
  avg_professor_rating: number;
}

export interface GeneratedPlan {
  objective: "fastest" | "highest_gpa" | "balanced" | "best_professors";
  semesters: { term: string; courses: PlannedCourse[] }[];
  scores: PlanScores;
}

export interface SemesterPlan {
  id: string;
  user_id: string;
  name: string;
  objective: string;
  semesters: { term: string; courses: PlannedCourse[] }[];
  scores: PlanScores;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkloadWarning {
  courses: [string, string];
  severity: "caution" | "danger";
  reason: string;
}

export interface RecommendationsResponse {
  courses: ScoredCourse[];
  warnings: WorkloadWarning[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  weight_gpa: 0.25,
  weight_professor: 0.20,
  weight_would_take_again: 0.15,
  weight_difficulty: 0.15,
  weight_requirement: 0.15,
  weight_schedule: 0,
  min_credits: 12,
  max_credits: 18,
  preferred_times: ["morning", "afternoon"],
  excluded_courses: [],
};
