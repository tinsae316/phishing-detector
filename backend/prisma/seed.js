"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "admin@example.com";
    const password = "Admin@12345";
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    await prisma.adminUser.upsert({
        where: { email },
        update: {},
        create: { email, password: passwordHash },
    });
    await prisma.threatEntry.upsert({
        where: { id: "seed-1" },
        update: {},
        create: {
            id: "seed-1",
            pattern: "login-secure-example.com",
            isRegex: false,
            severity: "high",
            source: "seed",
            notes: "Suspicious typosquatted domain",
        },
    });
    console.log("Seed complete. Admin credentials: admin@example.com / Admin@12345");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
