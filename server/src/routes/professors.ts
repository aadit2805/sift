import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const professorsRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapePostgrestValue(str: string): string {
  return str.replace(/[%_\\,.*()]/g, "");
}

// GET /api/professors - list professors with optional filters
professorsRouter.get("/", async (req, res) => {
  try {
    const { department, search, course_id } = req.query;

    let query = supabase.from("professors").select("*");

    if (department && typeof department === "string") {
      query = query.eq("department", department.toUpperCase());
    }

    if (search && typeof search === "string") {
      const safe = escapePostgrestValue(search);
      if (safe.length > 0) {
        query = query.ilike("name", `%${safe}%`);
      }
    }

    const { data, error } = await query.order("name");

    if (error) {
      console.error("Professors query error:", error);
      res.status(500).json({ data: null, error: "Failed to fetch professors" });
      return;
    }

    // If filtering by course, get professors who have taught this course
    if (course_id && typeof course_id === "string" && data) {
      if (!UUID_RE.test(course_id)) {
        res.status(400).json({ data: null, error: "Invalid course_id format" });
        return;
      }

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
    console.error("Professors error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// GET /api/professors/:id - get professor with grade history
professorsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!UUID_RE.test(id)) {
      res.status(400).json({ data: null, error: "Invalid ID format" });
      return;
    }

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
    console.error("Professor detail error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
