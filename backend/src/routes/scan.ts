import { Router } from "express";
import { z } from "zod";
import { scanUrl } from "../services/scanner";
import { prisma } from "../lib/db";

export const scanRouter = Router();

const scanSchema = z.object({ url: z.string().url() });

scanRouter.post("/", async (req, res, next) => {
  try {
    const { url } = scanSchema.parse(req.body);
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const result = await scanUrl(url);
    await prisma.detectionLog.create({
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
  } catch (e) {
    next(e);
  }
});


