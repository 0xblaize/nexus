import chalk from "chalk";
import { agentA_collectSignals } from "./agentA.js";
import { agentB_scoreSignals } from "./agentB.js";
import { agentC_draftMemo } from "./agentC.js";
import { saveReport } from "../lib/db.js";
import { deliverToTeams } from "../lib/teams.js";

function createTimestamp() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export async function runNexusPipeline(targetCompany, options = {}) {
  const {
    threshold = 65,
    provider = "gemini",
    deliverToTeams: shouldDeliver = true,
    logger: externalLogger,
  } = options;
  const startTime = Date.now();
  const logs = [];

  function log(agent, message, type = "info") {
    const entry = { agent, message, type, timestamp: createTimestamp() };
    logs.push(entry);
    externalLogger?.(entry);
  }

  console.log(chalk.cyan(`\nNEXUS starting pipeline for: ${targetCompany}\n`));
  log("SYS", `nexus start --target "${targetCompany}"`, "highlight");

  console.log(chalk.dim("> Agent A: Collecting public web signals..."));
  const { signals: rawSignals, provider: activeProvider } = await agentA_collectSignals(targetCompany, (msg, type) => log("A", msg, type));

  let scoreResult;
  let pipelineSignals = rawSignals;

  if (activeProvider === "GEMINI_GROUNDING") {
    console.log(chalk.dim("> Ingestion Fallback Active: Routing search grounding to Agent B..."));
    log("SYS", "⚡ Tier 3 Active: Invoking Native Gemini Search Grounding Matrix...", "highlight");

    console.log(chalk.dim("> Agent B: Running grounded scoring model..."));
    log("B", "Running score evaluation with native Google Grounding...", "info");
    scoreResult = await agentB_scoreSignals(targetCompany, [], { provider, useGrounding: true });

    pipelineSignals = scoreResult.groundedSignals || [];
    console.log(chalk.yellow(`Score: ${scoreResult.score}/100 (threshold: ${threshold})\n`));
    log("B", `Acquisition probability score: ${scoreResult.score}/100`, "highlight");
  } else {
    console.log(chalk.dim("> Agent B: Running scoring model..."));
    log("B", "Running deterministic scoring model...", "info");
    scoreResult = await agentB_scoreSignals(targetCompany, rawSignals, { provider });
    console.log(chalk.yellow(`Score: ${scoreResult.score}/100 (threshold: ${threshold})\n`));
    log("B", `Acquisition probability score: ${scoreResult.score}/100`, "highlight");
  }

  if (scoreResult.score < threshold) {
    await saveReport({
      company: targetCompany,
      score: scoreResult.score,
      signals: pipelineSignals,
      scoreBreakdown: scoreResult.breakdown,
      keyInsight: scoreResult.keyInsight,
      confidence: scoreResult.confidence,
      recommendation: scoreResult.recommendation,
      redFlags: scoreResult.redFlags,
      memo: null,
    });

    log("SYS", `Threshold not crossed (${threshold}). Memo not generated.`, "warn");
    return {
      provider: activeProvider,
      score: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      confidence: scoreResult.confidence,
      keyInsight: scoreResult.keyInsight,
      recommendation: scoreResult.recommendation,
      redFlags: scoreResult.redFlags,
      signals: pipelineSignals,
      memo: null,
      logs,
    };
  }

  console.log(chalk.dim("> Agent C: Drafting investment intelligence memo..."));
  log("C", "Drafting investment intelligence memo...", "info");
  const memo = await agentC_draftMemo(targetCompany, pipelineSignals, scoreResult);
  console.log(chalk.green("Memo drafted\n"));
  log("C", "Investment memo drafted", "success");

  if (shouldDeliver && process.env.TEAMS_WEBHOOK_URL) {
    console.log(chalk.dim("> Sending adaptive card to Microsoft Teams..."));
    await deliverToTeams({ company: targetCompany, score: scoreResult.score, memo });
    console.log(chalk.green("Delivered to Teams\n"));
    log("SYS", "Adaptive card delivered to Microsoft Teams", "success");
  }

  const report = await saveReport({
    company: targetCompany,
    score: scoreResult.score,
    signals: pipelineSignals,
    scoreBreakdown: scoreResult.breakdown,
    keyInsight: scoreResult.keyInsight,
    confidence: scoreResult.confidence,
    recommendation: scoreResult.recommendation,
    redFlags: scoreResult.redFlags,
    memo,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(chalk.cyan(`Pipeline complete in ${elapsed}s\n`));
  log("SYS", `Pipeline complete in ${elapsed}s`, "success");

  return {
    provider: activeProvider,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown,
    confidence: scoreResult.confidence,
    keyInsight: scoreResult.keyInsight,
    recommendation: scoreResult.recommendation,
    redFlags: scoreResult.redFlags,
    signals: pipelineSignals,
    memo,
    reportId: report.id,
    logs,
  };
}
