# Google Sheets "Database" Setup (Netlify + Static Site)

This project reads content from Google Sheets using a small Netlify Function and renders it on the site.

## 1) Create the Sheet Tabs and Columns

Recommended: one tab per "table".

For News, create a tab named `news` with the first row as headers:

- `title`
- `date` (any human-readable value is fine, e.g. `2026-02-09` or `9 Feb 2026`)
- `category`
- `excerpt`
- `image` (absolute URL recommended)
- `link` (absolute URL recommended)
- `featured` (`true/false`, `1/0`, `yes/no`)

Data starts on row 2.

## 2) Permissions: "Only you write, everyone reads"

- Keep yourself as Editor.
- Share the sheet as Viewer:
  - Option A: "Anyone with the link" -> Viewer
  - Option B: Public Viewer

This is required for the API key approach (no user login on the website).

## 3) Google Cloud: API Key

In Google Cloud Console:

1. Create (or select) a project.
2. Enable `Google Sheets API`.
3. Create an API key.
4. Restrict the API key:
   - Application restriction: HTTP referrers (websites)
   - Add your site domain(s), e.g. `https://your-site.netlify.app/*` and your custom domain

## 4) Netlify: Environment Variables

In Netlify site settings, add:

- `GOOGLE_SHEETS_API_KEY`
- `GOOGLE_SHEETS_SHEET_ID`
- `GOOGLE_SHEETS_NEWS_RANGE` (optional, default `news!A1:Z`)

See `netlify.env.example`.

## 5) How the Site Reads the Sheet

- API endpoint: `GET /api/news`
  - Implemented in `netlify/functions/news.js`
  - Proxy to Google Sheets API
  - Returns `{ featured, items }`

- Frontend rendering: `broadstreet-rfc-website/js/news-feed.js`
  - Populates `broadstreet-rfc-website/pages/news.html`

## 5b) GoHighLevel (Custom HTML) Embed

If you are copying this into GoHighLevel pages, you cannot rely on Netlify Functions.

Use the standalone snippet:

- `broadstreet-rfc-website/snippets/ghl-news.html`

It reads Google Sheets directly from the browser using the Sheets API + API key.
In Google Cloud, restrict the API key by HTTP referrer to your GoHighLevel page domain(s).

## 6) GoHighLevel -> Google Sheets

Your plan (GoHighLevel forms writing into the same Google Sheet) is compatible with this setup.

Typical options:

- Native integration (if available in your account)
- Zapier / Make / Pabbly: "Form submitted" -> "Create Spreadsheet Row"

Important: make sure the tab and columns match the headers above.
