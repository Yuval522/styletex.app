import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { TEAM_ACCOUNTS } from "../lib/team-accounts";

const prisma = new PrismaClient();

/**
 * By default this script ONLY makes sure the two Styletex team accounts
 * (Yuval & Itamar) exist so they can log in — it is safe to run at any
 * time against the live database, including after real clients,
 * projects, and quotes have been entered. It never inserts sample/mock
 * data.
 *
 * Login accounts are NEVER deleted by this script. On first run (or
 * whenever an account doesn't exist yet), it creates a placeholder row
 * with a random password nobody knows (passwordSet: false) and prints
 * that password once, purely as a fallback. The real, intended way in is
 * the "הרשמה" (Sign Up) tab on /login — picking your name there and
 * setting your own password "claims" this exact placeholder row (see
 * actions/auth.ts's registerAccount) instead of failing with "account
 * already exists".
 *
 * Wiping ALL business data (clients, projects, quotes, materials,
 * calendar events) is a separate, explicit, opt-in action — it is NOT
 * something this script does by accident. Only run it against an empty
 * dev/staging database, never against live production data:
 *
 *   SEED_WIPE_DATA=1 npm run db:seed
 */

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
      data: { name: account.name, email, passwordHash, passwordSet: false },
    });
    generated.push({ name: account.name, email, password });
    console.log(`  + Created placeholder account for ${account.name} <${email}>.`);
  }

  if (generated.length > 0) {
    console.log(
      "\n=================== FALLBACK PASSWORDS (see note below) ==================="
    );
    for (const { name, email, password } of generated) {
      console.log(`  ${name} — ${email}`);
      console.log(`    password: ${password}`);
    }
    console.log(
      "=============================================================================="
    );
    console.log(
      "PREFERRED: open the app, go to the \"הרשמה\" (Sign Up) tab on /login,\n" +
        "pick your name, and set your own password — that's simpler than\n" +
        "using the random password above and works exactly once per person.\n" +
        "The password above is only a fallback if you'd rather log in with\n" +
        "it directly; it is shown only here, never stored in the codebase.\n"
    );
  }
}

async function wipeBusinessData() {
  console.log("SEED_WIPE_DATA=1 set — clearing all business data…");

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
}

async function main() {
  if (process.env.SEED_WIPE_DATA === "1") {
    await wipeBusinessData();
  } else {
    console.log(
      "Skipping business-data wipe (this is the safe default).\n" +
        "Pass SEED_WIPE_DATA=1 to wipe clients/projects/quotes/materials/\n" +
        "calendar events instead — only do this against an empty dev\n" +
        "database, never against live production data."
    );
  }

  await ensureTeamAccounts();
}

main()
  .catch((e) => {
    // This script now also runs automatically as part of `npm run build`
    // (see package.json), so a hiccup here must NOT fail the whole
    // deployment — the rest of the app still needs to ship. Log loudly
    // and exit 0; re-run `npm run db:seed` manually afterwards if this
    // ever prints an error. (The /setup page is also there as a backup
    // way to create the initial accounts if this step ever misfires.)
    console.error("\n⚠️  prisma/seed.ts failed — the deploy will continue anyway:");
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
