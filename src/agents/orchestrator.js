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
  log("A", "Collecting public web signals...", "info");
  const rawSignals = await agentA_collectSignals(targetCompany);
  console.log(chalk.green(`Collected ${rawSignals.length} signals\n`));
  log("A", `Collected ${rawSignals.length} signals`, rawSignals.length ? "success" : "warn");

  if (!rawSignals.length) {
    await saveReport({
      company: targetCompany,
      score: 0,
      signals: [],
      keyInsight: "No live signals were collected for this target.",
      confidence: "low",
      recommendation: "Insufficient signals",
      memo: null,
    });
    log("SYS", "No live signals detected for this target", "warn");
    return {
      provider,
      score: 0,
      scoreBreakdown: null,
      confidence: "low",
      keyInsight: "No live signals were collected for this target.",
      recommendation: "Insufficient signals",
      signals: [],
      memo: null,
      logs,
    };
  }

  console.log(chalk.dim("> Agent B: Running scoring model..."));
  log("B", "Running deterministic scoring model...", "info");
  const scoreResult = await agentB_scoreSignals(targetCompany, rawSignals, { provider });
  console.log(chalk.yellow(`Score: ${scoreResult.score}/100 (threshold: ${threshold})\n`));
  log("B", `Acquisition probability score: ${scoreResult.score}/100`, "highlight");

  if (scoreResult.score < threshold) {
    await saveReport({
      company: targetCompany,
      score: scoreResult.score,
      signals: rawSignals,
      scoreBreakdown: scoreResult.breakdown,
      keyInsight: scoreResult.keyInsight,
      confidence: scoreResult.confidence,
      recommendation: scoreResult.recommendation,
      redFlags: scoreResult.redFlags,
      memo: null,
    });

    log("SYS", `Threshold not crossed (${threshold}). Memo not generated.`, "warn");
    return {
      provider,
      score: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      confidence: scoreResult.confidence,
      keyInsight: scoreResult.keyInsight,
      recommendation: scoreResult.recommendation,
      redFlags: scoreResult.redFlags,
      signals: rawSignals,
      memo: null,
      logs,
    };
  }

  console.log(chalk.dim("> Agent C: Drafting investment intelligence memo..."));
  log("C", "Drafting investment intelligence memo...", "info");
  const memo = await agentC_draftMemo(targetCompany, rawSignals, scoreResult);
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
    signals: rawSignals,
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
    provider,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown,
    confidence: scoreResult.confidence,
    keyInsight: scoreResult.keyInsight,
    recommendation: scoreResult.recommendation,
    redFlags: scoreResult.redFlags,
    signals: rawSignals,
    memo,
    reportId: report.id,
    logs,
  };
}
