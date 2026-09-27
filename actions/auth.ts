"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findTeamAccount } from "@/lib/team-accounts";

export async function login(
  formData: FormData
): Promise<{ error: string; needsSignup?: boolean } | undefined> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "יש להזין אימייל וסיסמה." };
  }

  // The build's automatic seed step (prisma/seed.ts) creates a placeholder
  // row for Yuval/Itamar's email with a random password nobody knows
  // (passwordSet: false) — the real password is only set once, via the
  // "הרשמה" (Sign Up) tab. To the Credentials provider, "no account yet"
  // and "account exists but no real password set" both look exactly like
  // an invalid password, which produced a misleading "אימייל או סיסמה
  // שגויים" for anyone who hadn't signed up yet. Checked here explicitly
  // so those two cases get a message that actually says what to do next,
  // instead of implying the password itself was wrong.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing || !existing.passwordSet) {
    if (findTeamAccount(email)) {
      return {
        error:
          "טרם הוגדרה סיסמה לחשבון זה. עברו ללשונית \"הרשמה\", בחרו את שמכם, וקבעו סיסמה — בפעם הראשונה בלבד.",
        needsSignup: true,
      };
    }
    return { error: "אימייל או סיסמה שגויים." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    // NEXT_REDIRECT is thrown by a successful signIn() and must propagate
    // untouched so Next.js can perform the redirect.
    if (error instanceof AuthError) {
      return { error: "אימייל או סיסמה שגויים." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Self-service registration, but only for the two authorized Styletex
 * emails (see lib/team-accounts.ts). This is what lets Yuval/Itamar set
 * their own password the first time, directly from the main login page,
 * without a separate setup route or anyone else being able to sign up.
 *
 * The build's automatic seeding step (prisma/seed.ts) may have already
 * created a placeholder row for this email with a random password that
 * nobody actually knows (passwordSet: false). In that case, signing up
 * here "claims" that row by overwriting its password rather than
 * bouncing the person to a login they can never complete. Once a row has
 * passwordSet: true, it is a real account and signing up again correctly
 * fails — this only ever unlocks an unclaimed placeholder, never
 * overwrites someone's real, already-chosen password.
 */
export async function registerAccount(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!emailRaw || !password) {
    return { error: "יש להזין אימייל וסיסמה." };
  }

  const account = findTeamAccount(emailRaw);
  if (!account) {
    return {
      error: "אימייל זה אינו מורשה להירשם. הגישה מוגבלת לצוות Styletex Kitchens בלבד.",
    };
  }

  if (password.length < 8) {
    return { error: "הסיסמה חייבת להכיל לפחות 8 תווים." };
  }
  if (password !== confirm) {
    return { error: "אימות הסיסמה אינו תואם." };
  }

  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (existing?.passwordSet) {
    return { error: "כבר קיים חשבון עם אימייל זה. נסו להתחבר במקום." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    if (existing) {
      // Claim the unclaimed placeholder row created by the seed script.
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, passwordSet: true, name: account.name },
      });
    } else {
      await prisma.user.create({
        data: { name: account.name, email: account.email, passwordHash, passwordSet: true },
      });
    }
  } catch {
    // Most likely a unique-constraint race (two submits at once) — treat
    // it the same as "already registered" rather than a generic 500.
    return { error: "כבר קיים חשבון עם אימייל זה. נסו להתחבר במקום." };
  }

  try {
    await signIn("credentials", {
      email: account.email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // The account was created successfully; only the auto-login hiccuped.
      return { error: "החשבון נוצר בהצלחה. יש להתחבר עם הפרטים שהוגדרו." };
    }
    throw error;
  }
}

/**
 * Password reset for an EXISTING account (passwordSet: true already) — the
 * one case registerAccount() deliberately refuses, by design, so nobody can
 * accidentally clobber a real password by mis-clicking Sign Up. This is the
 * intentional, safe way back in if you forgot your password: it only ever
 * overwrites the passwordHash column on your own row (found by your team
 * email, same allow-list as sign-up — see lib/team-accounts.ts). It never
 * deletes or recreates the row, and the User table has no relation to any
 * client, project, quote, invoice, material, or calendar record in the
 * schema (see prisma/schema.prisma) — there is nothing else for this to
 * touch, no matter how many times it's run.
 */
export async function resetPassword(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!emailRaw || !password) {
    return { error: "יש להזין אימייל וסיסמה." };
  }

  const account = findTeamAccount(emailRaw);
  if (!account) {
    return {
      error: "אימייל זה אינו מורשה לאפס סיסמה. הגישה מוגבלת לצוות Styletex Kitchens בלבד.",
    };
  }

  if (password.length < 8) {
    return { error: "הסיסמה חייבת להכיל לפחות 8 תווים." };
  }
  if (password !== confirm) {
    return { error: "אימות הסיסמה אינו תואם." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: account.email },
    update: { passwordHash, passwordSet: true },
    create: { name: account.name, email: account.email, passwordHash, passwordSet: true },
  });

  try {
    await signIn("credentials", {
      email: account.email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // The password was reset successfully; only the auto-login hiccuped.
      return { error: "הסיסמה אופסה בהצלחה. יש להתחבר עם הסיסמה החדשה." };
    }
    throw error;
  }
}
