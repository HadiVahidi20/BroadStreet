/**
 * Broadstreet RFC - Google Sheets API Module
 * Fetches data from Google Sheets directly in the browser.
 * Works on Netlify and inside GoHighLevel Custom HTML blocks.
 */

const SheetsAPI = (function () {
  const cache = {};

  function getConfig() {
    if (typeof SiteConfig !== 'undefined' && SiteConfig.sheets) {
      return SiteConfig.sheets;
    }
    return { apiKey: '', sheetId: '', cacheTTL: 5 * 60 * 1000 };
  }

  function normalizeHeader(h) {
    return String(h || '').trim().toLowerCase().replace(/\s+/g, '_');
  }

  function rowsToObjects(values) {
    if (!Array.isArray(values) || values.length < 2) return [];
    const headers = values[0].map(normalizeHeader);
    const out = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || row.every(function (c) { return String(c || '').trim() === ''; })) continue;
      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        if (!headers[c]) continue;
        obj[headers[c]] = row[c] != null ? row[c] : '';
      }
      out.push(obj);
    }
    return out;
  }

  function parseBool(v) {
    var s = String(v || '').trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'y';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Fetch a tab from the Google Sheet.
   * @param {string} tabName - The sheet tab name (e.g. 'news', 'fixtures')
   * @param {string} [range] - Optional cell range (default: 'A1:Z')
   * @returns {Promise<Array<Object>>} Array of row objects
   */
  async function fetchTab(tabName, range) {
    var config = getConfig();
    if (!config.apiKey || !config.sheetId) {
      console.warn('SheetsAPI: Missing apiKey or sheetId in SiteConfig.sheets');
      return [];
    }

    var cacheKey = tabName + '!' + (range || 'A1:Z');
    var cached = cache[cacheKey];
    if (cached && (Date.now() - cached.time) < config.cacheTTL) {
      return cached.data;
    }

    var fullRange = tabName + '!' + (range || 'A1:Z');
    var url =
      'https://sheets.googleapis.com/v4/spreadsheets/' +
      encodeURIComponent(config.sheetId) +
      '/values/' +
      encodeURIComponent(fullRange) +
      '?key=' +
      encodeURIComponent(config.apiKey) +
      '&majorDimension=ROWS';

    try {
      var resp = await fetch(url, { headers: { accept: 'application/json' } });
      if (!resp.ok) throw new Error('Sheets API ' + resp.status);
      var data = await resp.json();
      var rows = rowsToObjects(data.values);
      cache[cacheKey] = { data: rows, time: Date.now() };
      return rows;
    } catch (e) {
      console.error('SheetsAPI.fetchTab("' + tabName + '"):', e);
      return [];
    }
  }

  return {
    fetchTab: fetchTab,
    parseBool: parseBool,
    esc: esc,
    rowsToObjects: rowsToObjects,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SheetsAPI;
}
