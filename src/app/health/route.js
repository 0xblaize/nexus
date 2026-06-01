import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "NEXUS",
    framework: "Next.js",
    version: "1.0.0",
  });
}
