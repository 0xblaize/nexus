import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db";
import { hydrateUserSession } from "@/lib/user-profile";
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
  const hydrated = hydrateUserSession(session?.user?.email, session?.user?.name);
  const plan = sessionPlan(session, hydrated.planTier);
  return {
    ...settings,
    displayName: hydrated.displayName || settings.displayName,
    email: hydrated.emailAddress || settings.email,
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
  const hydrated = hydrateUserSession(session?.user?.email, session?.user?.name);
  const plan = sessionPlan(session, hydrated.planTier);
  const paidPlan = isPaidPlan(plan);
  const sanitizedBody = {
    ...body,
    displayName: hydrated.displayName || body.displayName,
    email: hydrated.emailAddress || body.email,
    currentPlan: paidPlan ? "Pro analyst" : "Free developer",
    teamsEnabled: paidPlan ? Boolean(body.teamsEnabled) : false,
    slackAlerts: paidPlan ? Boolean(body.slackAlerts) : false,
    teamsWebhook: paidPlan ? body.teamsWebhook : "",
  };
  const settings = await updateSettings(sanitizedBody);
  return NextResponse.json({ settings: applySessionSettings(settings, session) });
}
