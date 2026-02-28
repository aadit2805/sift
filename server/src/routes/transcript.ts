import { Router } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

import { PDFParse } from "pdf-parse";

export const transcriptRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

interface ParsedCourse {
  code: string;
  name: string;
  credits: number;
  grade: string;
}

// POST /api/transcript/parse - upload a transcript PDF and extract courses
transcriptRouter.post("/parse", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ data: null, error: "No file uploaded" });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ data: null, error: "ANTHROPIC_API_KEY not configured" });
      return;
    }

    // Extract text from PDF
    const parser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
    const textResult = await parser.getText();
    const text = textResult.text;
    await parser.destroy();

    if (!text || text.trim().length < 20) {
      res.status(400).json({ data: null, error: "Could not extract text from PDF" });
      return;
    }

    // Send to Claude for structured extraction
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Extract all completed courses from this university transcript text. For each course, provide the course code (e.g. "CSCE 121"), course name, credit hours, and letter grade.

Return ONLY a valid JSON array with no other text. Each element should have: code, name, credits (number), grade.

Example output:
[{"code": "CSCE 121", "name": "Introduction to Program Design and Concepts", "credits": 4, "grade": "A"}]

If a course was dropped (W grade) or is in progress (IP), still include it but with the appropriate grade string.

Transcript text:
${text}`,
        },
      ],
    });

    // Parse the response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const courses: ParsedCourse[] = JSON.parse(jsonStr);

    // Validate structure
    const validated = courses
      .filter(
        (c) =>
          typeof c.code === "string" &&
          typeof c.name === "string" &&
          typeof c.credits === "number" &&
          typeof c.grade === "string"
      )
      .map((c) => ({
        code: c.code.toUpperCase().trim(),
        name: c.name.trim(),
        credits: c.credits,
        grade: c.grade.toUpperCase().trim(),
      }));

    res.json({ data: { courses: validated }, error: null });
  } catch (err) {
    console.error("Transcript parse error:", err);
    const message = err instanceof Error ? err.message : "Failed to parse transcript";
    res.status(500).json({ data: null, error: message });
  }
});
