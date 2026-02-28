import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const professorsRouter = Router();

// GET /api/professors - list professors with optional filters
professorsRouter.get("/", async (req, res) => {
  try {
    const { department, search, course_id } = req.query;

    let query = supabase.from("professors").select("*");

    if (department && typeof department === "string") {
      query = query.eq("department", department.toUpperCase());
    }

    if (search && typeof search === "string") {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query.order("name");

    if (error) {
      res.status(500).json({ data: null, error: error.message });
      return;
    }

    // If filtering by course, get professors who have taught this course
    if (course_id && typeof course_id === "string" && data) {
      const { data: grades } = await supabase
        .from("grade_distributions")
        .select("professor_id")
        .eq("course_id", course_id);

      if (grades) {
        const profIds = new Set(grades.map((g) => g.professor_id));
        const filtered = data.filter((p) => profIds.has(p.id));
        res.json({ data: filtered, error: null });
        return;
      }
    }

    res.json({ data, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// GET /api/professors/:id - get professor with grade history
professorsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [profResult, gradesResult] = await Promise.all([
      supabase.from("professors").select("*").eq("id", id).single(),
      supabase
        .from("grade_distributions")
        .select("*, courses(department, number, name)")
        .eq("professor_id", id)
        .order("semester", { ascending: false }),
    ]);

    if (profResult.error) {
      res.status(404).json({ data: null, error: "Professor not found" });
      return;
    }

    res.json({
      data: {
        ...profResult.data,
        grade_history: gradesResult.data || [],
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
