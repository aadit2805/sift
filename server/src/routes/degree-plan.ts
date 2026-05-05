import { Router } from "express";
import { z } from "zod";
import { supabase } from "../db/supabase.js";
import { computeRemaining } from "../services/requirements.js";

export const degreePlanRouter = Router();

// GET /api/degree-plan/:major - get degree plan for a major
degreePlanRouter.get("/:major", async (req, res) => {
  try {
    const major = req.params.major?.slice(0, 10);
    if (!major || !/^[A-Za-z]+$/.test(major)) {
      res.status(400).json({ data: null, error: "Invalid major" });
      return;
    }
    const { catalog_year } = req.query;

    let query = supabase
      .from("degree_plans")
      .select("*")
      .eq("major", major.toUpperCase());

    if (catalog_year && typeof catalog_year === "string") {
      query = query.eq("catalog_year", catalog_year);
    }

    const { data, error } = await query.order("catalog_year", { ascending: false }).limit(1).single();

    if (error) {
      res.status(404).json({ data: null, error: "No degree plan found" });
      return;
    }

    res.json({ data, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

const RemainingSchema = z.object({
  major: z.string().max(10),
  completed_courses: z.array(z.string().max(20)).max(200),
  in_progress_courses: z.array(z.string().max(20)).max(50).default([]),
});

// POST /api/degree-plan/remaining - compute remaining requirements
degreePlanRouter.post("/remaining", async (req, res) => {
  try {
    const parsed = RemainingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ data: null, error: "Invalid request: major and completed_courses required" });
      return;
    }

    const { major, completed_courses, in_progress_courses } = parsed.data;

    // Get the degree plan
    const { data: plan, error: planError } = await supabase
      .from("degree_plans")
      .select("*")
      .eq("major", major.toUpperCase())
      .order("catalog_year", { ascending: false })
      .limit(1)
      .single();

    if (planError || !plan) {
      res.status(404).json({ data: null, error: "No degree plan found" });
      return;
    }

    const completedSet = new Set(completed_courses.map((c: string) => c.toUpperCase().trim()));
    const inProgressSet = new Set(
      (in_progress_courses as string[]).map((c: string) => c.toUpperCase().trim())
    );

    const result = computeRemaining(plan.requirements, completedSet, inProgressSet);

    res.json({
      data: {
        plan,
        remaining: result.remaining,
        total_credits_required: result.totalRequired,
        total_credits_completed: result.totalCompleted,
        total_credits_in_progress: result.totalInProgress,
        progress_pct: result.progressPct,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
