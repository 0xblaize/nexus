export const navItems = [
  { href: "#arch", label: "Architecture" },
  { href: "#signals", label: "Signals" },
  { href: "#tracks", label: "Tracks" },
];

export const heroStats = [
  { label: "Sources monitored", value: "50", suffix: "K+" },
  { label: "Signal latency", value: "14", suffix: "s" },
  { label: "Accuracy", value: "91", suffix: "%" },
  { label: "Saved / yr", value: "$31", suffix: "K" },
];

export const tickerItems = [
  { live: true, text: "LIVE · SEC filing - Acme Corp" },
  { live: false, text: "Score 87/100 - TechVentures Inc" },
  { live: false, text: "Executive departure - GlobalSoft" },
  { live: true, text: "LIVE · Hiring surge +340% - DataFlow" },
  { live: false, text: "Patent cluster - NovaTech Ltd" },
  { live: false, text: "IR traffic spike - MediCore" },
  { live: true, text: "LIVE · Regulatory filing - EuVentures AG" },
  { live: false, text: "Score 73/100 - CloudBase" },
  { live: false, text: "SEC filing - Acme Corp" },
  { live: false, text: "Score 87/100 - TechVentures Inc" },
  { live: false, text: "Executive departure - GlobalSoft" },
  { live: false, text: "Hiring surge +340% - DataFlow" },
  { live: false, text: "Patent cluster - NovaTech Ltd" },
  { live: false, text: "IR traffic spike - MediCore" },
  { live: false, text: "Regulatory filing - EuVentures AG" },
  { live: false, text: "Score 73/100 - CloudBase" },
];

export const architectureItems = [
  {
    badge: "Agent A",
    number: "01",
    title: "Signal Collector",
    body:
      "Bright Data's Web Unlocker and SERP API continuously scrape SEC EDGAR filings, corporate careers pages, executive LinkedIn profiles, and patent databases - bypassing every bot-protection layer in real time.",
  },
  {
    badge: "Agent B",
    number: "02",
    title: "Probability Scorer",
    body:
      "Cross-references all signals for the same target. Runs a weighted scoring model - more converging signals in a tight time window equals a higher acquisition probability score from 0 to 100.",
  },
  {
    badge: "Agent C",
    number: "03",
    title: "Memo Drafter",
    body:
      "When a company crosses threshold, Claude drafts a one-page investment intelligence memo - overview, signals, probability score, financial implication, and recommended action.",
  },
  {
    badge: "Delivery",
    number: "04",
    title: "Enterprise Delivery",
    body:
      "Fires an adaptive card directly into Microsoft Teams. Analysts query NEXUS inline via Copilot Studio - type a company name, get full signal analysis without leaving their workspace.",
  },
];

export const signalItems = [
  {
    icon: "⚖️",
    title: "Regulatory Filings",
    body:
      "SEC EDGAR, Companies House, EU regulatory portals. Unusual 8-K or 13-D filings are often the first public trace of a deal in motion.",
  },
  {
    icon: "👤",
    title: "Executive Movement",
    body:
      "Sudden C-suite departures, title changes on LinkedIn, or a VP quietly removing their employer - these patterns precede acquisitions by weeks.",
  },
  {
    icon: "📋",
    title: "Hiring Pattern Shifts",
    body:
      "A company posting integration engineers overnight signals deal preparation. A sudden hiring freeze signals a deal has already been agreed.",
  },
  {
    icon: "🔬",
    title: "Patent Clusters",
    body:
      "Rapid patent filings in a specific domain by an acquiring company often signal they are building IP leverage before making a move.",
  },
  {
    icon: "📰",
    title: "News Velocity",
    body:
      "Unusual spikes in financial press coverage, analyst mentions, or conference appearances around a specific company name.",
  },
  {
    icon: "📊",
    title: "IR Page Traffic",
    body:
      "Unusual surges in investor relations page visits often indicate institutional investors quietly doing due diligence.",
  },
];

export const trackItems = [
  {
    label: "Bright Data x lablab.ai",
    score: "100",
    body:
      "Web Unlocker + SERP API scraping SEC, LinkedIn, and careers pages across thousands of domains simultaneously.",
  },
  {
    label: "Gradient on Unstop",
    score: "100",
    body:
      "Three-agent state machine with deterministic execution, financial scoring math, and structured JSON output at every stage.",
  },
  {
    label: "Microsoft Agent Academy",
    score: "100",
    body:
      "Adaptive card delivery into Teams + Copilot Studio plugin for on-demand queries inside the enterprise workspace.",
  },
];

export const badgeItems = [
  "Node.js",
  "Bright Data APIs",
  "LangChain.js",
  "Claude API",
  "Supabase",
  "Microsoft Teams",
  "Copilot Studio",
  "Railway",
];

export const terminalLines = [
  { prompt: "$", text: 'nexus start --target "DataFlow Systems"', tone: "" },
  {
    prompt: "›",
    text: "Initializing Bright Data Web Unlocker session...",
    tone: "dim",
  },
  { prompt: "›", text: "Scraping SEC EDGAR - searching 13-D filings...", tone: "dim" },
  { prompt: "✓", text: "Found 2 unusual filings in past 14 days", tone: "ok" },
  { prompt: "›", text: "Scraping careers.dataflowsystems.com...", tone: "dim" },
  { prompt: "✓", text: "Detected: +340% engineering hires YoY", tone: "ok" },
  { prompt: "›", text: "Scanning LinkedIn executive profiles...", tone: "dim" },
  { prompt: "⚠", text: "CFO profile: employer removed 6 days ago", tone: "warn" },
  { prompt: "›", text: "Cross-referencing patent database...", tone: "dim" },
  { prompt: "✓", text: 'Patent cluster: 14 filings in "cloud data pipelines"', tone: "ok" },
  { prompt: "›", text: "Running Agent B - scoring model...", tone: "dim" },
  { prompt: "›", text: "  signal_weight[regulatory]  = 0.31 x 2  = 0.62", tone: "dim" },
  { prompt: "›", text: "  signal_weight[personnel]   = 0.28 x 1  = 0.28", tone: "dim" },
  { prompt: "›", text: "  signal_weight[hiring]      = 0.22 x 1  = 0.22", tone: "dim" },
  { prompt: "⚡", text: "ACQUISITION PROBABILITY SCORE: 87/100", tone: "hi" },
  { prompt: "›", text: "Agent C - drafting investment memo...", tone: "dim" },
  { prompt: "✓", text: "Memo ready. Firing to #deals-intel on Teams.", tone: "ok" },
  { prompt: "✓", text: "Done. Total execution time: 14.2s", tone: "ok" },
];
