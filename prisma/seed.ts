import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This script wipes all business data so the app starts from a clean
 * slate — no demo clients, projects, quotes, materials, or calendar
 * events. It does NOT insert any sample/mock data.
 *
 * Deletion order respects foreign-key dependencies (children before
 * parents), so it works regardless of each relation's cascade setting.
 * Run with: npm run db:seed
 *
 * It also makes sure the two Styletex team accounts (Yuval & Itamar)
 * exist so they can log in. Login accounts are NEVER deleted by this
 * script — only business data is wiped. On first run (or whenever an
 * account doesn't exist yet), a strong random password is generated and
 * printed once to the terminal — it is never stored in this file or in
 * git. Save it immediately; it cannot be recovered afterwards (only
 * reset, by deleting the row and re-running this script).
 */

const TEAM_ACCOUNTS = [
  { name: "Yuval", email: "yuvalro123@gmail.com" },
  { name: "Itamar", email: "Itamarknaan@gmail.com" },
];

function generatePassword(): string {
  // 16 random bytes -> base64url, trimmed to a readable 20-char secret.
  return crypto.randomBytes(16).toString("base64url").slice(0, 20);
}

async function ensureTeamAccounts() {
  console.log("\nChecking Styletex team login accounts…");
  const generated: { name: string; email: string; password: string }[] = [];

  for (const account of TEAM_ACCOUNTS) {
    const email = account.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  ✓ ${account.name} <${email}> already has an account.`);
      continue;
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name: account.name, email, passwordHash },
    });
    generated.push({ name: account.name, email, password });
    console.log(`  + Created account for ${account.name} <${email}>.`);
  }

  if (generated.length > 0) {
    console.log(
      "\n=================== SAVE THESE PASSWORDS NOW ==================="
    );
    for (const { name, email, password } of generated) {
      console.log(`  ${name} — ${email}`);
      console.log(`    password: ${password}`);
    }
    console.log(
      "==================================================================="
    );
    console.log(
      "These passwords are shown only once and are not stored anywhere in\n" +
        "the codebase. Share them securely with the account owner. Anyone\n" +
        "can change their own password later once a change-password screen\n" +
        "is added, or you can rotate it by deleting the User row and\n" +
        "re-running `npm run db:seed`.\n"
    );
  }
}

async function main() {
  console.log("Clearing all business data from Styletex Kitchens…");

  await prisma.cabinetSpec.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.material.deleteMany();
  await prisma.supplier.deleteMany();

  console.log("Database is clean. No demo data was inserted.");

  await ensureTeamAccounts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
