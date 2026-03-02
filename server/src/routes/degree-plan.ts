import { Router } from "express";
import { z } from "zod";
import { supabase } from "../db/supabase.js";

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

    function getCourseCredits(code: string, req: any): number {
      return req.credits_map?.[code] ?? 3;
    }

    // Diff each requirement category with equivalency + credit awareness
    const remaining = plan.requirements.map((req: any) => {
      const selectionRule: "all" | "pick" = req.selection_rule ?? "all";
      const completedFromCategory: string[] = [];
      const inProgressFromCategory: string[] = [];
      const remainingCourses: string[] = [];
      const equivalentMatches: Record<string, string> = {};
      let creditsCompleted = 0;
      let creditsInProgress = 0;

      for (const course of req.courses as string[]) {
        const courseUpper = course.toUpperCase();

        if (completedSet.has(courseUpper)) {
          // Direct completed match
          completedFromCategory.push(course);
          creditsCompleted += getCourseCredits(course, req);
        } else if (inProgressSet.has(courseUpper)) {
          // Direct in-progress match
          inProgressFromCategory.push(course);
          creditsInProgress += getCourseCredits(course, req);
        } else {
          // Check equivalents — completed first, then in-progress
          const equivs: string[] | undefined = req.equivalents?.[course];
          const matchedCompleted = equivs?.find((eq: string) => completedSet.has(eq.toUpperCase()));

          if (matchedCompleted) {
            completedFromCategory.push(course);
            equivalentMatches[course] = matchedCompleted;
            creditsCompleted += getCourseCredits(matchedCompleted, req);
          } else {
            const matchedIP = equivs?.find((eq: string) => inProgressSet.has(eq.toUpperCase()));
            if (matchedIP) {
              inProgressFromCategory.push(course);
              equivalentMatches[course] = matchedIP;
              creditsInProgress += getCourseCredits(matchedIP, req);
            } else {
              remainingCourses.push(course);
            }
          }
        }
      }

      // Determine satisfaction — only completed credits count
      let isSatisfied: boolean;
      if (selectionRule === "all") {
        isSatisfied = remainingCourses.length === 0 && inProgressFromCategory.length === 0;
      } else {
        // "pick" — satisfied once credits_needed is met (completed only)
        isSatisfied = creditsCompleted >= req.credits_needed;
        if (isSatisfied) {
          remainingCourses.length = 0;
          inProgressFromCategory.length = 0;
        }
      }

      return {
        ...req,
        remaining_courses: remainingCourses,
        completed_courses: completedFromCategory,
        in_progress_courses: inProgressFromCategory,
        credits_completed: creditsCompleted,
        credits_in_progress: creditsInProgress,
        is_satisfied: isSatisfied,
        equivalent_matches: Object.keys(equivalentMatches).length > 0 ? equivalentMatches : undefined,
      };
    });

    const totalRequired = plan.requirements.reduce((sum: number, r: any) => sum + r.credits_needed, 0);
    // Cap per-category credits at credits_needed to avoid over-counting
    const totalCompleted = remaining.reduce(
      (sum: number, r: any) => sum + Math.min(r.credits_completed, r.credits_needed), 0
    );
    const totalInProgress = remaining.reduce(
      (sum: number, r: any) => sum + Math.min(r.credits_in_progress, Math.max(0, r.credits_needed - r.credits_completed)), 0
    );

    res.json({
      data: {
        plan,
        remaining,
        total_credits_required: totalRequired,
        total_credits_completed: totalCompleted,
        total_credits_in_progress: totalInProgress,
        progress_pct: totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
