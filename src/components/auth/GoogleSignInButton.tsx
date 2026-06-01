"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  callbackUrl?: string;
};

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
}: GoogleSignInButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      void signIn("google", { callbackUrl });
    });
  };

  return (
    <button
      className="auth-button"
      disabled={isPending}
      onClick={handleClick}
      type="button"
    >
      {isPending ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
