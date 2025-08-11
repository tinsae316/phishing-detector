import { Router } from "express";
import { prisma } from "../lib/db";
import { requireAuth } from "../middleware/auth";

export const logsRouter = Router();

logsRouter.use(requireAuth);

logsRouter.get("/", async (req, res, next) => {
  try {
    const severity = String(req.query.severity || "");
    const q = String(req.query.q || "").trim();
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");

    const where: any = {};
    if (q) where.url = { contains: q, mode: "insensitive" };
    if (severity) where.verdict = severity; // verdict doubles as severity (safe/unsafe/suspicious)
    if (from) where.createdAt = { ...(where.createdAt || {}), gte: new Date(from) };
    if (to) where.createdAt = { ...(where.createdAt || {}), lte: new Date(to) };

    const logs = await prisma.detectionLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
    res.json(logs);
  } catch (e) {
    next(e);
  }
});


