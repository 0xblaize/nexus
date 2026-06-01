import { NextResponse } from "next/server";

function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export function GET() {
  const baseUrl = appUrl();

  return NextResponse.json({
    schema_version: "v1",
    name_for_model: "nexus_ma_intelligence",
    name_for_human: "NEXUS M&A Intelligence",
    description_for_model:
      "Analyzes public signals to estimate the probability that a company is about to be acquired or is acquiring another company.",
    description_for_human:
      "Real-time M&A signal detection and acquisition probability scoring.",
    auth: { type: "none" },
    api: {
      type: "openapi",
      url: `${baseUrl}/openapi.yaml`,
    },
    logo_url: `${baseUrl}/logo.png`,
    contact_email: "hello@nexus.ai",
    legal_info_url: `${baseUrl}/legal`,
  });
}
