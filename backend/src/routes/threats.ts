import { Router } from "express";
import { prisma } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

export const threatsRouter = Router();

threatsRouter.use(requireAuth);

const upsertSchema = z.object({
  pattern: z.string().min(1),
  isRegex: z.boolean().optional().default(false),
  severity: z.enum(["low", "medium", "high"]).default("high"),
  source: z.string().optional().default("manual"),
  notes: z.string().optional(),
});

threatsRouter.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const list = await prisma.threatEntry.findMany({
      where: q ? { pattern: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

threatsRouter.post("/", async (req, res, next) => {
  try {
    const body = upsertSchema.parse(req.body);
    const created = await prisma.threatEntry.create({ data: body });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

threatsRouter.put("/:id", async (req, res, next) => {
  try {
    const body = upsertSchema.parse(req.body);
    const updated = await prisma.threatEntry.update({ where: { id: req.params.id }, data: body });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

threatsRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.threatEntry.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});


