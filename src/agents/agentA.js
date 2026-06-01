import axios from "axios";
import * as cheerio from "cheerio";

const BRIGHT_DATA_HOST = "brd.superproxy.io";
const BRIGHT_DATA_PORT = 22225;

const fetcher = axios.create({
  timeout: 30000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NexusAgent/1.0)",
    Accept: "text/html,application/xhtml+xml,application/json",
  },
});

function hasBrightDataConfig() {
  return Boolean(
    process.env.BRIGHT_DATA_USER &&
      process.env.BRIGHT_DATA_PASS &&
      process.env.BRIGHT_DATA_SERP_KEY,
  );
}

function proxyConfig() {
  return {
    host: BRIGHT_DATA_HOST,
    port: BRIGHT_DATA_PORT,
    auth: {
      username: process.env.BRIGHT_DATA_USER,
      password: process.env.BRIGHT_DATA_PASS,
    },
    protocol: "http",
  };
}

async function scrapeSecFilings(company) {
  try {
    const query = encodeURIComponent(company);
    const url = `https://efts.sec.gov/LATEST/search-index?q=${query}&dateRange=custom&startdt=${getPastDate(30)}&forms=8-K,13-D,SC%2013G`;
    const res = await fetcher.get(url, { proxy: proxyConfig() });
    const filings = res.data?.hits?.hits || [];

    return filings.slice(0, 5).map((filing) => ({
      type: "regulatory",
      source: "SEC EDGAR",
      title: `${filing._source?.file_date || "Recent"} - ${filing._source?.form_type || "Filing"}`,
      detail: filing._source?.period_of_report || "Recent regulatory activity detected.",
      weight: filing._source?.form_type === "13-D" ? 1.4 : 1.0,
      rawUrl: `https://www.sec.gov/Archives/edgar/data/${filing._source?.entity_id || ""}`,
      scrapedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error("SEC scrape failed:", err.message);
    return [];
  }
}

async function scrapeNewsSignals(company) {
  try {
    const url = `https://api.brightdata.com/serp/google/search?q=${encodeURIComponent(
      `${company} merger acquisition investment stake`,
    )}&num=10&tbm=nws&key=${process.env.BRIGHT_DATA_SERP_KEY}`;
    const res = await fetcher.get(url);
    const articles = res.data?.organic_results || [];

    return articles
      .slice(0, 8)
      .filter((article) =>
        /acqui|merger|stake|bid|deal|buyout/i.test(
          `${article.title || ""} ${article.snippet || ""}`,
        ),
      )
      .map((article) => ({
        type: "news",
        source: article.source || "Google News",
        title: article.title,
        detail: article.snippet?.slice(0, 200) || "",
        weight: 0.8,
        rawUrl: article.link,
        scrapedAt: new Date().toISOString(),
      }));
  } catch (err) {
    console.error("SERP news scrape failed:", err.message);
    return [];
  }
}

async function scrapeCareersPage(company) {
  try {
    const searchUrl = `https://api.brightdata.com/serp/google/search?q=${encodeURIComponent(
      `${company} careers jobs site`,
    )}&num=3&key=${process.env.BRIGHT_DATA_SERP_KEY}`;
    const searchRes = await fetcher.get(searchUrl);
    const results = searchRes.data?.organic_results || [];
    const careersUrl = results.find((result) =>
      /career|job|work/i.test(result.link || ""),
    )?.link;

    if (!careersUrl) return [];

    const pageRes = await fetcher.get(careersUrl, { proxy: proxyConfig() });
    const $ = cheerio.load(pageRes.data);
    const jobCount = $('[class*="job"],[class*="role"],[class*="position"]').length;
    const integrationJobs = $('*:contains("integration"),*:contains("M&A"),*:contains("acquisition")')
      .filter((_, el) => $(el).children().length === 0).length;

    const signals = [];
    if (jobCount > 50) {
      signals.push({
        type: "hiring",
        source: "Careers Page",
        title: `High job posting volume detected (${jobCount} open roles)`,
        detail: "Unusual volume may indicate expansion or integration preparation.",
        weight: jobCount > 100 ? 1.3 : 0.9,
        rawUrl: careersUrl,
        scrapedAt: new Date().toISOString(),
      });
    }

    if (integrationJobs > 0) {
      signals.push({
        type: "hiring",
        source: "Careers Page",
        title: `Integration or M&A-related roles detected (${integrationJobs} found)`,
        detail: "Roles referencing integration or M&A are a strong pre-deal signal.",
        weight: 1.5,
        rawUrl: careersUrl,
        scrapedAt: new Date().toISOString(),
      });
    }

    return signals;
  } catch (err) {
    console.error("Careers scrape failed:", err.message);
    return [];
  }
}

async function scrapeExecutiveSignals(company) {
  try {
    const url = `https://api.brightdata.com/serp/google/search?q=${encodeURIComponent(
      `site:linkedin.com/in "${company}" CEO OR CFO OR "Chief"`,
    )}&num=5&key=${process.env.BRIGHT_DATA_SERP_KEY}`;
    const res = await fetcher.get(url);
    const results = res.data?.organic_results || [];

    return results
      .filter((result) => /former|previously|ex-|left/i.test(result.snippet || ""))
      .map((result) => ({
        type: "personnel",
        source: "LinkedIn",
        title: `Possible executive departure: ${result.title}`,
        detail: result.snippet?.slice(0, 200) || "",
        weight: 1.2,
        rawUrl: result.link,
        scrapedAt: new Date().toISOString(),
      }));
  } catch (err) {
    console.error("LinkedIn scrape failed:", err.message);
    return [];
  }
}

export async function agentA_collectSignals(company) {
  if (!hasBrightDataConfig()) {
    console.log("  [A0] Bright Data credentials missing. Live ingestion unavailable.");
    return [];
  }

  console.log("  [A1] Scraping SEC EDGAR...");
  const secSignals = await scrapeSecFilings(company);

  console.log("  [A2] Scraping Google News via SERP API...");
  const newsSignals = await scrapeNewsSignals(company);

  console.log("  [A3] Scraping careers page...");
  const careersSignals = await scrapeCareersPage(company);

  console.log("  [A4] Checking executive LinkedIn signals...");
  const executiveSignals = await scrapeExecutiveSignals(company);

  const all = [...secSignals, ...newsSignals, ...careersSignals, ...executiveSignals];
  console.log(`  Collected ${all.length} raw signals across 4 sources`);
  return all;
}

function getPastDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}
