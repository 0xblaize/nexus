import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db";
import type { SettingsData } from "@/types/nexus";

type SettingsSession = {
  user?: {
    name?: string | null;
    email?: string | null;
    plan?: unknown;
  };
} | null;

function isPaidPlan(plan: string | undefined) {
  return plan === "PRO_ANALYST" || plan === "Pro analyst";
}

function sessionPlan(session: SettingsSession, fallback = "FREE_DEVELOPER") {
  return String(session?.user?.plan || fallback);
}

function applySessionSettings(settings: SettingsData, session: SettingsSession) {
  const plan = sessionPlan(session, settings.currentPlan);
  return {
    ...settings,
    displayName: session?.user?.name || settings.displayName,
    email: session?.user?.email || settings.email,
    currentPlan: isPaidPlan(plan) ? "Pro analyst" : "Free developer",
    teamsEnabled: isPaidPlan(plan) ? settings.teamsEnabled : false,
    slackAlerts: isPaidPlan(plan) ? settings.slackAlerts : false,
    teamsWebhook: isPaidPlan(plan) ? settings.teamsWebhook : "",
  };
}

export async function GET() {
  const session = (await getServerSession(authOptions)) as SettingsSession;
  return NextResponse.json({ settings: applySessionSettings(await getSettings(), session) });
}

export async function PATCH(request: Request) {
  const session = (await getServerSession(authOptions)) as SettingsSession;
  const body = await request.json().catch(() => ({}));
  const plan = sessionPlan(session);
  const paidPlan = isPaidPlan(plan);
  const sanitizedBody = {
    ...body,
    displayName: session?.user?.name || body.displayName,
    email: session?.user?.email || body.email,
    currentPlan: paidPlan ? "Pro analyst" : "Free developer",
    teamsEnabled: paidPlan ? Boolean(body.teamsEnabled) : false,
    slackAlerts: paidPlan ? Boolean(body.slackAlerts) : false,
    teamsWebhook: paidPlan ? body.teamsWebhook : "",
  };
  const settings = await updateSettings(sanitizedBody);
  return NextResponse.json({ settings: applySessionSettings(settings, session) });
}
