function getScoreColor(score) {
  if (score >= 80) return "attention";
  if (score >= 60) return "warning";
  return "good";
}

function summarizeSignals(signals) {
  return signals.slice(0, 4).map((signal) => ({
    title: signal.title,
    type: signal.type.toUpperCase(),
    source: signal.source,
  }));
}

function buildMemoText(company, signals, scoreResult) {
  const redFlags = scoreResult.redFlags?.length
    ? scoreResult.redFlags.map((flag) => `- ${flag}`).join("\n")
    : "- No material false-positive flags identified in the live telemetry set.";

  const highlights = summarizeSignals(signals)
    .map(
      (signal, index) =>
        `${index + 1}. [${signal.type}] ${signal.title} (${signal.source})`,
    )
    .join("\n");

  return [
    "1. EXECUTIVE SUMMARY",
    `${company} currently screens at ${scoreResult.score}/100 with ${scoreResult.confidence} confidence. The operating recommendation is ${scoreResult.recommendation}.`,
    "",
    "2. SIGNAL ANALYSIS",
    scoreResult.keyInsight,
    highlights || "No qualifying highlights were available in the live signal set.",
    "",
    "3. RISK FACTORS",
    redFlags,
    "",
    "4. FINANCIAL IMPLICATION",
    "Signal clustering suggests this target warrants immediate analyst review before broader market confirmation changes valuation expectations.",
    "",
    "5. RECOMMENDED ACTION",
    `Keep ${company} on the active watchlist, validate the strongest sources manually, and prepare escalation if follow-on signals continue within the next monitoring cycle.`,
  ].join("\n");
}

function buildAdaptiveCard(company, signals, scoreResult, memoText, generatedAt) {
  const scoreColor = getScoreColor(scoreResult.score);
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          msTeams: {
            width: "Full",
          },
          body: [
            {
              type: "Container",
              style: "emphasis",
              items: [
                {
                  type: "ColumnSet",
                  columns: [
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: "NEXUS Intelligence Alert",
                          weight: "Bolder",
                          size: "Small",
                          color: "Accent",
                        },
                        {
                          type: "TextBlock",
                          text: company,
                          weight: "Bolder",
                          size: "ExtraLarge",
                          spacing: "None",
                          wrap: true,
                        },
                      ],
                    },
                    {
                      type: "Column",
                      width: "auto",
                      items: [
                        {
                          type: "TextBlock",
                          text: `${scoreResult.score}/100`,
                          weight: "Bolder",
                          size: "ExtraLarge",
                          color: scoreColor,
                          horizontalAlignment: "Right",
                        },
                        {
                          type: "TextBlock",
                          text: scoreResult.recommendation,
                          color: scoreColor,
                          horizontalAlignment: "Right",
                          spacing: "None",
                          size: "Small",
                          wrap: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "FactSet",
              spacing: "Medium",
              facts: [
                { title: "Signals", value: String(signals.length) },
                { title: "Confidence", value: scoreResult.confidence.toUpperCase() },
                { title: "Base Score", value: `${scoreResult.baseScore ?? scoreResult.score}/100` },
                { title: "Validated Score", value: `${scoreResult.llmValidatedScore ?? scoreResult.score}/100` },
              ],
            },
            {
              type: "TextBlock",
              text: "Key Insight",
              weight: "Bolder",
              size: "Small",
              spacing: "Medium",
            },
            {
              type: "TextBlock",
              text: scoreResult.keyInsight,
              wrap: true,
              spacing: "Small",
            },
            {
              type: "TextBlock",
              text: memoText,
              wrap: true,
              spacing: "Medium",
              size: "Small",
            },
            {
              type: "TextBlock",
              text: `Generated ${new Date(generatedAt).toUTCString()}`,
              spacing: "Medium",
              isSubtle: true,
              size: "Small",
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "Open Analyze",
              url: `${appUrl}/analyze`,
            },
            {
              type: "Action.OpenUrl",
              title: "View Reports",
              url: `${appUrl}/reports`,
            },
          ],
        },
      },
    ],
  };
}

export async function agentC_draftMemo(company, signals, scoreResult) {
  const generatedAt = new Date().toISOString();
  const text = buildMemoText(company, signals, scoreResult);

  return {
    company,
    score: scoreResult.score,
    recommendation: scoreResult.recommendation,
    confidence: scoreResult.confidence,
    text,
    generatedAt,
    signalCount: signals.length,
    adaptiveCard: buildAdaptiveCard(company, signals, scoreResult, text, generatedAt),
  };
}
