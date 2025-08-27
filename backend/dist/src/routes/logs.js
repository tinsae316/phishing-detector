"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../middleware/auth");
exports.logsRouter = (0, express_1.Router)();
exports.logsRouter.use(auth_1.requireAuth);
exports.logsRouter.get("/", async (req, res, next) => {
    try {
        const severity = String(req.query.severity || "");
        const q = String(req.query.q || "").trim();
        const from = String(req.query.from || "");
        const to = String(req.query.to || "");
        const where = {};
        if (q)
            where.url = { contains: q, mode: "insensitive" };
        if (severity)
            where.verdict = severity; // verdict doubles as severity (safe/unsafe/suspicious)
        if (from)
            where.createdAt = { ...(where.createdAt || {}), gte: new Date(from) };
        if (to)
            where.createdAt = { ...(where.createdAt || {}), lte: new Date(to) };
        const logs = await db_1.prisma.detectionLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
        res.json(logs);
    }
    catch (e) {
        next(e);
    }
});
