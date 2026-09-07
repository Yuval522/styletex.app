import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. This file must NOT import Prisma, bcryptjs, or
 * any other Node-only dependency — it is loaded by `middleware.ts`, which
 * runs on the Edge runtime. The actual Credentials provider (which needs
 * the database) is added on top of this config in `auth.ts`, which is only
 * ever used from Server Components / Route Handlers / Server Actions.
 */
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
      const isLoginPage = nextUrl.pathname.startsWith("/login");

      if (isLoginPage) {
        if (isLoggedIn) {
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
