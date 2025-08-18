"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threatsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
exports.threatsRouter = (0, express_1.Router)();
exports.threatsRouter.use(auth_1.requireAuth);
const upsertSchema = zod_1.z.object({
    pattern: zod_1.z.string().min(1),
    isRegex: zod_1.z.boolean().optional().default(false),
    severity: zod_1.z.enum(["low", "medium", "high"]).default("high"),
    source: zod_1.z.string().optional().default("manual"),
    notes: zod_1.z.string().optional(),
});
exports.threatsRouter.get("/", async (req, res, next) => {
    try {
        const q = String(req.query.q || "").trim();
        const list = await db_1.prisma.threatEntry.findMany({
            where: q ? { pattern: { contains: q, mode: "insensitive" } } : {},
            orderBy: { createdAt: "desc" },
            take: 200,
        });
        res.json(list);
    }
    catch (e) {
        next(e);
    }
});
exports.threatsRouter.post("/", async (req, res, next) => {
    try {
        const body = upsertSchema.parse(req.body);
        const created = await db_1.prisma.threatEntry.create({ data: body });
        res.status(201).json(created);
    }
    catch (e) {
        next(e);
    }
});
exports.threatsRouter.put("/:id", async (req, res, next) => {
    try {
        const body = upsertSchema.parse(req.body);
        const updated = await db_1.prisma.threatEntry.update({ where: { id: req.params.id }, data: body });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
exports.threatsRouter.delete("/:id", async (req, res, next) => {
    try {
        await db_1.prisma.threatEntry.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
