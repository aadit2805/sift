import { Router } from "express";
import { z } from "zod";
import { supabase } from "../db/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { generatePlans } from "../services/solver.js";
import { buildSatisfiedSet, computeRemainingCourseKeys } from "../services/requirements.js";
import type { Course, DegreeRequirement } from "../types/index.js";

export const plannerRouter = Router();

const GenerateSchema = z.object({
  major: z.string().max(10),
  completed_courses: z.array(z.string().max(20)).max(200).default([]),
  in_progress_courses: z.array(z.string().max(20)).max(50).default([]),
  start_semester: z.string().max(20),
  min_credits: z.number().min(1).max(21).default(12),
  max_credits: z.number().min(1).max(21).default(18),
  include_summer: z.boolean().default(false),
});

// POST /api/planner/generate - generate 4 plan variants
plannerRouter.post("/generate", requireAuth, async (req, res) => {
  try {
    const parsed = GenerateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ data: null, error: "Invalid request body" });
      return;
    }

    const { major, completed_courses, in_progress_courses, start_semester, min_credits, max_credits, include_summer } = parsed.data;

    // 1. Get degree plan
    const { data: plan } = await supabase
      .from("degree_plans")
      .select("*")
      .eq("major", major.toUpperCase())
      .order("catalog_year", { ascending: false })
      .limit(1)
      .single();

    if (!plan) {
      res.status(404).json({ data: null, error: "No degree plan found" });
      return;
    }

    const requirements: DegreeRequirement[] = plan.requirements || [];
    const completedSet = new Set(completed_courses.map((c) => c.toUpperCase().trim()));
    const inProgressSet = new Set(in_progress_courses.map((c) => c.toUpperCase().trim()));
    const excludedSet = new Set([...completedSet, ...inProgressSet]);
    const satisfiedCourses = buildSatisfiedSet(excludedSet, requirements);

    // 2. Get remaining course keys
    const { allRemainingKeys } = computeRemainingCourseKeys(requirements, satisfiedCourses);

    if (allRemainingKeys.length === 0) {
      res.json({ data: [], error: null });
      return;
    }

    // 3. Fetch course data from DB
    const departments = [...new Set(allRemainingKeys.map((k) => k.split(" ")[0]))];
    const { data: allCourses } = await supabase
      .from("courses")
      .select("*")
      .in("department", departments);

    if (!allCourses || allCourses.length === 0) {
      res.json({ data: [], error: null });
      return;
    }

    const remainingKeySet = new Set(allRemainingKeys.map((k) => k.toUpperCase()));
    const remainingCourses: Course[] = allCourses.filter((c) =>
      remainingKeySet.has(`${c.department} ${c.number}`.toUpperCase())
    );

    // 4. Fetch grade distributions and professor data for scoring
    const courseIds = remainingCourses.map((c) => c.id);
    const [gradesResult, profsResult] = await Promise.all([
      supabase
        .from("grade_distributions")
        .select("course_id, avg_gpa, courses(department, number)")
        .in("course_id", courseIds),
      supabase
        .from("grade_distributions")
        .select("course_id, professors(rmp_rating, rmp_difficulty), courses(department, number)")
        .in("course_id", courseIds)
        .not("professor_id", "is", null),
    ]);

    // Build grade lookup: courseKey → best avg_gpa
    const gradeData = new Map<string, number>();
    for (const g of gradesResult.data || []) {
      const key = `${(g as any).courses?.department} ${(g as any).courses?.number}`.toUpperCase();
      const current = gradeData.get(key) ?? 0;
      if (g.avg_gpa > current) gradeData.set(key, g.avg_gpa);
    }

    // Build professor lookup: courseKey → best professor
    const professorData = new Map<string, { rating: number; difficulty: number }>();
    for (const p of profsResult.data || []) {
      const key = `${(p as any).courses?.department} ${(p as any).courses?.number}`.toUpperCase();
      const prof = (p as any).professors;
      if (!prof?.rmp_rating) continue;
      const current = professorData.get(key);
      if (!current || prof.rmp_rating > current.rating) {
        professorData.set(key, { rating: prof.rmp_rating, difficulty: prof.rmp_difficulty ?? 3.0 });
      }
    }

    // 5. Run solver
    const plans = generatePlans({
      remainingCourses,
      completedCourses: completedSet,
      inProgressCourses: inProgressSet,
      startSemester: start_semester,
      minCredits: min_credits,
      maxCredits: max_credits,
      includeSummer: include_summer,
      requirements,
      gradeData,
      professorData,
    });

    res.json({ data: plans, error: null });
  } catch (err) {
    console.error("Planner generate error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

const SaveSchema = z.object({
  name: z.string().max(100).default("My Plan"),
  objective: z.string().max(30),
  semesters: z.array(z.object({
    term: z.string(),
    courses: z.array(z.object({
      code: z.string(),
      name: z.string(),
      credits: z.number(),
      requirement_type: z.string(),
    })),
  })),
  scores: z.object({
    total_semesters: z.number(),
    projected_gpa: z.number(),
    workload_variance: z.number(),
    avg_professor_rating: z.number(),
  }),
});

// POST /api/planner/save - save a plan
plannerRouter.post("/save", requireAuth, async (req, res) => {
  try {
    const parsed = SaveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ data: null, error: "Invalid request body" });
      return;
    }

    // Get user id from clerk_id
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", req.clerkUserId)
      .single();

    if (!user) {
      res.status(404).json({ data: null, error: "User not found" });
      return;
    }

    const { data, error } = await supabase
      .from("semester_plans")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        objective: parsed.data.objective,
        semesters: parsed.data.semesters,
        scores: parsed.data.scores,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ data: null, error: "Failed to save plan" });
      return;
    }

    res.json({ data, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// GET /api/planner/plans - list user's saved plans
plannerRouter.get("/plans", requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", req.clerkUserId)
      .single();

    if (!user) {
      res.json({ data: [], error: null });
      return;
    }

    const { data, error } = await supabase
      .from("semester_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    res.json({ data: data || [], error: error?.message || null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// DELETE /api/planner/plans/:id - delete a plan
plannerRouter.delete("/plans/:id", requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", req.clerkUserId)
      .single();

    if (!user) {
      res.status(404).json({ data: null, error: "User not found" });
      return;
    }

    const { error } = await supabase
      .from("semester_plans")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", user.id);

    if (error) {
      res.status(500).json({ data: null, error: "Failed to delete plan" });
      return;
    }

    res.json({ data: { deleted: true }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
