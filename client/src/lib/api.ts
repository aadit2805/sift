import type {
  Course,
  ScoredCourse,
  Professor,
  DegreeProgress,
  UserPreferences,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetcher<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { data: null, error: "Failed to connect to API" };
  }
}

export async function getCourses(params?: {
  department?: string;
  search?: string;
  semester?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.department) searchParams.set("department", params.department);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.semester) searchParams.set("semester", params.semester);
  const qs = searchParams.toString();
  return fetcher<Course[]>(`/api/courses${qs ? `?${qs}` : ""}`);
}

export async function getCourse(id: string) {
  return fetcher<
    Course & {
      sections: (import("./types").Section & { professors: Professor })[];
      grade_distributions: (import("./types").GradeDistribution & {
        professors: { name: string };
      })[];
    }
  >(`/api/courses/${id}`);
}

export async function getRecommendations(params: {
  major?: string;
  completed_courses: string[];
  preferences?: Partial<UserPreferences>;
  semester?: string;
}) {
  return fetcher<ScoredCourse[]>("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getProfessors(params?: {
  department?: string;
  search?: string;
  course_id?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.department) searchParams.set("department", params.department);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.course_id) searchParams.set("course_id", params.course_id);
  const qs = searchParams.toString();
  return fetcher<Professor[]>(`/api/professors${qs ? `?${qs}` : ""}`);
}

export async function getProfessor(id: string) {
  return fetcher<
    Professor & {
      grade_history: (import("./types").GradeDistribution & {
        courses: { department: string; number: string; name: string };
      })[];
    }
  >(`/api/professors/${id}`);
}

export async function getDegreePlan(major: string) {
  return fetcher<import("./types").DegreePlan>(
    `/api/degree-plan/${major}`
  );
}

export async function getRemainingRequirements(
  major: string,
  completedCourses: string[]
) {
  return fetcher<DegreeProgress>("/api/degree-plan/remaining", {
    method: "POST",
    body: JSON.stringify({
      major,
      completed_courses: completedCourses,
    }),
  });
}
