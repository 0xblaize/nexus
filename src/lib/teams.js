import axios from "axios";

export async function deliverToTeams({ company, score, memo }) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("TEAMS_WEBHOOK_URL not set");

  const scoreColor = score >= 80 ? "attention" : score >= 60 ? "warning" : "good";

  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
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
                        },
                      ],
                    },
                    {
                      type: "Column",
                      width: "auto",
                      items: [
                        {
                          type: "TextBlock",
                          text: `${score}/100`,
                          weight: "Bolder",
                          size: "ExtraLarge",
                          color: scoreColor,
                          horizontalAlignment: "Right",
                        },
                        {
                          type: "TextBlock",
                          text: memo.recommendation,
                          color: scoreColor,
                          horizontalAlignment: "Right",
                          spacing: "None",
                          size: "Small",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "Key Insight",
                  weight: "Bolder",
                  size: "Small",
                  spacing: "Medium",
                },
                {
                  type: "TextBlock",
                  text: memo.confidence
                    ? `Confidence: ${memo.confidence.toUpperCase()} - ${memo.signalCount} signals detected`
                    : `${memo.signalCount} signals detected`,
                  size: "Small",
                  color: "Accent",
                  spacing: "None",
                },
                {
                  type: "TextBlock",
                  text: memo.text.slice(0, 500) + (memo.text.length > 500 ? "..." : ""),
                  wrap: true,
                  spacing: "Small",
                  size: "Small",
                },
              ],
            },
            {
              type: "FactSet",
              facts: [
                { title: "Signals", value: String(memo.signalCount) },
                { title: "Score", value: `${score}/100` },
                { title: "Confidence", value: memo.confidence || "N/A" },
                { title: "Generated", value: new Date(memo.generatedAt).toUTCString() },
              ],
              spacing: "Medium",
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View Full Report",
              url: `${process.env.APP_URL || "http://localhost:3000"}/report/${encodeURIComponent(company)}`,
            },
            {
              type: "Action.OpenUrl",
              title: "Run New Query",
              url: process.env.APP_URL || "http://localhost:3000",
            },
          ],
        },
      },
    ],
  };

  await axios.post(webhookUrl, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });
}
