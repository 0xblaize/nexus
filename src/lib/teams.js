export async function deliverToTeams({ memo }) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("TEAMS_WEBHOOK_URL not set");
  }

  if (!memo?.adaptiveCard) {
    throw new Error("Adaptive Card payload is missing from the memo.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(memo.adaptiveCard),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Teams delivery failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`,
    );
  }
}
