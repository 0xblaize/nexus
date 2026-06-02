import { GoogleGenAI, Type } from "@google/genai";

const TYPE_POINT_CAPS = {
  regulatory: 25,
  personnel: 15,
  hiring: 15,
  patents: 15,
  news: 15,
  ir_traffic: 15,
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
      description: "One to four concise risk or monitoring factors. Use Strategic Signal or Growth Metric when there is no downside risk.",
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
  let totalPoints = 0;

  for (const [type, maxScore] of Object.entries(TYPE_POINT_CAPS)) {
    const weight = maxScore / 100;
    const typeSignals = byType[type] || [];
    if (!typeSignals.length) {
      breakdown[type] = { signals: 0, contribution: 0, maxScore, weight };
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
    const contribution = Math.min(
      maxScore,
      maxScore * cappedSignalWeight * (0.7 + 0.3 * volumeBonus),
    );

    breakdown[type] = {
      signals: typeSignals.length,
      contribution: Number(contribution.toFixed(2)),
      maxScore,
      avgSignalWeight: Number(cappedSignalWeight.toFixed(3)),
      volumeBonus: Number(volumeBonus.toFixed(3)),
      weight,
    };
    totalPoints += contribution;
  }

  const laneScore = Math.min(Math.round(totalPoints), 97);
  const weightedSignalTotal = signals.reduce((sum, signal) => {
    const weight = Number.isFinite(Number(signal.weight)) ? Number(signal.weight) : 0.45;
    return sum + Math.max(0, Math.min(weight, 1.3));
  }, 0);
  const significantSignals = signals.filter((signal) => Number(signal.weight) >= 0.7).length;
  const activeTypes = Object.values(byType).filter((items) => items.length > 0).length;
  const volumeScore = Math.min(74, Math.round(weightedSignalTotal * 8.5));
  const diversityBonus = Math.min(12, Math.max(0, activeTypes - 1) * 4);
  const signalClusterBonus = significantSignals >= 3 ? Math.min(10, significantSignals + 2) : 0;
  const score = Math.min(97, Math.max(laneScore, volumeScore + diversityBonus + signalClusterBonus));

  return { score, breakdown };
}

function buildSignalSummary(signals) {
  return signals
    .slice(0, 20)
    .map((signal) => ({
      type: signal.type,
      label: signal.label,
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
  return `You are the NEXUS intelligence validation engine for corporate, market, macro, and operational risk signals.

Do not limit validation to M&A language. BTC/crypto moves, market volatility, funding or valuation shifts, regulatory friction, leadership changes, hiring velocity, scaling milestones, patent filings, investor relations traffic, and major operational changes are valid signals when they affect ${company}'s risk or strategic profile.

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
- Breakdown contribution values are points against fixed category caps: REGULATORY max 25, PERSONNEL max 15, HIRING max 15, PATENTS max 15, NEWS max 15, IR_TRAFFIC max 15.
- Treat market speculation, IPO or listing chatter, valuation changes, funding, major contracts, regulatory or litigation pressure, leadership shifts, restructuring, production delays, patent filings, and investor relations page traffic surges as valid monitoring evidence when they appear in the signals.
- Use "Insufficient signals" only when the supplied signals are trivial, stale, duplicate, or unrelated to ${company}.
- If the evidence is meaningful but not a definitive acquisition or crisis signal, classify it as "Monitor closely" rather than skipping it.
- red_flags means risk or monitoring factors. Return 1-4 entries for meaningful developments; if there is no downside risk, label entries as "Strategic Signal" or "Growth Metric" instead of returning an empty array.
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
  if (score >= 40) return "Monitor closely";
  return "Insufficient signals";
}

function deriveMonitoringFactors(signals) {
  const seen = new Set();
  return signals
    .filter((signal) => Number(signal.weight) >= 0.7)
    .map((signal) => {
      const label = signal.label || signal.detail?.split(":")[0] || "Strategic Signal";
      const title = trimForPrompt(signal.title, 140);
      const source = signal.source ? ` (${signal.source})` : "";
      return `${label}: ${title}${source}`;
    })
    .filter((flag) => {
      const key = flag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function fallbackValidation(baseScore, err) {
  return {
    validated_score: baseScore,
    confidence: "low",
    key_insight:
      "Live signals were collected, but Gemini validation was unavailable during this run.",
    red_flags: [],
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
      maxOutputTokens: 1600,
      responseMimeType: "application/json",
      responseSchema: GEMINI_VALIDATION_SCHEMA,
    },
  });

  return parseStructuredJson(response.text || "", baseScore, "Gemini");
}

async function evaluateWithGeminiGrounding(company) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Perform an in-depth live search for ${company} to identify corporate, market, macro, and operational risk signals.
Evaluate the search findings and break them down into an enterprise JSON risk matrix containing:
1. REGULATORY (Strictly score integers out of a max ceiling of 25pts)
2. PERSONNEL (Strictly score integers out of a max ceiling of 15pts)
3. HIRING (Workforce structure/contraction velocity tracking metric; strictly score integers out of a max ceiling of 15pts)
4. PATENTS (Patent filings/IP leverage metrics; strictly score integers out of a max ceiling of 15pts)
5. NEWS (Financial press velocity/coverage speed; strictly score integers out of a max ceiling of 15pts)
6. IR_TRAFFIC (Investor relations page traffic surges; strictly score integers out of a max ceiling of 15pts)

Provide structured JSON matching the schema precisely. Include a validated_score from 0 to 97, confidence rating, key_insight, red_flags list, and recommendation: "Buy interest" | "Monitor closely" | "Insufficient signals".`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.1,
      topP: 0.1,
      maxOutputTokens: 1600,
      responseMimeType: "application/json",
      responseSchema: GEMINI_VALIDATION_SCHEMA,
      tools: [{ googleSearch: {} }],
    },
  });

  const parsed = parseStructuredJson(response.text || "", 40, "Gemini Grounding");

  // Extract search metadata URLs as mock signal objects
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundedSignals = groundingChunks.map((chunk, index) => {
    const url = chunk.web?.uri || "";
    const title = chunk.web?.title || "Grounded Search Result";
    return {
      id: `ground-${index}-${Math.random().toString(36).substr(2, 5)}`,
      company,
      type: "news",
      label: "News Velocity",
      source: url ? new URL(url).hostname.replace(/^www\./, "") : "Google Grounding",
      title,
      detail: `Live search grounding source parsed from Google search telemetry.`,
      weight: 1.0,
      rawUrl: url,
      scrapedAt: new Date().toISOString(),
    };
  });

  return { parsed, groundedSignals };
}

export async function agentB_scoreSignals(company, signals, options = {}) {
  const provider = "gemini";

  if (options.useGrounding) {
    console.log(`  [B1] Running model directly via Tier 3: Google Search Grounding for ${company}...`);
    try {
      const { parsed, groundedSignals } = await evaluateWithGeminiGrounding(company);
      const baseScore = parsed.validated_score;

      const breakdown = {
        regulatory: { signals: 1, contribution: Math.round(baseScore * 0.25), maxScore: 25, weight: 0.25 },
        personnel: { signals: 1, contribution: Math.round(baseScore * 0.15), maxScore: 15, weight: 0.15 },
        hiring: { signals: 1, contribution: Math.round(baseScore * 0.15), maxScore: 15, weight: 0.15 },
        patents: { signals: 1, contribution: Math.round(baseScore * 0.15), maxScore: 15, weight: 0.15 },
        news: { signals: 1, contribution: Math.round(baseScore * 0.15), maxScore: 15, weight: 0.15 },
        ir_traffic: { signals: 1, contribution: Math.round(baseScore * 0.15), maxScore: 15, weight: 0.15 },
      };

      return {
        provider,
        score: baseScore,
        baseScore,
        llmValidatedScore: baseScore,
        confidence: parsed.confidence,
        keyInsight: parsed.key_insight,
        redFlags: parsed.red_flags,
        recommendation: parsed.recommendation,
        breakdown,
        groundedSignals,
      };
    } catch (err) {
      console.error("Gemini grounding evaluation failed:", err);
      // fallback
      const baseScore = 30;
      const breakdown = {
        regulatory: { signals: 0, contribution: 0, maxScore: 25, weight: 0.25 },
        personnel: { signals: 0, contribution: 0, maxScore: 15, weight: 0.15 },
        hiring: { signals: 0, contribution: 0, maxScore: 15, weight: 0.15 },
        patents: { signals: 0, contribution: 0, maxScore: 15, weight: 0.15 },
        news: { signals: 0, contribution: 0, maxScore: 15, weight: 0.15 },
        ir_traffic: { signals: 0, contribution: 0, maxScore: 15, weight: 0.15 },
      };
      return {
        provider,
        score: baseScore,
        baseScore,
        llmValidatedScore: baseScore,
        confidence: "low",
        keyInsight: "Grounded telemetry fallback active due to upstream failure.",
        redFlags: ["Grounding failure"],
        recommendation: "Insufficient signals",
        breakdown,
        groundedSignals: [],
      };
    }
  }

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

  const monitoringFactors = deriveMonitoringFactors(signals);
  if (!llmValidation.red_flags.length && monitoringFactors.length) {
    llmValidation.red_flags = monitoringFactors;
  }
  if (llmValidation.recommendation === "Insufficient signals" && baseScore >= 40 && monitoringFactors.length) {
    llmValidation.recommendation = "Monitor closely";
  }

  const blendedScore = Math.round(
    0.6 * baseScore + 0.4 * llmValidation.validated_score,
  );
  const finalScore = llmValidation.recommendation === "Insufficient signals"
    ? blendedScore
    : Math.max(baseScore, blendedScore);

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
