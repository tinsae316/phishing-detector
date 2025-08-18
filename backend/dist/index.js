"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./lib/config");
const auth_1 = require("./routes/auth");
const scan_1 = require("./routes/scan");
const threats_1 = require("./routes/threats");
const logs_1 = require("./routes/logs");
const error_1 = require("./middleware/error");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, cb) => cb(null, true),
    credentials: false,
}));
app.use(express_1.default.json({ limit: "1mb" }));
// Optional HTTPS enforcement
app.use((req, res, next) => {
    if (config_1.config.forceHttps && req.headers["x-forwarded-proto"] !== "https") {
        const host = req.headers.host;
        return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    next();
});
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 10 * 60 * 1000, limit: 50 });
const scanLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, limit: 120 });
app.use("/auth", authLimiter);
app.use("/scan-url", scanLimiter);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", auth_1.authRouter);
app.use("/scan-url", scan_1.scanRouter);
app.use("/threats", threats_1.threatsRouter);
app.use("/logs", logs_1.logsRouter);
app.use(error_1.errorHandler);
const port = config_1.config.port;
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
});
