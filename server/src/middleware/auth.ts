import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ data: null, error: "Authentication required" });
    return;
  }
  req.clerkUserId = userId;
  next();
}
