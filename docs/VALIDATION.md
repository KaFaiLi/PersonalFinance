# Validation report — 2026-10-10

## Passed

- **30 Node tests**, covering determinism, 600 months, effective-rate conversion, zero/negative returns, zero-interest mortgages, 480-month payoff, contribution caps/timing, retirement, cash depletion, persistent gaps, buy-only gifts, separate shares, financed insurance, 3% target growth, zero-versus-blank overrides, surplus allocation, full-target DCA, progressive/standard tax, pension/rental/interest deductions, claim-year selection, schema/import/export, conservation and nonfinite-output rejection.
- **Input mapping:** 75 normalized parameters recomputed from the private input cells matched the frozen dependency values, with no mismatches; the complete semantic input fixture passed schema validation.
- **Frozen-reference parity:** all 600 monthly rows × 76 columns and 50 annual rows × 29 columns traversed, including blank handling. **46,990 nonblank cells compared; 0 failures** under the policies below. Maximum non-audit relative numerical difference: **1.1896482448628392e-13**. No private amounts are emitted by the parity harness.
- **29 real Chromium browser checks** using Python Playwright: desktop main geometry; desktop and all five mobile routes without document overflow; keyboard skip link; form submit; explicit local save/load/delete; no automatic persistence/loading; JSON export/import, invalid import preservation and repeated same-file import; invalid rate rejection; zero override preservation; 600-row CSV; independent DCA; historical fixed/rolling/dividend views; non-five-year horizon; unconfirmed gift labeling and wealth withholding; repeated navigation; zero uncaught runtime errors; only same-origin static requests, no external APIs/analytics.
- Production static build and JavaScript syntax checks passed with Node 24.19.0.
- Desktop 1440 px and mobile 390 px screenshots inspected. Fixed an unclosed navigation anchor and mobile metric intrinsic-width overflow found during QA.

## Precision policy

The engine uses IEEE-754 double precision without intermediate currency rounding. UI rounds to whole HKD; CSV preserves calculated numeric precision. Reference parity tolerance for monetary/numeric cells is `max(0.01 HKD, abs(reference) × 1e-10)`. Blanks remain missing values and are not converted to zero.

Audit residual columns AY/AZ subtract extremely large nearly equal balances under the private reference's extreme return assumption. Their tolerance additionally permits `32 × Number.EPSILON × largest relevant portfolio/equity balance`. Maximum residual difference was **0.078125 HKD**, caused by floating-point cancellation at those extreme scales; ordinary-scale conservation tests require residuals below 0.000001 HKD. This special audit tolerance is not used for tax, cash flow, asset or wealth outputs. The extreme private assumption is never used as a public default.

The explicitly documented BF220 chart-helper zero/null presentation difference is exempted; no other mismatch is silently skipped. See MODEL.md for the reference sensitivity formula issue and separation from recomputed dashboard scenarios.

## Limits / unavailable checks

- Supported Sites source opening, source synchronization and deployment are blocked by a missing local Sites helper bundle. Native Sites metadata/credential/deployment tools are available, but publication must use the supported source workflow. No new hosting result exists.
- No deployment-origin authentication or post-publication browser check was possible. Existing Site metadata was re-read and remains owner-private, version 3, with no external visitors.
- Chromium automated interaction and visual checks passed. Safari, Firefox, real mobile devices and a screen-reader session were not tested. No formal WCAG audit is claimed.
- Node strips TypeScript at build time; no standalone TypeScript static type-check run was performed.
- The reference historical dataset and provisional flags were validated for internal consistency, dates, dimensions, contributions and rolling returns. Its upstream market prices were not independently re-downloaded in this build.
- Only the base tax features represented by the reference are included. Long-term fixed tax rules and returns remain scenario assumptions.
