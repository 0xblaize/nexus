import { getActiveTeamMembers } from "./team-members";
import { sendTeamNotification } from "./email";

export async function notifyTeamOfSignals({
  company,
  signals,
  score,
  recommendation,
  skipNotification = false,
}) {
  if (skipNotification) {
    console.log("Team notification skipped");
    return;
  }

  try {
    const teamMembers = await getActiveTeamMembers();

    if (teamMembers.length === 0) {
      console.log("No team members to notify");
      return;
    }

    console.log(`📧 Notifying ${teamMembers.length} team members of signals for ${company}`);

    await sendTeamNotification({
      teamMembers,
      company,
      signals,
      score,
      recommendation,
    });

    console.log(`✓ Team members notified for ${company}`);
  } catch (error) {
    console.error("Failed to notify team:", error);
    // Don't throw - notifications are secondary to analysis
  }
}

export async function sendSignalNotificationToTeam({
  company,
  signals,
  score,
  recommendation,
}) {
  return notifyTeamOfSignals({
    company,
    signals,
    score,
    recommendation,
    skipNotification: false,
  });
}
