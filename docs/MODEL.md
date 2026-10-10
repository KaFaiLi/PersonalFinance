# Model specification and reference map

## Frozen reference

Read-only reference captured on **2026-10-10 UTC** via authenticated Google Sheets CellData reads, including formulas and effective values. Exact current tab names and dimensions were verified through metadata before reads. Private exports and their SHA-256 manifest reside outside the source repository and deployment assets. The direct XLSX download was blocked by the execution network's HTTP CONNECT 403; bounded connector exports were used successfully instead.

The snapshot is a bounded model/dependency snapshot, not a complete archival XLSX of every unused or legacy row. It contains the homepage, input regions, normalized model parameters, all 600 ledger rows, all 50 annual tax rows, all monthly overrides, annual claim selections, tax constants and the historical reference. The original Sheet was not modified.

| Current tab | Inspected / frozen ranges | Role |
| --- | --- | --- |
| 開始／租買比較 | A1:L150 | Existing presentation and model status |
| 01 個人收支與退休 | A1:H110 | Income, living expenses, retirement inputs |
| 02 資產與投資 | A1:J118; D118:D717 | Assets, targets, effective return, timing and overrides |
| 03 住屋與按揭 | A1:H135; claim choices C81:C130 included | Rent, purchase budgets, shares, mortgage and deductions |
| 計算明細 | A1:BX221; A220:BX819 | Normalized dependencies, annual taxes A145:AC194, complete ledger |
| 稅務計算與參考 | A1:M100 | Dated constants and statutory reference links |
| 歷史參考 | A1:M600 | Public market series and historical formulas |

## Input units and dependencies

All monetary amounts are nominal HKD; full-house and personal scopes are explicit in the UI. Rates are stored as fractions (`0.03` means 3%). UI percentage fields convert once at the boundary. `null` overrides mean blank; zero is a real zero return or gift. Arrays contain exactly 600 monthly returns and 50 annual claim choices.

| Input group | Reference input cells | Engine dependencies |
| --- | --- | --- |
| Horizon / income | Personal C8, C11:C15 | Annual income = salary × paid months + bonus + other income; normalized C25–26, C41 |
| Pension / payroll / tax allowances | Personal C19:C29 | Actual pension cash separate from eligible deduction; C42–43, C45–46, C85–88 |
| Personal nonhousing living | Personal C32:C41 | Eight monthly categories + annual irregular expenses / 12; C27, C44 |
| Retirement | Personal C51:C54 | Work years, replacement income, taxable proportion, living-cost factor; C96–99 |
| Assets / investment policy | Investments C8:C9, C13:C20, C23 | Initial investments and cash; target, annual target growth, retired target, surplus share, effective return, timing, independent DCA horizon |
| Monthly returns | Investments D118:D717 | Optional monthly effective return replaces converted annual rate for that month |
| Rental housing | Housing C8:C11 | UI edits the effective personal comparison rent directly, normalized C40; current-rent/override helper is collapsed into this single value |
| Purchase funding | Housing C15:C22, C26:C27 | Full-house price, budgets, cash costs, renovation, reserve, financed insurance, optional buy-only gift, budget-derived/known mortgage |
| Shares | Housing C35:C37 | Ownership/debt, payment and holding-cost shares remain separate; purchase share derives from cash budgets |
| Holding / exit | Housing C41:C50 | Monthly management, annual other holding costs, growth, property growth, selling costs |
| Housing deductions | Housing C60:C66, C81:C130 | Remove duplicated deductions; eligibility switches; 20 claim-year cap; named tenants, payment share, lease fraction |

`parameters()` converts semantic inputs to the frozen model's normalized C25:C104 interface. `project()` preserves reference A:BX monthly and A:AC annual column ordering, using one-based indexes to support independent cell parity. `simulate()` validates inputs and finite output; `dca()` is the independent full-target calculator. The public UI never loads a private fixture or the Sheet.

## Financial semantics

1. Compute the full-house mortgage schedule before annual taxes, because interest deductions depend on annual interest. Interest is nominal mortgage APR / 12; investment returns convert geometrically. Mortgage arithmetic is unrounded; the final scheduled payment clears the remaining principal and interest.
2. Compute annual taxes using income net of eligible pension and other deductions. Compare progressive versus two-tier standard tax after the appropriate housing deduction; distribute annual tax into 12 monthly reserves. Working income, pension, payroll, living costs and rent increase at model-year boundaries. Property values compound monthly.
3. Monthly spendable flow deducts pension, payroll, tax, living and housing. Contribution = min(target, positive flow) + surplus share × max(0, flow − target). Never sell assets to meet a target.
4. Apply investment growth according to beginning/end contribution timing. Deficits draw cash first, then investments. Unpaid residuals persist; once cumulative unpaid amounts exceed the reference's 0.005 HKD threshold, no viable wealth value is displayed.
5. Renting retains starting investments. Buying liquidates them and uses original cash plus a separate buy-only gift to cover personal acquisition costs. Financed insurance increases debt but does not pay for the property price. A required/assumed gift is distinct from confirmed support. The UI withholds buying wealth while a positive assumed gift is unconfirmed, even where reference arithmetic alone balances.
6. Personal property value and debt use ownership share; actual mortgage cash uses payment share; holding cash uses expense share. Partner acquisition budgets never become personal income/assets. Principal builds equity; interest and costs reduce wealth. The engine retains ownership/payment transfer audit columns.
7. Retirement begins after the specified whole working years. Pension and other payroll stop; retirement income and targets replace employment values. Pension-account assets and employer contributions are intentionally excluded because the reference does not supply them.

## Reference compatibility versus corrected sensitivity

The reference's auxiliary sensitivity gap formulas (BH/BK/BN/BQ/BT/BW) add the month-end contribution term when testing a shortfall. That can create a spurious sensitivity gap in some scenarios. The **parity kernel preserves those columns only for reference audit**. Dashboard sensitivity calls `simulate()` afresh for each annual return, with overrides disabled, so it uses the correct base cash-flow deficit mechanics. Export headers prefix auxiliary fields with `reference`; these are not the dashboard sensitivity series. No live Sheet formula was changed.

The first reference chart-helper cell BF220 can contain zero for an unavailable result; the browser uses a missing value to avoid drawing a fictional zero-wealth point. The parity harness explicitly tolerates only that documented presentation difference.

## Tax scope

Frozen 2026/27 basic allowance 145,000 HKD; progressive bands of 50,000 at 2%, 6%, 10%, 14%, then 17%; standard tax 15% on the first 5 million of net income before allowances and 16% above. Eligible pension deduction is the minimum of eligible amount, actual paid amount and 18,000; the initial eligible amount grows subject to that cap while working, matching the reference.

Base home-loan-interest cap is 100,000 per dwelling, allocated by ownership, with at most 20 selected eligible claim years. The conservative eligible interest fraction uses the lesser of ownership/payment shares and excludes financed insurance. Base rental deduction cap is 100,000 divided by named tenants and adjusted for eligible lease fraction; housing amounts already included in other deductions are removed first. Child-related additional housing deductions, combined-spouse assessment and special circumstances are not implemented. The reference applies zero one-off relief; the 2025/26 relief is not silently reused for 2026/27. Future years hold these rules constant as a scenario assumption.

Primary reference links (also retained in the original model):

- https://www.ird.gov.hk/eng/faq/budget2026_27.htm — 2026/27 allowance changes; re-read during implementation.
- https://www.ird.gov.hk/eng/pdf/2026/example2627.pdf — model's rate reference (web retrieval unavailable in this run).
- https://www.ird.gov.hk/eng/faq/mpf.htm — pension deduction qualification.

## Historical series

Only allowlisted public market columns from the reference were copied: month, SPY Close, RVD all-class private domestic price index, SPY Adjusted Close, actual SPY closing date and RVD provisional flag. There are no financial input cells, user identifiers, spreadsheet IDs or formulas in the market JSON.

- August 2006 through August 2026 inclusive: 241 levels, 240 monthly intervals.
- Four fixed August-to-August 60-month blocks; contribution is each block's change in rebased index divided by the full-period change. Contributions can be negative or exceed 100%; period returns compound rather than add.
- 181 overlapping rolling 60-month windows; displayed values are cumulative five-year returns.
- SPY is in USD and RVD is a Hong Kong price index (1999=100), not Hang Seng. No USD/HKD conversion. RVD describes monthly transactions; SPY uses the last trading close. June–August 2026 RVD flags are provisional (`P`).
- Main comparison is price-only, excluding dividends, rent, leverage, maintenance and transaction costs. SPY dividend-adjusted ratios are shown separately; they are not a like-for-like total return comparison to housing without rents, and are not official State Street NAV returns net of personal taxes.

Sources: [RVD CSV](https://www.rvd.gov.hk/datagovhk/1.4M.csv), [RVD XLS](https://www.rvd.gov.hk/doc/en/statistics/his_data_4.xls), [RVD notes](https://www.rvd.gov.hk/doc/en/statistics/full.pdf), [SPY prices](https://finance.yahoo.com/quote/SPY/history/), [State Street SPY](https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy). Dates/flags follow the frozen reference's 2026-10-10 source check; no automatic refresh is performed.
