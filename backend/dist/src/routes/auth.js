"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const db_1 = require("../lib/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const config_1 = require("../lib/config");
exports.authRouter = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const body = loginSchema.parse(req.body);
        const user = await db_1.prisma.adminUser.findUnique({ where: { email: body.email } });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });
        const ok = await bcryptjs_1.default.compare(body.password, user.password);
        if (!ok)
            return res.status(401).json({ error: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email }, config_1.config.jwtSecret, { expiresIn: "7d" });
        res.json({ token });
    }
    catch (e) {
        next(e);
    }
});
