import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const degreePlanRouter = Router();

// GET /api/degree-plan/:major - get degree plan for a major
degreePlanRouter.get("/:major", async (req, res) => {
  try {
    const { major } = req.params;
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
      res.status(404).json({ data: null, error: `No degree plan found for ${major}` });
      return;
    }

    res.json({ data, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// POST /api/degree-plan/remaining - compute remaining requirements
degreePlanRouter.post("/remaining", async (req, res) => {
  try {
    const { major, completed_courses } = req.body;

    if (!major || !Array.isArray(completed_courses)) {
      res.status(400).json({ data: null, error: "major and completed_courses required" });
      return;
    }

    // Get the degree plan
    const { data: plan, error: planError } = await supabase
      .from("degree_plans")
      .select("*")
      .eq("major", major.toUpperCase())
      .order("catalog_year", { ascending: false })
      .limit(1)
      .single();

    if (planError || !plan) {
      res.status(404).json({ data: null, error: `No degree plan found for ${major}` });
      return;
    }

    const completedSet = new Set(completed_courses.map((c: string) => c.toUpperCase().trim()));

    // Diff each requirement category
    const remaining = plan.requirements.map((req: any) => {
      const remainingCourses = req.courses.filter(
        (c: string) => !completedSet.has(c.toUpperCase())
      );
      const completedFromCategory = req.courses.filter((c: string) =>
        completedSet.has(c.toUpperCase())
      );

      return {
        ...req,
        remaining_courses: remainingCourses,
        completed_courses: completedFromCategory,
        credits_completed: completedFromCategory.length * 3,
        is_satisfied: remainingCourses.length === 0 || completedFromCategory.length * 3 >= req.credits_needed,
      };
    });

    const totalRequired = plan.requirements.reduce((sum: number, r: any) => sum + r.credits_needed, 0);
    const totalCompleted = remaining.reduce((sum: number, r: any) => sum + r.credits_completed, 0);

    res.json({
      data: {
        plan,
        remaining,
        total_credits_required: totalRequired,
        total_credits_completed: totalCompleted,
        progress_pct: totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
