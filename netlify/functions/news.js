/**
 * GET /api/news
 *
 * Reads rows from a Google Sheet and returns JSON suitable for the News page.
 *
 * Required env vars (set in Netlify site settings):
 * - GOOGLE_SHEETS_API_KEY
 * - GOOGLE_SHEETS_SHEET_ID
 *
 * Optional:
 * - GOOGLE_SHEETS_NEWS_RANGE (default: "news!A1:Z")
 *
 * Sheet format:
 * Row 1 = headers. Example headers:
 * - title, date, category, excerpt, image, link, featured
 */

const DEFAULT_RANGE = "news!A1:Z";

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Basic caching: fast enough for a news feed and reduces API calls.
      "cache-control": "public, max-age=300",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseBool(v) {
  const s = String(v || "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function rowsToObjects(values) {
  if (!Array.isArray(values) || values.length < 2) return [];
  const headers = values[0].map(normalizeHeader);

  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.every((c) => String(c || "").trim() === "")) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = row[c] ?? "";
    }
    out.push(obj);
  }
  return out;
}

exports.handler = async function handler(event) {
  if (event.httpMethod && event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed" }, { allow: "GET" });
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
  const range = process.env.GOOGLE_SHEETS_NEWS_RANGE || DEFAULT_RANGE;

  if (!apiKey || !sheetId) {
    return json(500, {
      error: "missing_env",
      required: ["GOOGLE_SHEETS_API_KEY", "GOOGLE_SHEETS_SHEET_ID"],
    });
  }

  const url =
    "https://sheets.googleapis.com/v4/spreadsheets/" +
    encodeURIComponent(sheetId) +
    "/values/" +
    encodeURIComponent(range) +
    "?key=" +
    encodeURIComponent(apiKey) +
    "&majorDimension=ROWS";

  let data;
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    if (!resp.ok) {
      return json(resp.status, {
        error: "google_sheets_error",
        status: resp.status,
        body: text,
      });
    }
    data = JSON.parse(text);
  } catch (e) {
    return json(502, { error: "fetch_failed", detail: String(e && e.message ? e.message : e) });
  }

  const items = rowsToObjects(data.values).map((x) => ({
    title: String(x.title || "").trim(),
    date: String(x.date || "").trim(),
    category: String(x.category || "").trim() || "Club News",
    excerpt: String(x.excerpt || "").trim(),
    image: String(x.image || "").trim(),
    link: String(x.link || "").trim(),
    featured: parseBool(x.featured),
  }));

  // Featured: first explicit featured, else first item.
  const featured = items.find((i) => i.featured) || items[0] || null;
  const rest = featured ? items.filter((i) => i !== featured) : items;

  return json(200, { featured, items: rest });
};

