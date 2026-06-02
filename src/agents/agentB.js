import { GoogleGenAI, Type } from "@google/genai";

const TYPE_WEIGHTS = {
  regulatory: 0.31,
  personnel: 0.28,
  hiring: 0.22,
  news: 0.19,
};

const RECOMMENDATIONS = ["Buy interest", "Monitor closely", "Insufficient signals"];

const GEMINI_VALIDATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    validated_score: {
      type: Type.INTEGER,
      description: "Integer score from 0 to 97.",
    },
    confidence: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
    },
    key_insight: {
      type: Type.STRING,
    },
    red_flags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendation: {
      type: Type.STRING,
      enum: RECOMMENDATIONS,
    },
  },
  required: [
    "validated_score",
    "confidence",
    "key_insight",
    "red_flags",
    "recommendation",
  ],
};

function trimForPrompt(value, maxLength = 1200) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

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
      content: trimForPrompt(signal.content),
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
- Treat market speculation, IPO or listing chatter, valuation changes, funding, major contracts, regulatory or litigation pressure, leadership shifts, restructuring, production delays, and supply-chain issues as valid monitoring evidence when they appear in the signals.
- Use "Insufficient signals" only when the supplied signals are trivial, stale, duplicate, or unrelated to ${company}.
- If the evidence is meaningful but not a definitive acquisition or crisis signal, classify it as "Monitor closely" rather than skipping it.
- Use only evidence present in the signals.`;
}

function parseStructuredJson(text, baseScore, provider = "LLM provider") {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    const preview = cleaned.slice(0, 240) || "<empty response>";
    throw new Error(`${provider} did not return a valid JSON object. Preview: ${preview}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown parse error";
    const preview = cleaned.slice(start, Math.min(end + 1, start + 240));
    throw new Error(`${provider} returned malformed JSON: ${message}. Preview: ${preview}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${provider} returned JSON, but not the expected object shape.`);
  }

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
      RECOMMENDATIONS.includes(parsed.recommendation)
        ? parsed.recommendation
        : baseScore >= 80
          ? "Buy interest"
          : baseScore >= 65
            ? "Monitor closely"
            : "Insufficient signals",
  };
}

function recommendationFromScore(score) {
  if (score >= 80) return "Buy interest";
  if (score >= 45) return "Monitor closely";
  return "Insufficient signals";
}

function fallbackValidation(baseScore, err) {
  const message = err instanceof Error ? err.message : "Gemini validation failed.";
  return {
    validated_score: baseScore,
    confidence: "low",
    key_insight:
      "Live signals were collected, but Gemini validation was unavailable during this run.",
    red_flags: [message],
    recommendation: recommendationFromScore(baseScore),
  };
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
      maxOutputTokens: 800,
      responseMimeType: "application/json",
      responseSchema: GEMINI_VALIDATION_SCHEMA,
    },
  });

  return parseStructuredJson(response.text || "", baseScore, "Gemini");
}

export async function agentB_scoreSignals(company, signals, options = {}) {
  const provider = "gemini";

  console.log(`  [B1] Running deterministic scoring on ${signals.length} signals...`);
  const { score: baseScore, breakdown } = computeBaseScore(signals);
  console.log(`  [B2] Base score: ${baseScore}/100`);

  const prompt = buildPrompt(company, signals, baseScore, breakdown);
  console.log("  [B3] Validating with Google Gemini...");

  let llmValidation;
  try {
    llmValidation = await validateWithGemini(prompt, baseScore);
  } catch (err) {
    console.error("Gemini validation failed:", err instanceof Error ? err.message : err);
    llmValidation = fallbackValidation(baseScore, err);
  }

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
