# 居與財 · Personal Finance Lab

A browser-local Traditional Chinese rent-versus-buy calculator, rebuilt from scratch. The repository was empty; no prior application implementation was reused. Synthetic demonstration inputs only. The existing OpenAI Site identity remains in `.openai/hosting.json`.

## Run

Requires **Node.js 24+**. There are no npm dependencies, external fonts, CDNs or runtime services.

```sh
npm test
npm run build
npm run preview
# Open http://localhost:4173
```

Build uses Node's native TypeScript stripping. The deterministic typed engine is separate from the DOM UI. This does not run a TypeScript static type checker; runtime tests and schema validation are included.

```text
src/model.ts           schema, tax, mortgage, cash-flow engine, full-target DCA
src/history.ts         public price-series normalization and rolling windows
src/history-data.json  allowlisted public market prices only
src/app.js             browser UI and explicit local file/device operations
scripts/build.mjs      reproducible static build
scripts/parity.mjs     private reference comparison (external fixture required)
scripts/browser-qa.py  optional Chromium interaction checks
```

The dashboard has three guided input sections, affordable contributions, cash-flow and funding checks, separate asset/debt/equity components, 5–50 year checkpoints, recomputed return sensitivities, a monthly audit CSV and annual tax tables. Independent fixed-target DCA is explicitly distinct from affordable investing. The historical page separates price-only comparisons from SPY dividend-adjusted references.

## Privacy and saving

All calculations run in the browser. No Google OAuth, Sheet synchronization, financial server database or analytics are included. Startup always uses synthetic inputs. Local storage is written only by the explicit Save button, and read only by Load. Changing inputs never automatically overwrites a saved scenario. JSON import/export uses schema `personal-finance`, version `1`; invalid data is rejected without replacing current inputs. Apply edited inputs before saving/exporting.

Never add private reference exports, financial fixtures, signed download URLs or credentials to this repository. Private validation uses `PRIVATE_REFERENCE` pointing outside the checkout. The build copies an explicit file allowlist, not the repository tree.

## Verification

See [validation](docs/VALIDATION.md), [model map](docs/MODEL.md), and [deployment handoff](docs/DEPLOYMENT.md).

```sh
PRIVATE_REFERENCE=/absolute/private/path/parity.json npm run test:parity
# Optional, with Python Playwright + Chromium already installed and preview running:
BROWSER_PATH=/usr/bin/chromium python scripts/browser-qa.py
```

The tax model intentionally freezes the reference's 2026/27 Hong Kong rules. It is a scenario tool, not tax advice or a forecast. It does not cover every tax concession or personal circumstance. No merged-spouse wealth, unknown pension asset balance, or implicit loan to cover an unpaid gap is invented.
