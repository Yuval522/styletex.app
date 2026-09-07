import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Edge-safe middleware — built only from `authConfig` (no Prisma/bcrypt),
 * so it can run on the Edge runtime. Every request in the matcher below
 * is checked by `authConfig.callbacks.authorized`; unauthenticated
 * visitors are redirected to /login automatically.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
