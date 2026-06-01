import Anthropic from "@anthropic-ai/sdk";

function fallbackMemo(company, signals, scoreResult) {
  const signalTypes = [...new Set(signals.map((signal) => signal.type))].join(", ");

  return {
    company,
    score: scoreResult.score,
    recommendation: scoreResult.recommendation,
    confidence: scoreResult.confidence,
    text: `1. EXECUTIVE SUMMARY
${company} is showing a ${scoreResult.score}/100 acquisition probability based on ${signals.length} public signals across ${signalTypes}. The current recommendation is ${scoreResult.recommendation}.

2. SIGNAL ANALYSIS
The strongest read comes from converging regulatory, personnel, hiring, and news indicators within the same analysis window. This pattern is consistent with early strategic transaction preparation.

3. RISK FACTORS
This memo was generated from the deterministic pipeline because ANTHROPIC_API_KEY is not configured. Treat it as a structured fallback summary until LLM drafting is enabled.

4. FINANCIAL IMPLICATION
Signal intensity suggests the target deserves priority review by an analyst before market confirmation changes valuation expectations.

5. RECOMMENDED ACTION
Add ${company} to the active watchlist, validate the triggered sources manually, and prepare a short investment committee note if live signals confirm the pattern.`,
    generatedAt: new Date().toISOString(),
    signalCount: signals.length,
  };
}

export async function agentC_draftMemo(company, signals, scoreResult) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackMemo(company, signals, scoreResult);
  }

  const {
    score,
    confidence,
    keyInsight,
    redFlags,
    recommendation,
    breakdown,
  } = scoreResult;

  const signalDetail = signals
    .map(
      (signal, index) =>
        `${index + 1}. [${signal.type.toUpperCase()}] ${signal.title}\n   Source: ${signal.source} | Weight: ${signal.weight} | Scraped: ${signal.scrapedAt}`,
    )
    .join("\n\n");

  const breakdownText = Object.entries(breakdown)
    .map(
      ([type, data]) =>
        `${type.padEnd(12)} signals: ${data.signals} contribution: ${data.contribution} base_weight: ${data.weight}`,
    )
    .join("\n");

  const prompt = `You are a senior investment intelligence analyst at a top-tier firm. Write a concise, professional M&A intelligence memo based on the signal data below.

COMPANY: ${company}
ACQUISITION PROBABILITY SCORE: ${score}/100
CONFIDENCE: ${confidence}
RECOMMENDATION: ${recommendation}
KEY INSIGHT: ${keyInsight}
RED FLAGS: ${redFlags?.join(", ") || "None identified"}

SCORE BREAKDOWN:
${breakdownText}

DETECTED SIGNALS:
${signalDetail}

Write a structured investment memo with these exact sections:
1. EXECUTIVE SUMMARY
2. SIGNAL ANALYSIS
3. RISK FACTORS
4. FINANCIAL IMPLICATION
5. RECOMMENDED ACTION

Keep it sharp, factual, and under 400 words.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  return {
    company,
    score,
    recommendation,
    confidence,
    text: response.content[0]?.text || "Memo generation failed.",
    generatedAt: new Date().toISOString(),
    signalCount: signals.length,
  };
}
