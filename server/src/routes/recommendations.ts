import { Router } from "express";
import { z } from "zod";
import { supabase } from "../db/supabase.js";
import { scoreCourse, rankCourses } from "../services/scoring.js";
import { detectKillerCombos } from "../services/workload.js";
import type { UserPreferences, DegreeRequirement } from "../types/index.js";
import { DEFAULT_PREFERENCES } from "../types/index.js";
import { buildSatisfiedSet, computeRemainingCourseKeys } from "../services/requirements.js";

export const recommendationsRouter = Router();

const RecommendationsSchema = z.object({
  major: z.string().max(10).optional(),
  completed_courses: z.array(z.string().max(20)).max(200).default([]),
  in_progress_courses: z.array(z.string().max(20)).max(50).default([]),
  preferences: z.object({
    weight_gpa: z.number().min(0).max(1).optional(),
    weight_professor: z.number().min(0).max(1).optional(),
    weight_would_take_again: z.number().min(0).max(1).optional(),
    weight_difficulty: z.number().min(0).max(1).optional(),
    weight_requirement: z.number().min(0).max(1).optional(),
    weight_schedule: z.number().min(0).max(1).optional(),
    min_credits: z.number().min(1).max(21).optional(),
    max_credits: z.number().min(1).max(21).optional(),
    preferred_times: z.array(z.enum(["morning", "afternoon", "evening"])).optional(),
    excluded_courses: z.array(z.string().max(20)).optional(),
  }).optional().default({}),
  semester: z.string().max(20).default("Fall 2026"),
});

// POST /api/recommendations - get personalized course recommendations
recommendationsRouter.post("/", async (req, res) => {
  try {
    const parsed = RecommendationsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ data: null, error: "Invalid request body" });
      return;
    }

    const {
      major,
      completed_courses,
      in_progress_courses,
      preferences,
      semester,
    } = parsed.data;

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

    // Build satisfied set including equivalents
    const satisfiedCourses = buildSatisfiedSet(excludedSet, requirements);

    // 2. Compute remaining requirements
    const { remainingReqs, allRemainingKeys: allRemainingCourseKeys } =
      computeRemainingCourseKeys(requirements, satisfiedCourses);

    if (allRemainingCourseKeys.length === 0) {
      res.json({ data: { courses: [], warnings: [] }, error: null });
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
      res.json({ data: { courses: [], warnings: [] }, error: null });
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
    const warnings = detectKillerCombos(ranked, userPrefs.max_credits);

    res.json({ data: { courses: ranked, warnings }, error: null });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
