"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

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
