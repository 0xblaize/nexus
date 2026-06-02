import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hydrateUserSession } from "@/lib/user-profile";

export const runtime = "nodejs";

const MONTHLY_PRICE_USD = 9;

export async function POST() {
  const session = await getServerSession(authOptions);
  const hydrated = hydrateUserSession(session?.user?.email, session?.user?.name);

  if (hydrated.isPremium) {
    return NextResponse.json({
      success: true,
      alreadyPremium: true,
      message: "This account already has Premium access.",
    });
  }

  const checkoutUrl =
    process.env.BILLING_CHECKOUT_URL ||
    process.env.NEXT_PUBLIC_BILLING_PORTAL_URL ||
    process.env.BILLING_PORTAL_URL ||
    "#";

  return NextResponse.json({
    success: true,
    plan: "PRO_ANALYST",
    priceMonthlyUsd: MONTHLY_PRICE_USD,
    url: checkoutUrl,
    notice:
      checkoutUrl === "#"
        ? "Checkout is not connected yet. Configure BILLING_CHECKOUT_URL for the $9/mo Premium subscription."
        : undefined,
  });
}
