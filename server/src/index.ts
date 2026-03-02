import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { coursesRouter } from "./routes/courses.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { professorsRouter } from "./routes/professors.js";
import { degreePlanRouter } from "./routes/degree-plan.js";
import { transcriptRouter } from "./routes/transcript.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS — validate origin
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
if (allowedOrigin === "*") {
  console.warn("WARNING: FRONTEND_URL is set to '*'. This is insecure in production.");
}
app.use(cors({ origin: allowedOrigin }));

// Body parsing with reasonable limit
app.use(express.json({ limit: "256kb" }));

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: "Too many requests, please try again later" },
});
app.use("/api", apiLimiter);

// Strict rate limit for transcript parsing (expensive Claude API calls)
const transcriptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: "Too many transcript uploads, please try again later" },
});
app.use("/api/transcript", transcriptLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/courses", coursesRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/professors", professorsRouter);
app.use("/api/degree-plan", degreePlanRouter);
app.use("/api/transcript", transcriptRouter);

app.listen(PORT, () => {
  console.log(`Sift API running on port ${PORT}`);
});
