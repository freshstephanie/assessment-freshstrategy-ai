# assessment.freshstrategy.ai (GitHub Pages deploy)

Public deploy site for Fresh Strategy AI Readiness assessments, served via GitHub
Pages at the custom domain **assessment.freshstrategy.ai** (see `CNAME`).

| Path | Tool | Source repo (dev) |
|---|---|---|
| `/associations/` | **AAE AI Readiness Check** | `freshstephanie/aae-readiness-frontend` |
| `/` (root) | interim redirect to `/associations/` | - |

## Structure
- `CNAME` — custom domain (`assessment.freshstrategy.ai`).
- `index.html` — root redirect to `/associations/` (placeholder until the business
  assessment migrates here at root, `.ch -> .ai`).
- `associations/` — the AAE front end (built + QA'd in the dev repo above; this is a
  deploy copy of its `index.html` / `style.css` / `script.js` / `logo.png` /
  `og-image.png`). To update, copy those five files from the dev repo and push.

## DNS (Spaceship, on freshstrategy.ai)
`CNAME  assessment  ->  freshstephanie.github.io`

## Notes
- `logo.png` / `og-image.png` under `associations/` are Fresh Strategy placeholders
  pending real AAE artwork — swap those two files and push.
- No secrets here: the Google Form id + entry ids are client-side by nature (same as
  any deployed front end).
