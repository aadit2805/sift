import "dotenv/config";
import express from "express";
import cors from "cors";
import { coursesRouter } from "./routes/courses.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { professorsRouter } from "./routes/professors.js";
import { degreePlanRouter } from "./routes/degree-plan.js";
import { transcriptRouter } from "./routes/transcript.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));

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
