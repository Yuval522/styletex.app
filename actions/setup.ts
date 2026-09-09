"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * One-time bootstrap action for creating the very first login accounts.
 * This is reachable without authentication (see auth.config.ts /setup
 * public path), so it MUST independently verify no accounts exist yet on
 * every call — never trust the page's initial render check alone, since
 * that's just a UI convenience, not a security boundary.
 */
export async function createInitialAccounts(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    return {
      error: "כבר קיימים חשבונות במערכת. ההגדרה הראשונית כבר בוצעה — עברו לעמוד ההתחברות.",
    };
  }

  const accounts = [
    {
      name: "Yuval",
      email: String(formData.get("yuvalEmail") ?? "").trim().toLowerCase(),
      password: String(formData.get("yuvalPassword") ?? ""),
      confirm: String(formData.get("yuvalPasswordConfirm") ?? ""),
    },
    {
      name: "Itamar",
      email: String(formData.get("itamarEmail") ?? "").trim().toLowerCase(),
      password: String(formData.get("itamarPassword") ?? ""),
      confirm: String(formData.get("itamarPasswordConfirm") ?? ""),
    },
  ];

  for (const account of accounts) {
    if (!account.email || !account.password) {
      return { error: `יש למלא אימייל וסיסמה עבור ${account.name}.` };
    }
    if (account.password.length < 8) {
      return { error: `הסיסמה עבור ${account.name} חייבת להכיל לפחות 8 תווים.` };
    }
    if (account.password !== account.confirm) {
      return { error: `אימות הסיסמה עבור ${account.name} אינו תואם.` };
    }
  }

  if (accounts[0].email === accounts[1].email) {
    return { error: "לא ניתן להשתמש באותו אימייל עבור שני החשבונות." };
  }

  // Re-check right before writing too, to close the race between the
  // count check above and this transaction as tightly as possible.
  try {
    await prisma.$transaction(async (tx) => {
      const countNow = await tx.user.count();
      if (countNow > 0) {
        throw new Error("ACCOUNTS_ALREADY_EXIST");
      }
      for (const account of accounts) {
        const passwordHash = await bcrypt.hash(account.password, 12);
        await tx.user.create({
          data: { name: account.name, email: account.email, passwordHash },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "ACCOUNTS_ALREADY_EXIST") {
      return {
        error: "כבר קיימים חשבונות במערכת. ההגדרה הראשונית כבר בוצעה — עברו לעמוד ההתחברות.",
      };
    }
    throw e;
  }

  redirect("/login?setup=done");
}
