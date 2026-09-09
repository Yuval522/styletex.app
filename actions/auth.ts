"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findTeamAccount } from "@/lib/team-accounts";

export async function login(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "יש להזין אימייל וסיסמה." };
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
 * emails (see lib/team-accounts.ts) and only while that specific email
 * doesn't already have an account. This is what lets Yuval/Itamar set
 * their own password the first time, directly from the main login page,
 * without a separate setup route or anyone else being able to sign up.
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
  if (existing) {
    return { error: "כבר קיים חשבון עם אימייל זה. נסו להתחבר במקום." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.user.create({
      data: { name: account.name, email: account.email, passwordHash },
    });
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
