# I-485 Status Explorer

A React dashboard that **combines your private USCIS case JSON** with **community I-485 tracker data** from the [I-485 Status Filer](https://docs.google.com/spreadsheets/d/1rg0ZqadJ3_fd8pWQ9WoDpzZCU6KQEJ5vX1vUkd0DKXI/htmlview) spreadsheet.

## Two data sources · One picture

| Source | What it gives you |
|---|---|
| **Your USCIS JSON** (private) | Official ELIS event timeline, FTA0/silent updates, interview waiver detection, progress bar — parsed 100% in your browser |
| **Community spreadsheet** (shared) | Receipt-month tabs, block # queue position, peer approval dates, discussions, Emma agent tips |

USCIS JSON is processed entirely in your browser — your data never leaves your device.

## Tabs

- **What this does** — explains the tool and how personal + community data work together
- **My USCIS case** — paste JSON, see your timeline + community block matches + action plan
- **Find in community** — search spreadsheet by receipt date / block # without JSON
- **Action plan** — guidance for a selected community case
- **Trends / All cases / Discussions** — charts, filters, agent logs

## Get your USCIS JSON

1. Sign in at [myaccount.uscis.gov](https://myaccount.uscis.gov/sign-in)
2. Open `https://my.uscis.gov/account/case-service/api/cases/IOE09XXXXXXXX`
3. Copy the JSON → paste in **My USCIS case** → **Analyze case**

## Data sources (live from Google Sheets)

| Tab type | Sheets loaded |
|---|---|
| Receipt-month case tabs | Oct '25, Nov '25, Dec '25, Jan '26, Feb '26, Mar '26, Apr '26, May '26 + legacy |
| Discussion | Community Q&A threads |
| Emma Agents | Agent name, ID, rating, comments |
| Please Read | Rules and resource links |

## Local development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Push to GitHub (repo name `voice-agent` or update `base` in `vite.config.js`)
2. Enable **GitHub Actions** as the Pages source
3. Push to `main` — workflow deploys automatically

Or: `GITHUB_PAGES=true npm run deploy`

## Disclaimer

Community-reported data for informational purposes only. Not legal advice or official USCIS processing times.
