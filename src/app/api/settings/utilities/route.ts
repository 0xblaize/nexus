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
    const billingUrl = process.env.BILLING_PORTAL_URL || "";
    if (!billingUrl) {
      return NextResponse.json(
        { error: "BILLING_PORTAL_URL is not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      action,
      url: billingUrl,
    });
  }

  return NextResponse.json({ error: "Unsupported utility action" }, { status: 400 });
}
