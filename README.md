# Capisco Lead Triage

A tiny one-page browser app to help you find and prioritize cheap local **HAG Capisco** chair opportunities near **New Rochelle, NY**.

- No hidden APIs
- No login automation
- No scraping bypasses
- Uses targeted link generation + manual lead input + heuristic ranking

## File tree

- `index.html` - One-page app UI
- `styles.css` - Minimal styling
- `app.js` - Search link generation, lead parsing, scoring, filters, persistence, import/export
- `README.md` - Setup and usage

## Fastest run option (Windows, no installs)

1. Download or copy these files into one folder.
2. Double-click `index.html`.
3. Use the app in your browser.

## Better local option (Windows, with one command)

If your browser blocks some local file features, run a tiny local server:

1. Install Node.js LTS.
2. Open **Command Prompt** in this folder.
3. Run:

```cmd
npx serve .
```

4. Open the shown local URL (usually `http://localhost:3000`).

## Optional Replit deployment

1. Create a new Replit (HTML/CSS/JS or Node).
2. Upload `index.html`, `styles.css`, `app.js`.
3. Run as static site (or serve root directory).
4. Open web preview.

## Default tuning

- Home location: `New Rochelle, NY`
- Radius: `30 miles`
- Max target price: `$400`
- Nearby region terms include White Plains, Yonkers, Bronx, Manhattan, Brooklyn, Queens, Stamford, Norwalk, Fairfield County, Hudson Valley, Long Island, North Jersey.

## How to use

1. Generate targeted links and open top links.
2. Review listings manually on marketplaces.
3. Paste promising leads into the app (single form or bulk paste).
4. Click **Re-score and sort**.
5. Focus on `CONTACT NOW` leads first.
6. Export CSV/JSON as needed.

## Bulk format

CSV or pipe-separated rows with 6 columns:

`title,url,price,location,source,notes`

Example:

```text
HAG Capisco 8106 black,https://example.com/1,295,White Plains,Craigslist,local pickup good condition
Capisco Puls stool,https://example.com/2,360,Stamford,eBay,used office furniture seller
```

## Heuristics (editable in `app.js`)

- Strong boost: exact `HAG Capisco`
- Strong boost: `Capisco Puls`
- Medium boost: `Capisco`
- Small boost: `saddle office chair`, `standing desk chair`, `ergonomic stool`, `drafting stool HAG`
- Price boosts: `<$300` big, `<= $400` moderate
- Locality boost for known nearby areas
- Penalties for shipping-only, damaged/missing parts, vague model text
- Modest boost for office liquidation context

## Notes

This tool is for decision support and triage. It does **not** do autonomous monitoring or unauthorized scraping.
