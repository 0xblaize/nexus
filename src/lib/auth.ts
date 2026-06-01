import Google from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

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
};
