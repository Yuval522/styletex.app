import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. This file must NOT import Prisma, bcryptjs, or
 * any other Node-only dependency — it is loaded by `proxy.ts`, which
 * runs on the Edge runtime. The actual Credentials provider (which needs
 * the database) is added on top of this config in `auth.ts`, which is only
 * ever used from Server Components / Route Handlers / Server Actions.
 */

// Public routes reachable without a session. /login now hosts both
// sign-in and sign-up (as tabs) — see components/auth/auth-tabs.tsx.
// /setup is a legacy redirect straight into the sign-up tab.
const PUBLIC_PATHS = ["/login", "/setup"];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPath = PUBLIC_PATHS.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      const isLoginPage = nextUrl.pathname.startsWith("/login");

      if (isPublicPath) {
        if (isLoginPage && isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
