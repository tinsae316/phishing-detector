import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./lib/config";
import { authRouter } from "./routes/auth";
import { scanRouter } from "./routes/scan";
import { threatsRouter } from "./routes/threats";
import { logsRouter } from "./routes/logs";
import { errorHandler } from "./middleware/error";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

// Optional HTTPS enforcement
app.use((req, res, next) => {
  if (config.forceHttps && req.headers["x-forwarded-proto"] !== "https") {
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  next();
});

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 50 });
const scanLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120 });

app.use("/auth", authLimiter);
app.use("/scan-url", scanLimiter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/scan-url", scanRouter);
app.use("/threats", threatsRouter);
app.use("/logs", logsRouter);

app.use(errorHandler);

const port = config.port;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});


