import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "change-password") {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return NextResponse.json({
      success: true,
      action,
      url: `${appUrl}/api/auth/signin`,
    });
  }

  if (action === "billing-portal") {
    const billingUrl =
      process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || process.env.BILLING_PORTAL_URL || "#";

    return NextResponse.json({
      success: true,
      action,
      url: billingUrl,
      notice:
        billingUrl === "#"
          ? "Billing portal is not connected for this free developer account."
          : undefined,
    });
  }

  return NextResponse.json({ error: "Unsupported utility action" }, { status: 400 });
}
