import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../lib/config";

export interface AuthPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    (req as any).user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}


