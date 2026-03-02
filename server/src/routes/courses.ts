import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const coursesRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Escape characters that have special meaning in PostgREST filter strings
function escapePostgrestValue(str: string): string {
  return str.replace(/[%_\\,.*()]/g, "");
}

// GET /api/courses - list courses with optional filters
coursesRouter.get("/", async (req, res) => {
  try {
    const { department, search, semester } = req.query;

    let query = supabase.from("courses").select("*");

    if (department && typeof department === "string") {
      query = query.eq("department", department.toUpperCase());
    }

    if (search && typeof search === "string") {
      const safe = escapePostgrestValue(search);
      if (safe.length > 0) {
        query = query.or(
          `name.ilike.%${safe}%,department.ilike.%${safe}%,number.ilike.%${safe}%`
        );
      }
    }

    if (semester && typeof semester === "string") {
      query = query.contains("semesters_offered", [semester]);
    }

    const { data, error } = await query.order("department").order("number");

    if (error) {
      console.error("Courses query error:", error);
      res.status(500).json({ data: null, error: "Failed to fetch courses" });
      return;
    }

    res.json({ data, error: null });
  } catch (err) {
    console.error("Courses error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// GET /api/courses/:id - get single course with sections and grade distributions
coursesRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!UUID_RE.test(id)) {
      res.status(400).json({ data: null, error: "Invalid ID format" });
      return;
    }

    const [courseResult, sectionsResult, gradesResult] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id).single(),
      supabase.from("sections").select("*, professors(*)").eq("course_id", id),
      supabase.from("grade_distributions").select("*, professors(name)").eq("course_id", id),
    ]);

    if (courseResult.error) {
      res.status(404).json({ data: null, error: "Course not found" });
      return;
    }

    res.json({
      data: {
        ...courseResult.data,
        sections: sectionsResult.data || [],
        grade_distributions: gradesResult.data || [],
      },
      error: null,
    });
  } catch (err) {
    console.error("Course detail error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
