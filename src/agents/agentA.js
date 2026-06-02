import { randomUUID } from "crypto";
import { Firecrawl } from "firecrawl";

const SEARCH_LIMIT = 5;
const MAX_SIGNALS = 8;
const DETAIL_LIMIT = 320;
const CONTENT_LIMIT = 1800;

const SIGNAL_RULES = [
  {
    type: "regulatory",
    label: "Regulatory pressure",
    pattern:
      /\b(sec|ftc|doj|regulator|regulatory|antitrust|lawsuit|probe|investigation|approval|permit|license|filing|8-k|13d)\b/i,
    detail:
      "Regulatory, legal, or filing activity can alter valuation, deal timing, or strategic optionality.",
    weight: 1.15,
  },
  {
    type: "personnel",
    label: "Leadership signal",
    pattern:
      /\b(ceo|cfo|chief|executive|board|director|leadership|appoint|appointed|resign|resigned|departure|step down)\b/i,
    detail:
      "Leadership and board movement can indicate strategic transition or transaction preparation.",
    weight: 0.95,
  },
  {
    type: "hiring",
    label: "Workforce signal",
    pattern:
      /\b(hiring|layoff|job cuts|workforce|recruit|open roles|careers|hiring freeze|headcount)\b/i,
    detail:
      "Workforce expansion, contraction, or hiring freezes can expose operational and integration signals.",
    weight: 0.9,
  },
  {
    type: "news",
    label: "Deal activity",
    pattern:
      /\b(acquisition|acquire|merger|takeover|buyout|stake|strategic investment|investor group|bid|deal)\b/i,
    detail: "Deal or investment language is a direct strategic signal.",
    weight: 1.1,
  },
  {
    type: "news",
    label: "Risk factor",
    pattern:
      /\b(risk|delay|shortage|recall|blocked|strike|shutdown|debt|loss|warning|guidance|supply chain|production issue)\b/i,
    detail:
      "Operational, financial, or supply-chain pressure can change market confidence and transaction timing.",
    weight: 0.95,
  },
  {
    type: "news",
    label: "Market speculation",
    pattern:
      /\b(ipo|public listing|valuation|funding|financing|capital raise|secondary sale|share sale|shares|stock|analyst|price target|market cap|wall street)\b/i,
    detail:
      "Market speculation, valuation movement, and capital-market activity are valid strategic signals.",
    weight: 0.85,
  },
  {
    type: "news",
    label: "Strategic development",
    pattern:
      /\b(partnership|joint venture|contract|launch|expansion|factory|facility|delivery|restructuring|spin-off|spinoff)\b/i,
    detail:
      "Major corporate or operating developments are valid monitoring signals even without an acute threat.",
    weight: 0.75,
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

function sourceFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Firecrawl Search";
  }
}

function buildSearchQuery(company) {
  return [
    "latest news market reaction financial analysis risk signal",
    company,
    "corporate development investment valuation funding policy regulation supply chain leadership",
  ].join(" ");
}

function getSearchItems(searchResult) {
  const legacyData = Object.getOwnPropertyDescriptor(searchResult ?? {}, "data");
  const buckets = [
    Array.isArray(searchResult) ? searchResult : null,
    searchResult?.news,
    searchResult?.web,
    legacyData && "value" in legacyData ? legacyData.value : null,
    legacyData && "value" in legacyData ? legacyData.value?.news : null,
    legacyData && "value" in legacyData ? legacyData.value?.web : null,
  ];
  const seen = new Set();

  return buckets
    .flatMap((bucket) => (Array.isArray(bucket) ? bucket : []))
    .filter((item) => {
      const key = cleanText(item?.url || item?.title || item?.description || item?.markdown).toLowerCase();
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
    item?.metadata?.title,
    item?.metadata?.description,
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
  const url = item?.url || item?.metadata?.sourceURL || "";
  const title = cleanText(item?.title || item?.metadata?.title || url || "Firecrawl result", 180);
  const content = cleanText(
    item?.markdown || item?.content || item?.description || item?.snippet || item?.metadata?.description,
    CONTENT_LIMIT,
  );
  const summary = cleanText(item?.description || item?.snippet || content, 220);
  const detail = summary ? `${rule.label}: ${rule.detail} ${summary}` : `${rule.label}: ${rule.detail}`;

  return {
    id: randomUUID(),
    company,
    type: rule.type,
    source: item?.source || item?.siteName || sourceFromUrl(url),
    title,
    detail: cleanText(detail),
    content,
    weight: rule.weight,
    rawUrl: url,
    scrapedAt: new Date().toISOString(),
  };
}

export async function agentA_collectSignals(company) {
  const firecrawl = getFirecrawlClient();

  if (!firecrawl) {
    console.log("  [A0] FIRECRAWL_API_KEY is missing. Live ingestion unavailable.");
    return [];
  }

  try {
    console.log(`  [A1] Executing Firecrawl search for ${company}...`);
    const searchResult = await firecrawl.search(buildSearchQuery(company), {
      limit: SEARCH_LIMIT,
      sources: ["news", "web"],
      scrapeOptions: {
        formats: ["markdown"],
      },
    });

    if (searchResult?.success === false) {
      console.log("  [A1] Firecrawl search returned an unsuccessful response.");
      return [];
    }

    const items = getSearchItems(searchResult);
    const signals = items
      .filter((item) => item?.title || item?.description || item?.snippet || item?.markdown)
      .slice(0, MAX_SIGNALS)
      .map((item) => createSignal(company, item));

    console.log(`  [A1] Collected ${signals.length} live signals from Firecrawl.`);
    return signals;
  } catch (err) {
    console.error("Firecrawl collection failed:", err.message);
    return [];
  }
}
