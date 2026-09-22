# assessment.freshstrategy.ai (GitHub Pages deploy)

Public deploy site for Fresh Strategy AI Readiness assessments, served via GitHub
Pages at the custom domain **assessment.freshstrategy.ai** (see `CNAME`).

| Path | Tool | Source repo (dev) |
|---|---|---|
| `/` (root) | **Business AI Readiness Assessment** | `freshstephanie/ai-readiness-frontend` |
| `/associations/` | **AAE AI Readiness Check** | `freshstephanie/aae-readiness-frontend` |

## Structure
- `CNAME` — custom domain (`assessment.freshstrategy.ai`).
- `index.html` / `style.css` / `script.js` / `og-image.png` / `logo.png` at root — the
  business front end. Deploy copy: to update, copy those five files from the dev repo
  and push. Migrated here from `assessment.freshstrategy.ch` on 2026-09-22.
- `associations/` — the AAE front end (built + QA'd in the dev repo above; this is a
  deploy copy of its `index.html` / `style.css` / `script.js` / `logo.png` /
  `og-image.png`). To update, copy those five files from the dev repo and push.

Root and `associations/` share no filenames. Both apps reference their assets
relatively, so neither can reach the other's files.

## The old .ch host
`assessment.freshstrategy.ch` is a separate Pages repo, `freshstephanie/ai-readiness-app`.
It no longer serves the app: it is a query-preserving redirect to this site's root, so
old links and printed QR codes keep working with their `?source=` attribution intact.
Do not re-deploy app files there.

## DNS (Spaceship, on freshstrategy.ai)
`CNAME  assessment  ->  freshstephanie.github.io`

Both `assessment.freshstrategy.ai` and `assessment.freshstrategy.ch` CNAME to
`freshstephanie.github.io`; Pages routes by Host header using each repo's own `CNAME`
file. The migration needed no DNS change at either registrar.

## Notes
- `logo.png` / `og-image.png` under `associations/` are Fresh Strategy placeholders
  pending real AAE artwork — swap those two files and push.
- No secrets here: the Google Form id + entry ids are client-side by nature (same as
  any deployed front end).
