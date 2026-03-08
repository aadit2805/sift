import { Router } from "express";
import { z } from "zod";
import { supabase } from "../db/supabase.js";
import { requireAuth } from "../middleware/auth.js";

export const userRouter = Router();

// All user routes require auth
userRouter.use(requireAuth);

const profileUpdateSchema = z.object({
  major: z.string().optional(),
  catalog_year: z.string().optional(),
  completed_courses: z.array(z.string()).optional(),
  in_progress_courses: z.array(z.string()).optional(),
  preferences: z.record(z.unknown()).optional(),
  semester: z.string().optional(),
});

const migrateSchema = z.object({
  completed_courses: z.array(z.string()).optional(),
  in_progress_courses: z.array(z.string()).optional(),
  preferences: z.record(z.unknown()).optional(),
  semester: z.string().optional(),
});

// GET /api/user/profile — fetch or auto-create user profile
userRouter.get("/profile", async (req, res) => {
  try {
    const clerkId = req.clerkUserId!;

    // Try to find existing user
    const { data: existing, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", clerkId)
      .single();

    if (existing) {
      res.json({ data: existing, error: null });
      return;
    }

    // Auto-create on first call (lazy provisioning)
    if (fetchError && fetchError.code === "PGRST116") {
      const { data: created, error: createError } = await supabase
        .from("users")
        .insert({ clerk_id: clerkId, major: "CS", catalog_year: "2024-2025" })
        .select()
        .single();

      if (createError) {
        res.status(500).json({ data: null, error: "Failed to create user profile" });
        return;
      }

      res.json({ data: created, error: null });
      return;
    }

    res.status(500).json({ data: null, error: "Failed to fetch user profile" });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// PUT /api/user/profile — update user profile
userRouter.put("/profile", async (req, res) => {
  try {
    const clerkId = req.clerkUserId!;
    const parsed = profileUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ data: null, error: "Invalid request body" });
      return;
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("clerk_id", clerkId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ data: null, error: "Failed to update profile" });
      return;
    }

    res.json({ data: updated, error: null });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});

// POST /api/user/profile/migrate — one-time localStorage → DB migration
userRouter.post("/profile/migrate", async (req, res) => {
  try {
    const clerkId = req.clerkUserId!;
    const parsed = migrateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ data: null, error: "Invalid migration data" });
      return;
    }

    // Only migrate into an empty profile
    const { data: existing } = await supabase
      .from("users")
      .select("completed_courses, in_progress_courses, preferences")
      .eq("clerk_id", clerkId)
      .single();

    if (!existing) {
      res.status(404).json({ data: null, error: "User profile not found" });
      return;
    }

    const hasExistingData =
      (Array.isArray(existing.completed_courses) && existing.completed_courses.length > 0) ||
      (Array.isArray(existing.in_progress_courses) && existing.in_progress_courses.length > 0);

    if (hasExistingData) {
      // Profile already has data — skip migration, return current profile
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkId)
        .single();

      res.json({ data: profile, error: null });
      return;
    }

    // Merge localStorage data into empty profile
    const { data: updated, error } = await supabase
      .from("users")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("clerk_id", clerkId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ data: null, error: "Failed to migrate data" });
      return;
    }

    res.json({ data: updated, error: null });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ data: null, error: "Internal server error" });
  }
});
