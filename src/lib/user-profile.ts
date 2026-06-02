export const MASTER_EMAIL = "alawodechristopherdolapo2020@gmail.com";

export type PlanTier = "FREE" | "PRO_ANALYST";

export interface HydratedUserProfile {
  displayName: string;
  emailAddress: string;
  planTier: PlanTier;
  isPremium: boolean;
}

export function displayNameFromEmail(email: string) {
  const username = email.split("@")[0] || "NEXUS Operator";
  return username
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function hydrateUserSession(email?: string | null, explicitName?: string | null): HydratedUserProfile {
  const emailAddress = (email || "operator@nexus.local").trim().toLowerCase();
  const isMaster = emailAddress === MASTER_EMAIL.toLowerCase();

  if (isMaster) {
    return {
      displayName: explicitName || "Alawode Christopher Dolapo",
      emailAddress,
      planTier: "PRO_ANALYST",
      isPremium: true,
    };
  }

  return {
    displayName: explicitName || displayNameFromEmail(emailAddress),
    emailAddress,
    planTier: "FREE",
    isPremium: false,
  };
}
