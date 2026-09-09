import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "אימייל וסיסמה",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        // Cheap, value-free sanity check: if this ever logs "MISSING",
        // the env var wasn't actually visible to THIS running function —
        // typically because it was added after this instance was already
        // running (Vercel only picks up new/changed env vars on the next
        // build+deploy) or was scoped to the wrong environment
        // (Production vs Preview vs Development) in the dashboard.
        console.log(
          `[auth] authorize(): AUTH_SECRET is ${
            process.env.AUTH_SECRET ? "present" : "MISSING"
          }, DATABASE_URL is ${process.env.DATABASE_URL ? "present" : "MISSING"}.`
        );

        try {
          const email = String(credentials?.email ?? "")
            .trim()
            .toLowerCase();
          const password = String(credentials?.password ?? "");

          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          // Any throw here surfaces to the browser as NextAuth's generic
          // "server configuration" error regardless of cause — logging
          // the full error is the only way to see what actually failed
          // (DB connection, bcrypt, etc.) instead of that generic message.
          console.error("[auth] authorize(): unexpected error —", error);
          throw error;
        }
      },
    }),
  ],
});
