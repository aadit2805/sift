import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { scoreCourse, rankCourses } from "../services/scoring.js";
import type { UserPreferences, DegreeRequirement } from "../types/index.js";
import { DEFAULT_PREFERENCES } from "../types/index.js";

export const recommendationsRouter = Router();

// POST /api/recommendations - get personalized course recommendations
recommendationsRouter.post("/", async (req, res) => {
  try {
    const {
      major,
      completed_courses = [],
      in_progress_courses = [],
      preferences = {},
      semester = "Fall 2026",
    } = req.body;

    // Parse season from semester for filtering (e.g. "Fall 2026" → "Fall")
    const season = semester.split(" ")[0];

    const userPrefs: UserPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
    const completedSet = new Set(
      (completed_courses as string[]).map((c) => c.toUpperCase().trim())
    );
    const inProgressSet = new Set(
      (in_progress_courses as string[]).map((c: string) => c.toUpperCase().trim())
    );
    // Exclude both completed and in-progress from recommendations
    const excludedSet = new Set([...completedSet, ...inProgressSet]);
    // Both completed and in-progress satisfy prereqs
    const prereqSatisfiedSet = new Set([...completedSet, ...inProgressSet]);

    // 1. Get degree plan
    const { data: plan } = await supabase
      .from("degree_plans")
      .select("*")
      .eq("major", (major || "CS").toUpperCase())
      .order("catalog_year", { ascending: false })
      .limit(1)
      .single();

    const requirements: DegreeRequirement[] = plan?.requirements || [];

    // Build a set of all satisfied courses (completed or in-progress) including equivalents
    const satisfiedCourses = new Set(excludedSet);
    for (const req of requirements) {
      if (!req.equivalents) continue;
      for (const [canonical, equivs] of Object.entries(req.equivalents)) {
        if (excludedSet.has(canonical.toUpperCase())) {
          // Canonical completed/IP — mark all equivalents as satisfied too
          for (const eq of equivs) satisfiedCourses.add(eq.toUpperCase());
        } else {
          // Check if any equivalent is completed/IP — mark canonical as satisfied
          for (const eq of equivs) {
            if (excludedSet.has(eq.toUpperCase())) {
              satisfiedCourses.add(canonical.toUpperCase());
              break;
            }
          }
        }
      }
    }

    // Helper to get credit value for a course within a requirement
    function getCourseCredits(code: string, req: DegreeRequirement): number {
      return req.credits_map?.[code] ?? 3;
    }

    // 2. Compute remaining requirements (equivalency + pick-type aware)
    const remainingReqs = requirements
      .map((req) => {
        const selectionRule = req.selection_rule ?? "all";

        // Calculate credits completed in this category
        let creditsCompleted = 0;
        for (const course of req.courses) {
          if (satisfiedCourses.has(course.toUpperCase())) {
            creditsCompleted += getCourseCredits(course, req);
          }
        }

        // For pick-type requirements that are fully satisfied, return empty courses
        if (selectionRule === "pick" && creditsCompleted >= req.credits_needed) {
          return { ...req, courses: [] as string[] };
        }

        return {
          ...req,
          courses: req.courses.filter((c: string) => !satisfiedCourses.has(c.toUpperCase())),
        };
      })
      .filter((req) => req.courses.length > 0);

    // 3. Get all eligible courses (not completed, prereqs met)
    const allRemainingCourseKeys = remainingReqs.flatMap((r) => r.courses);

    if (allRemainingCourseKeys.length === 0) {
      res.json({ data: [], error: null });
      return;
    }

    // Parse course keys into department + number pairs for querying
    const coursePairs = allRemainingCourseKeys.map((key: string) => {
      const parts = key.split(" ");
      return { department: parts[0], number: parts.slice(1).join(" ") };
    });

    // Get courses from DB
    const departments = [...new Set(coursePairs.map((p) => p.department))];
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .in("department", departments);

    if (!courses || courses.length === 0) {
      res.json({ data: [], error: null });
      return;
    }

    // Filter to only remaining courses
    const remainingKeySet = new Set(allRemainingCourseKeys.map((k: string) => k.toUpperCase()));
    const eligibleCourses = courses.filter((c) =>
      remainingKeySet.has(`${c.department} ${c.number}`.toUpperCase())
    );

    // Filter by prereqs — in-progress courses satisfy prereqs for next semester
    const prereqReady = eligibleCourses.filter((course) => {
      if (!course.prereqs || course.prereqs.length === 0) return true;
      // prereqs is array of arrays (OR of AND groups)
      return course.prereqs.some((group: string[]) =>
        group.every((prereq: string) => prereqSatisfiedSet.has(prereq.toUpperCase()))
      );
    });

    // Filter by semester offered
    const semesterReady = prereqReady.filter((course) => {
      if (!course.semesters_offered || course.semesters_offered.length === 0) return true;
      return course.semesters_offered.some(
        (s: string) => s.toLowerCase().startsWith(season.toLowerCase())
      );
    });

    // Exclude user-excluded courses
    const filtered = semesterReady.filter(
      (c) => !userPrefs.excluded_courses.includes(`${c.department} ${c.number}`)
    );

    // 4. Get grade distributions and professors for eligible courses
    const courseIds = filtered.map((c) => c.id);
    const [gradesResult, sectionsResult] = await Promise.all([
      supabase
        .from("grade_distributions")
        .select("*, professors(*)")
        .in("course_id", courseIds),
      supabase
        .from("sections")
        .select("*, professors(*)")
        .in("course_id", courseIds)
        .eq("semester", semester),
    ]);

    const grades = gradesResult.data || [];
    const sections = sectionsResult.data || [];

    // 5. Score each (course, professor) combo
    const scored: ReturnType<typeof scoreCourse>[] = [];

    for (const course of filtered) {
      const courseGrades = grades.filter((g) => g.course_id === course.id);
      const courseSections = sections.filter((s) => s.course_id === course.id);

      // Group grade distributions by professor
      const profGradesMap = new Map<string, typeof courseGrades>();
      for (const g of courseGrades) {
        const pid = g.professor_id || "__none__";
        if (!profGradesMap.has(pid)) profGradesMap.set(pid, []);
        profGradesMap.get(pid)!.push(g);
      }

      // If no grade data at all, score the course with no professor
      if (profGradesMap.size === 0) {
        const section = courseSections[0] || null;
        const prof = section?.professors || null;
        scored.push(scoreCourse(course, prof, null, section, userPrefs, remainingReqs));
        continue;
      }

      // Score each professor separately
      for (const [pid, profGrades] of profGradesMap) {
        if (pid === "__none__") continue;

        // Pick the most recent semester's grade data for this professor
        const sortedGrades = [...profGrades].sort((a, b) =>
          b.semester.localeCompare(a.semester)
        );
        const bestGrade = sortedGrades[0];
        const prof = bestGrade.professors || null;

        // Find matching section for this professor
        const section = courseSections.find(
          (s) => s.professor_id === pid
        ) || null;

        scored.push(scoreCourse(course, prof, bestGrade, section, userPrefs, remainingReqs));
      }
    }

    const ranked = rankCourses(scored);

    res.json({ data: ranked, error: null });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
