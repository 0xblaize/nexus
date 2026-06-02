import { NextResponse } from "next/server";

import {
  addWatchlistCompany,
  getWatchlist,
  removeWatchlistCompany,
  updateWatchlistStatus,
} from "@/lib/db";

export async function GET() {
  return NextResponse.json({ watchlist: await getWatchlist() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const company = String(body?.company ?? "").trim();
  const alertThreshold = Number(body?.alertThreshold ?? 70);

  if (!company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }

  const entry = await addWatchlistCompany(company, alertThreshold);
  return NextResponse.json({ watchlistItem: entry });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const company = String(body?.company ?? "").trim();
  const status = body?.status === "paused" ? "paused" : "active";

  if (!company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }

  const entry = await updateWatchlistStatus(company, status);
  return NextResponse.json({ watchlistItem: entry });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const company = String(body?.company ?? "").trim();

  if (!company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }

  await removeWatchlistCompany(company);
  return NextResponse.json({ success: true, watchlist: await getWatchlist() });
}
