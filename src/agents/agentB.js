import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

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

function buildSignalSummary(signals) {
  return signals
    .slice(0, 20)
    .map((signal) => ({
      type: signal.type,
      source: signal.source,
      title: signal.title,
      detail: signal.detail,
      weight: signal.weight,
      rawUrl: signal.rawUrl || "",
      scrapedAt: signal.scrapedAt,
    }));
}

function buildPrompt(company, signals, baseScore, breakdown) {
  return `You are an M&A intelligence validation engine.

Return only strict JSON with no markdown, commentary, or prose outside the JSON object.

The JSON schema is:
{
  "validated_score": integer,
  "confidence": "low" | "medium" | "high",
  "key_insight": string,
  "red_flags": string[],
  "recommendation": "Buy interest" | "Monitor closely" | "Insufficient signals"
}

Company: ${company}
Base score: ${baseScore}
Breakdown: ${JSON.stringify(breakdown)}
Signals: ${JSON.stringify(buildSignalSummary(signals))}

Rules:
- validated_score must be an integer between 0 and 97.
- Keep key_insight to one sentence.
- Keep red_flags concise.
- Use only evidence present in the signals.`;
}

function parseStructuredJson(text, baseScore) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM provider did not return a valid JSON object.");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1));

  return {
    validated_score: Math.max(0, Math.min(97, Math.round(Number(parsed.validated_score) || baseScore))),
    confidence:
      parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : "medium",
    key_insight:
      typeof parsed.key_insight === "string" && parsed.key_insight.trim()
        ? parsed.key_insight.trim()
        : "The selected model did not provide a usable key insight.",
    red_flags: Array.isArray(parsed.red_flags)
      ? parsed.red_flags.filter((flag) => typeof flag === "string" && flag.trim()).map((flag) => flag.trim())
      : [],
    recommendation:
      parsed.recommendation === "Buy interest" ||
      parsed.recommendation === "Monitor closely" ||
      parsed.recommendation === "Insufficient signals"
        ? parsed.recommendation
        : baseScore >= 80
          ? "Buy interest"
          : baseScore >= 65
            ? "Monitor closely"
            : "Insufficient signals",
  };
}

async function validateWithAnthropic(prompt, baseScore) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    temperature: 0.1,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parseStructuredJson(raw, baseScore);
}

async function validateWithGemini(prompt, baseScore) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.1,
      topP: 0.1,
      maxOutputTokens: 600,
    },
  });

  return parseStructuredJson(response.text || "", baseScore);
}

export async function agentB_scoreSignals(company, signals, options = {}) {
  const provider = options.provider === "gemini" ? "gemini" : "anthropic";

  console.log(`  [B1] Running deterministic scoring on ${signals.length} signals...`);
  const { score: baseScore, breakdown } = computeBaseScore(signals);
  console.log(`  [B2] Base score: ${baseScore}/100`);

  const prompt = buildPrompt(company, signals, baseScore, breakdown);
  console.log(`  [B3] Validating with ${provider === "gemini" ? "Google Gemini" : "Anthropic Claude"}...`);

  const llmValidation =
    provider === "gemini"
      ? await validateWithGemini(prompt, baseScore)
      : await validateWithAnthropic(prompt, baseScore);

  const finalScore = Math.round(
    0.6 * baseScore + 0.4 * llmValidation.validated_score,
  );

  return {
    provider,
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
