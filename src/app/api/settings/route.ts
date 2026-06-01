import { NextResponse } from "next/server";

import { getSettings, updateSettings } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const settings = await updateSettings(body);
  return NextResponse.json({ settings });
}
