import { randomUUID } from "crypto";
import { Firecrawl } from "firecrawl";

const SEARCH_LIMIT = 6;
const MAX_SIGNALS = 10;
const DETAIL_LIMIT = 320;
const CONTENT_LIMIT = 1400;

const FIRECRAWL_SCRAPE_OPTIONS = {
  formats: ["markdown"],
  onlyMainContent: true,
  excludeTags: ["nav", "footer", "header", "aside", "script", "style", "noscript", "svg", "form"],
  removeBase64Images: true,
  blockAds: true,
  timeout: 30000,
};

const SIGNAL_RULES = [
  {
    type: "regulatory",
    label: "Regulatory Filings",
    pattern:
      /\b(sec|edgar|companies house|regulatory portal|filing|8-k|13d|ftc|doj|regulator|regulatory|antitrust|lawsuit|probe|investigation|approval|permit|license)\b/i,
    detail:
      "SEC EDGAR, Companies House, EU regulatory portals. Unusual 8-K or 13-D filings are often the first public trace of a deal in motion.",
    weight: 1.15,
  },
  {
    type: "personnel",
    label: "Executive Movement",
    pattern:
      /\b(ceo|cfo|chief|executive|board|director|leadership|appoint|appointed|resign|resigned|departure|step down|c-suite|linkedin|vp|vice president|c-level)\b/i,
    detail:
      "Sudden C-suite departures, title changes on LinkedIn, or a VP quietly removing their employer - these patterns precede acquisitions by weeks.",
    weight: 0.95,
  },
  {
    type: "hiring",
    label: "Hiring Pattern Shifts",
    pattern:
      /\b(hiring|layoff|job cuts|workforce|recruit|open roles|careers|hiring freeze|headcount|integration engineer|hire|job posting)\b/i,
    detail:
      "A company posting integration engineers overnight signals deal preparation. A sudden hiring freeze signals a deal has already been agreed.",
    weight: 0.9,
  },
  {
    type: "patents",
    label: "Patent Clusters",
    pattern:
      /\b(patent|patents|intellectual property|ip filings|patent application|patent filing|patent cluster|ip leverage)\b/i,
    detail:
      "Rapid patent filings in a specific domain by an acquiring company often signal they are building IP leverage before making a move.",
    weight: 1.0,
  },
  {
    type: "news",
    label: "News Velocity",
    pattern:
      /\b(acquisition|acquire|merger|takeover|buyout|stake|strategic investment|investor group|bid|deal|press coverage|analyst|velocity|financial press|conference|spikes|valuation|funding|partnership|joint venture|risk|delay|shortage|recall|blocked|strike|shutdown|debt|loss|warning|guidance|supply chain|production issue|ipo|public listing|capital raise|secondary sale|share sale|shares|stock|price target|market cap|wall street|volatility|macro|inflation|rates|liquidity)\b/i,
    detail:
      "Unusual spikes in financial press coverage, analyst mentions, or conference appearances around a specific company name.",
    weight: 0.85,
  },
  {
    type: "ir_traffic",
    label: "IR Page Traffic",
    pattern:
      /\b(ir page|investor relations|page visits|page traffic|traffic spike|traffic surge|due diligence|institutional investors)\b/i,
    detail:
      "Unusual surges in investor relations page visits often indicate institutional investors quietly doing due diligence.",
    weight: 1.0,
  },
];

let firecrawlClient = null;

function disableBrokenProxyEnv() {
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) {
    const value = process.env[key];
    if (value && /127\.0\.0\.1:9\b|localhost:9\b/i.test(value)) {
      delete process.env[key];
    }
  }

  process.env.NO_PROXY = [
    process.env.NO_PROXY,
    "api.firecrawl.dev",
    "firecrawl.dev",
    ".firecrawl.dev",
  ]
    .filter(Boolean)
    .join(",");
}

function getFirecrawlClient() {
  if (!process.env.FIRECRAWL_API_KEY) return null;
  if (!firecrawlClient) {
    disableBrokenProxyEnv();
    firecrawlClient = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
  }
  return firecrawlClient;
}

function cleanText(value, maxLength = DETAIL_LIMIT) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function toReadableText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return cleanText(value, Number.MAX_SAFE_INTEGER);
  }

  if (Array.isArray(value)) {
    return value.map(toReadableText).filter(Boolean).join(" ");
  }

  return "";
}

function extractJsonText(value) {
  if (!value || typeof value !== "object") return toReadableText(value);

  const fields = [
    value.title,
    value.headline,
    value.summary,
    value.description,
    value.keyInsight,
    value.development,
    value.riskFactor,
    value.riskFactors,
    value.signals,
    value.keyFacts,
  ];

  return fields.map(toReadableText).filter(Boolean).join(" ");
}

function firstText(...values) {
  for (const value of values) {
    const text = toReadableText(value) || extractJsonText(value);
    if (text) return text;
  }

  return "";
}

function sourceFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Firecrawl Search";
  }
}

function buildSearchQuery(company) {
  return [
    "latest market stability macro developments volatility strategic risk signal news",
    company,
    "corporate development investment valuation funding crypto policy regulation supply chain leadership hiring operations patents investor relations page traffic",
  ].join(" ");
}

function getSearchItems(searchResult) {
  const legacyData = Object.getOwnPropertyDescriptor(searchResult ?? {}, "data");
  const legacyValue = legacyData && "value" in legacyData ? legacyData.value : null;
  const buckets = [
    Array.isArray(searchResult) ? searchResult : null,
    searchResult?.news,
    searchResult?.web,
    legacyValue,
    legacyValue?.news,
    legacyValue?.web,
  ];
  const seen = new Set();

  return buckets
    .flatMap((bucket) => (Array.isArray(bucket) ? bucket : []))
    .filter((item) => {
      const key = firstText(
        item?.url,
        item?.metadata?.sourceURL,
        item?.title,
        item?.metadata?.title,
        item?.description,
        item?.snippet,
        item?.markdown,
      ).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function classifySignal(item) {
  const corpus = [
    item?.title,
    item?.description,
    item?.snippet,
    item?.markdown,
    item?.content,
    item?.summary,
    extractJsonText(item?.json),
    item?.metadata?.title,
    item?.metadata?.description,
    item?.metadata?.sourceURL,
  ].join(" ");

  return (
    SIGNAL_RULES.find((rule) => rule.pattern.test(corpus)) || {
      type: "news",
      label: "Market coverage",
      detail:
        "Recent company coverage is a low-weight monitoring signal when no acute risk or deal term is present.",
      weight: 0.45,
    }
  );
}

function createSignal(company, item) {
  const rule = classifySignal(item);
  const url = firstText(item?.url, item?.metadata?.sourceURL);
  const title = cleanText(firstText(item?.title, item?.metadata?.title, url, "Firecrawl result"), 180);
  const content = cleanText(
    firstText(
      item?.markdown,
      item?.content,
      item?.summary,
      item?.description,
      item?.snippet,
      item?.metadata?.description,
      item?.json,
    ),
    CONTENT_LIMIT,
  );
  const summary = cleanText(firstText(item?.description, item?.snippet, item?.metadata?.description, content), 220);
  const detail = summary ? `${rule.label}: ${rule.detail} ${summary}` : `${rule.label}: ${rule.detail}`;

  return {
    id: randomUUID(),
    company,
    type: rule.type,
    label: rule.label,
    source: firstText(item?.source, item?.siteName, item?.metadata?.siteName) || sourceFromUrl(url),
    title,
    detail: cleanText(detail),
    content,
    weight: rule.weight,
    rawUrl: url,
    scrapedAt: new Date().toISOString(),
  };
}

export async function agentA_collectSignals(company, logCallback) {
  const log = logCallback || (() => {});
  let signals = [];
  let provider = "FIRECRAWL";

  // ==========================================
  // TIER 1: PRIMARY INGESTION VIA FIRECRAWL
  // ==========================================
  try {
    log("Tier 1: Querying live web and financial telemetry via Firecrawl...", "info");
    const firecrawl = getFirecrawlClient();
    if (!firecrawl) {
      throw new Error("FIRECRAWL_API_KEY is not configured.");
    }

    const searchResult = await firecrawl.search(buildSearchQuery(company), {
      limit: SEARCH_LIMIT,
      sources: ["news", "web"],
      tbs: "qdr:m",
      timeout: 30000,
      scrapeOptions: FIRECRAWL_SCRAPE_OPTIONS,
    });

    if (searchResult?.success === false) {
      throw new Error("Firecrawl response returned unsuccessful status.");
    }

    const items = getSearchItems(searchResult);
    if (!items || !items.length) {
      throw new Error("Firecrawl returned empty search result data.");
    }

    signals = items
      .filter((item) =>
        firstText(
          item?.title,
          item?.metadata?.title,
          item?.description,
          item?.snippet,
          item?.markdown,
          item?.content,
          item?.summary,
          item?.json,
        ),
      )
      .slice(0, MAX_SIGNALS)
      .map((item) => createSignal(company, item));

    log(`✅ Tier 1 Successful: Collected ${signals.length} web signals via Firecrawl.`, "success");
    return { signals, provider };
  } catch (firecrawlError) {
    log(`⚠️ Tier 1 Failed (${firecrawlError.message}). Falling back to Tier 2: Tavily...`, "warn");
    provider = "TAVILY";
  }

  // ==========================================
  // TIER 2: SECONDARY BACKUP VIA TAVILY AI
  // ==========================================
  if (provider === "TAVILY") {
    try {
      if (!process.env.TAVILY_API_KEY) {
        throw new Error("TAVILY_API_KEY is not configured.");
      }

      log("Tier 2: Fetching live research index via Tavily REST endpoint...", "info");
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: buildSearchQuery(company),
          search_depth: "basic",
          include_answer: false,
          max_results: SEARCH_LIMIT,
        }),
      });

      if (!tavilyResponse.ok) {
        throw new Error(`Tavily search API returned status: ${tavilyResponse.status}`);
      }

      const resData = await tavilyResponse.json();
      const results = resData.results || [];
      if (!results.length) {
        throw new Error("Tavily returned empty search results.");
      }

      const items = results.map((r) => ({
        title: r.title,
        markdown: r.content,
        url: r.url,
        snippet: r.content,
        source: new URL(r.url).hostname.replace(/^www\./, ""),
      }));

      signals = items.map((item) => createSignal(company, item));
      log(`✅ Tier 2 Successful: Collected ${signals.length} research signals via Tavily.`, "success");
      return { signals, provider };
    } catch (tavilyError) {
      log(`⚠️ Tier 2 Failed (${tavilyError.message}). Falling back to Tier 3: Gemini Grounding...`, "warn");
      provider = "GEMINI_GROUNDING";
    }
  }

  // ==========================================
  // TIER 3: TERTIARY FALLBACK FLAG
  // ==========================================
  return { signals: [], provider };
}
