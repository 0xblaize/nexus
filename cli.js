#!/usr/bin/env node

import chalk from "chalk";
import { config } from "dotenv";
import { runNexusPipeline } from "./src/agents/orchestrator.js";

config({ path: ".env.local" });
config();

const company = process.argv[2];
const rawThreshold = Number.parseInt(process.argv[3], 10);
const threshold = Number.isFinite(rawThreshold) ? rawThreshold : 65;
const provider = "gemini";

if (!company) {
  console.log(chalk.red('\nUsage: node cli.js "Company Name" [threshold]\n'));
  console.log(chalk.dim('Example: node cli.js "Figma" 60\n'));
  process.exit(1);
}

console.log(
  chalk.cyan(`
NEXUS M&A Intelligence
Autonomous Signal Detection v1.0
`),
);

try {
  const result = await runNexusPipeline(company, { threshold, provider });

  console.log(chalk.cyan("\n========================================\n"));
  console.log(chalk.white.bold(`COMPANY:        ${company}`));
  console.log(chalk.white(`PROVIDER:       ${provider}`));
  console.log(chalk.white(`SCORE:          ${chalk.bold(result.score)}/100`));
  console.log(chalk.white(`SIGNALS:        ${result.signals?.length || 0}`));

  if (result.memo) {
    console.log(chalk.white(`RECOMMENDATION: ${chalk.bold(result.memo.recommendation)}`));
    console.log(chalk.cyan("\n================ MEMO ================\n"));
    console.log(chalk.white(result.memo.text));
  } else {
    console.log(chalk.dim(`\nScore below threshold (${threshold}). No memo generated.`));
    console.log(chalk.dim("Company added to monitoring watchlist."));
  }

  console.log(chalk.cyan("\n========================================\n"));
} catch (err) {
  console.error(chalk.red(`\nPipeline error: ${err.message}\n`));
  process.exit(1);
}
