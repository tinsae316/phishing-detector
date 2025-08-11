import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const password = "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 10);

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


