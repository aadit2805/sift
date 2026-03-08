import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCourses,
  getCourse,
  getProfessors,
  getProfessor,
  getRecommendations,
  getDegreePlan,
  getRemainingRequirements,
  getUserProfile,
  updateUserProfile,
} from "./api";
import type { UserPreferences, UserProfile } from "./types";
import { getToken } from "./auth-token";

// --- Query key factory ---

export const queryKeys = {
  courses: {
    all: ["courses"] as const,
    list: (params?: { department?: string; search?: string; semester?: string }) =>
      ["courses", "list", params] as const,
    detail: (id: string) => ["courses", "detail", id] as const,
  },
  professors: {
    all: ["professors"] as const,
    list: (params?: { department?: string; search?: string; course_id?: string }) =>
      ["professors", "list", params] as const,
    detail: (id: string) => ["professors", "detail", id] as const,
  },
  recommendations: {
    all: ["recommendations"] as const,
    list: (params: {
      major?: string;
      completed_courses: string[];
      in_progress_courses?: string[];
      preferences?: Partial<UserPreferences>;
      semester?: string;
    }) => ["recommendations", "list", params] as const,
  },
  degreePlan: {
    all: ["degreePlan"] as const,
    detail: (major: string) => ["degreePlan", "detail", major] as const,
    remaining: (major: string, courses: string[], inProgress: string[] = []) =>
      ["degreePlan", "remaining", major, courses, inProgress] as const,
  },
  user: {
    all: ["user"] as const,
    profile: ["user", "profile"] as const,
  },
};

// --- Unwrap helper ---

function unwrap<T>(result: { data: T | null; error: string | null }): T {
  if (result.error) throw new Error(result.error);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

// --- Query hooks ---

export function useCourses(params?: {
  department?: string;
  search?: string;
  semester?: string;
}) {
  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => getCourses(params).then(unwrap),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => getCourse(id).then(unwrap),
    enabled: !!id,
  });
}

export function useProfessors(params?: {
  department?: string;
  search?: string;
  course_id?: string;
}) {
  return useQuery({
    queryKey: queryKeys.professors.list(params),
    queryFn: () => getProfessors(params).then(unwrap),
  });
}

export function useProfessor(id: string) {
  return useQuery({
    queryKey: queryKeys.professors.detail(id),
    queryFn: () => getProfessor(id).then(unwrap),
    enabled: !!id,
  });
}

export function useRecommendations(params: {
  major?: string;
  completed_courses: string[];
  in_progress_courses?: string[];
  preferences?: Partial<UserPreferences>;
  semester?: string;
}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.recommendations.list(params),
    queryFn: () => getRecommendations(params).then(unwrap),
    enabled,
  });
}

export function useDegreePlan(major: string) {
  return useQuery({
    queryKey: queryKeys.degreePlan.detail(major),
    queryFn: () => getDegreePlan(major).then(unwrap),
  });
}

export function useRemainingRequirements(
  major: string,
  completedCourses: string[],
  inProgressCourses: string[] = [],
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.degreePlan.remaining(major, completedCourses, inProgressCourses),
    queryFn: () => getRemainingRequirements(major, completedCourses, inProgressCourses).then(unwrap),
    enabled,
  });
}

// --- User profile hooks ---

export function useUserProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: () => getUserProfile().then(unwrap),
    enabled,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => updateUserProfile(data).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });
}

// --- Mutation hooks ---

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useTranscriptUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/transcript/parse`, {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data.courses as {
        code: string;
        name: string;
        credits: number;
        grade: string;
      }[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.degreePlan.all });
    },
  });
}
