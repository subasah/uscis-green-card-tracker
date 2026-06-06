# USCIS Green Card Tracker

A React dashboard that **combines your private USCIS case JSON** with **community I-485 tracker data** from the [I-485 Status Filer](https://docs.google.com/spreadsheets/d/1rg0ZqadJ3_fd8pWQ9WoDpzZCU6KQEJ5vX1vUkd0DKXI/htmlview) spreadsheet.

**Live site:** https://subasah.github.io/uscis-green-card-tracker/

Inspired by tools like the [USCIS Case Status Tracker](https://uscis-tracker.github.io/), with added community spreadsheet trends, block matching, and r/EB2_NIW Reddit insights.

## Two data sources · One picture

| Source | What it gives you |
|---|---|
| **Your USCIS JSON** (private) | Official ELIS event timeline, FTA0/silent updates, interview waiver detection, progress bar — parsed 100% in your browser |
| **Community spreadsheet** (shared) | Receipt-month tabs, block # queue position, peer approval dates, Emma agent tips |
| **r/EB2_NIW** (Reddit RSS) | Recent subreddit posts synced hourly |

USCIS JSON is processed entirely in your browser — your data never leaves your device.

## Tabs

- **My USCIS case** — paste JSON, see your timeline + community block matches + action plan
- **Find in community** — search spreadsheet by receipt date / block # without JSON
- **Action plan** — guidance for a selected community case
- **Trends / All cases** — charts and filters
- **Emma agents** — helpful agent log from the spreadsheet
- **Reddit** — recent r/EB2_NIW posts
- **Tutorial** — how to use the app

## Get your USCIS JSON

1. Sign in at [myaccount.uscis.gov](https://myaccount.uscis.gov/sign-in)
2. Open `https://my.uscis.gov/account/case-service/api/cases/IOE09XXXXXXXX`
3. Copy the JSON → paste in **My USCIS case** → **Analyze case**

## Local development

```bash
npm install
npm run dev
```

Sync Reddit feed locally:

```bash
npm run sync:reddit
```

## Deploy to GitHub Pages

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds and deploys to Pages.

Site URL: `https://<username>.github.io/uscis-green-card-tracker/` (repo name must match `base` in `vite.config.js`).

## Disclaimer

Community-reported data for informational purposes only. Not legal advice or official USCIS processing times. This tool is not affiliated with USCIS.
