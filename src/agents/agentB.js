import Anthropic from "@anthropic-ai/sdk";

const TYPE_WEIGHTS = {
  regulatory: 0.31,
  personnel: 0.28,
  hiring: 0.22,
  news: 0.19,
};

function computeBaseScore(signals) {
  const byType = {};
  for (const signal of signals) {
    byType[signal.type] ??= [];
    byType[signal.type].push(signal);
  }

  const breakdown = {};
  let totalScore = 0;

  for (const [type, weight] of Object.entries(TYPE_WEIGHTS)) {
    const typeSignals = byType[type] || [];
    if (!typeSignals.length) {
      breakdown[type] = { signals: 0, contribution: 0, weight };
      continue;
    }

    const avgSignalWeight =
      typeSignals.reduce((sum, signal) => sum + (signal.weight || 1), 0) /
      typeSignals.length;
    const cappedSignalWeight = Math.min(avgSignalWeight, 1.5);
    const volumeBonus = Math.min(
      Math.log(typeSignals.length + 1) / Math.log(4),
      1,
    );
    const contribution = weight * cappedSignalWeight * (0.7 + 0.3 * volumeBonus);

    breakdown[type] = {
      signals: typeSignals.length,
      contribution: Number(contribution.toFixed(4)),
      avgSignalWeight: Number(cappedSignalWeight.toFixed(3)),
      volumeBonus: Number(volumeBonus.toFixed(3)),
      weight,
    };
    totalScore += contribution;
  }

  const score = Math.min(Math.round((totalScore * 100) / 0.8), 97);
  return { score, breakdown };
}

async function validateWithLLM(company, signals, baseScore) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      validated_score: baseScore,
      confidence: "low",
      key_insight:
        "Anthropic validation was skipped because ANTHROPIC_API_KEY is not configured.",
      red_flags: ["External LLM validation was skipped because no API key is configured."],
      recommendation: baseScore >= 70 ? "Monitor closely" : "Insufficient signals",
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const signalSummary = signals
    .map(
      (signal) =>
        `[${signal.type.toUpperCase()}] ${signal.title} - ${signal.detail?.slice(0, 120) || ""}`,
    )
    .join("\n");

  const prompt = `You are a senior M&A intelligence analyst. Review these signals for "${company}" and assess whether the acquisition probability score of ${baseScore}/100 is appropriate.

SIGNALS DETECTED:
${signalSummary}

Respond ONLY in this JSON format, no other text:
{
  "validated_score": <integer 0-97>,
  "confidence": "<low|medium|high>",
  "key_insight": "<one sentence, the single most important signal and why>",
  "red_flags": ["<any signal that might be a false positive>"],
  "recommendation": "<Buy interest | Monitor closely | Insufficient signals>"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0]?.text || "{}";
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return {
      validated_score: baseScore,
      confidence: "medium",
      key_insight: "LLM validation returned invalid JSON, so the base score was retained.",
      red_flags: [],
      recommendation: baseScore >= 70 ? "Monitor closely" : "Insufficient signals",
    };
  }
}

export async function agentB_scoreSignals(company, signals) {
  console.log(`  [B1] Running deterministic scoring on ${signals.length} signals...`);
  const { score: baseScore, breakdown } = computeBaseScore(signals);
  console.log(`  [B2] Base score: ${baseScore}/100`);

  console.log("  [B3] Validating with LLM analyst...");
  const llmValidation = await validateWithLLM(company, signals, baseScore);
  const finalScore = Math.round(
    0.6 * baseScore + 0.4 * llmValidation.validated_score,
  );

  return {
    score: finalScore,
    baseScore,
    llmValidatedScore: llmValidation.validated_score,
    confidence: llmValidation.confidence,
    keyInsight: llmValidation.key_insight,
    redFlags: llmValidation.red_flags,
    recommendation: llmValidation.recommendation,
    breakdown,
  };
}
