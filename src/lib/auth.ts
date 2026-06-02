import Google from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

import { hydrateUserSession } from "@/lib/user-profile";

const authUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

if (authUrl && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = authUrl;
}

if (authSecret && !process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = authSecret;
}

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const providers =
  googleClientId && googleClientSecret
    ? [
        Google({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : [];

export const authOptions: NextAuthOptions = {
  providers,
  secret: authSecret,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      const email = user?.email || token.email;
      if (email) {
        const hydrated = hydrateUserSession(String(email), user?.name || token.name);
        token.name = hydrated.displayName;
        token.email = hydrated.emailAddress;
        (token as Record<string, unknown>).plan = hydrated.planTier;
        (token as Record<string, unknown>).isPremium = hydrated.isPremium;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const hydrated = hydrateUserSession(String(token.email || session.user.email), String(token.name || session.user.name || ""));
        session.user.name = hydrated.displayName;
        session.user.email = hydrated.emailAddress;
        (session.user as Record<string, unknown>).plan =
          (token as Record<string, unknown>).plan || hydrated.planTier;
        (session.user as Record<string, unknown>).isPremium =
          (token as Record<string, unknown>).isPremium ?? hydrated.isPremium;
      }

      return session;
    },
  },
};
