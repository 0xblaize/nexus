import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { authOptions } from "@/lib/auth";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

const authErrorCopy: Record<string, string> = {
  AccessDenied: "Access was denied for this account.",
  OAuthSignin: "Google sign-in could not be started.",
  OAuthCallback: "Google sign-in could not be completed.",
  default: "Google sign-in failed. Please try again.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const callbackUrl = resolvedSearchParams?.callbackUrl || "/dashboard";
  const errorCode = resolvedSearchParams?.error;
  const errorMessage = errorCode
    ? (authErrorCopy[errorCode] ?? authErrorCopy.default)
    : null;

  if (session?.user) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.AUTH_GOOGLE_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="auth-eyebrow">NEXUS ACCESS</p>
        <h1 className="auth-title">Sign in to enter the dashboard.</h1>
        <p className="auth-copy">
        Sign in with your Google account to access the dashboard and start analyzing your data.
        </p>

        {errorMessage ? <div className="auth-warning">{errorMessage}</div> : null}

        {googleEnabled ? (
          <GoogleSignInButton callbackUrl={callbackUrl} />
        ) : (
          <div className="auth-warning">
            Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in your environment to
            enable Google sign-in.
          </div>
        )}
        <a className="auth-link" href="/">
          Back to landing
        </a>
      </div>
    </main>
  );
}
