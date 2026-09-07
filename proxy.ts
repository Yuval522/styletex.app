import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`.
 * This is built only from `authConfig` (no Prisma/bcrypt), so it stays
 * safe to run on every request without dragging in Node-only
 * dependencies. Every path in the matcher below is checked by
 * `authConfig.callbacks.authorized`; unauthenticated visitors are
 * redirected to /login automatically.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
