import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { migrateLocalData } from "@/lib/api";
import { queryKeys } from "@/lib/queries";

const MIGRATED_KEY = "sift_migrated";

export function useMigrateLocalData() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isSignedIn || attempted.current) return;

    // Check if already migrated
    try {
      if (localStorage.getItem(MIGRATED_KEY)) return;
    } catch {
      return;
    }

    attempted.current = true;

    const completedRaw = localStorage.getItem("sift_completed_courses");
    const inProgressRaw = localStorage.getItem("sift_in_progress_courses");
    const weightsRaw = localStorage.getItem("sift_weights");
    const semester = localStorage.getItem("sift_semester");

    const completed = completedRaw ? JSON.parse(completedRaw) : [];
    const inProgress = inProgressRaw ? JSON.parse(inProgressRaw) : [];
    const preferences = weightsRaw ? JSON.parse(weightsRaw) : undefined;

    // Nothing to migrate
    if (completed.length === 0 && inProgress.length === 0 && !preferences && !semester) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }

    migrateLocalData({
      completed_courses: completed.length > 0 ? completed : undefined,
      in_progress_courses: inProgress.length > 0 ? inProgress : undefined,
      preferences,
      semester: semester || undefined,
    }).then((result) => {
      if (!result.error) {
        localStorage.setItem(MIGRATED_KEY, "1");
        localStorage.removeItem("sift_completed_courses");
        localStorage.removeItem("sift_in_progress_courses");
        localStorage.removeItem("sift_weights");
        localStorage.removeItem("sift_semester");
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
        queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.degreePlan.all });
      }
    });
  }, [isSignedIn, queryClient]);
}
