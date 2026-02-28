import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const coursesRouter = Router();

// GET /api/courses - list courses with optional filters
coursesRouter.get("/", async (req, res) => {
  try {
    const { department, search, semester } = req.query;

    let query = supabase.from("courses").select("*");

    if (department && typeof department === "string") {
      query = query.eq("department", department.toUpperCase());
    }

    if (search && typeof search === "string") {
      query = query.or(
        `name.ilike.%${search}%,department.ilike.%${search}%,number.ilike.%${search}%`
      );
    }

    if (semester && typeof semester === "string") {
      query = query.contains("semesters_offered", [semester]);
    }

    const { data, error } = await query.order("department").order("number");

    if (error) {
      res.status(500).json({ data: null, error: error.message });
      return;
    }

    res.json({ data, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// GET /api/courses/:id - get single course with sections and grade distributions
coursesRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

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
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
