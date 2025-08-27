"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const scanner_1 = require("../services/scanner");
const db_1 = require("../lib/db");
exports.scanRouter = (0, express_1.Router)();
const scanSchema = zod_1.z.object({ url: zod_1.z.string().url() });
exports.scanRouter.post("/", async (req, res, next) => {
    try {
        const { url } = scanSchema.parse(req.body);
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
        const userAgent = req.headers["user-agent"] || "";
        const result = await (0, scanner_1.scanUrl)(url);
        await db_1.prisma.detectionLog.create({
            data: {
                url,
                verdict: result.verdict,
                score: result.score,
                reasons: JSON.stringify(result.reasons),
                matchedThreatIds: result.matchedThreatIds?.join(",") || null,
                clientIp,
                userAgent,
            },
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
