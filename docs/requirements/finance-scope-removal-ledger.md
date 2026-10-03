# Finance scope reduction: removal ledger (APPLIED behind a switch)

New scope for Finance / Accounting: **no Finance dashboard. Accounting's part of getting an inquiry to close ends at the SOA being sent (or proof that the SOA was sent to the client).**

This file records what would be removed or switched off, and where it lives, so every item can be put back. Status: all of section A and B are switched off by `FINANCE_SOA_ONLY = true` in `apps/mockup/src/00-data.js` (code kept, not deleted). Set it to `false` and rebuild to restore everything. Checkpoint commit before the change: `001756e` on `demo`.

Applied: Finance tab hidden (A1; the export code is unused since the Excel/PDF buttons were removed, A2), B1 payment recording hidden, B2 billing status ends at `SOA sent`, B3 financially closed off, B4/B5 follow from B2, B6/B7 wording changed. Section C kept as agreed.

## How to revert
1. Before removing anything, create a git checkpoint (commit or branch) of the current `demo` branch. Reverting is then `git revert <commit>` or checking out the files from the checkpoint.
2. Prefer a switch over deletion: add `const FINANCE_SOA_ONLY = true;` in `apps/mockup/src/00-data.js` and gate each item below behind it. Reverting is then setting it to `false`.
3. Rebuild with `node apps/mockup/build.mjs` after any change.

## A. Finance dashboard (remove)
| # | Item | Location | Status |
|---|------|----------|--------|
| A1 | "Finance" tab of the dashboard (`DASH_TABS.finance`, its KPIs: outstanding, billed, collected, profit) | `src/40-home.js` (`DASH_TABS`, finance tab renderer, ~line 223) | [x] |
| A2 | Finance rows in dashboard CSV export (job profit, billing label) | `src/40-home.js` (~line 289) | [x] |
| A3 | `dash.view` for Accounting | already not granted (Admin, Manager only) | n/a |

## B. Accounting steps after the SOA is sent (remove / hide)
| # | Item | Location | Status |
|---|------|----------|--------|
| B1 | Record payments (`openPayment`, `savePayment`, "Record payment" button) | `src/55-money.js` | [x] |
| B2 | Billing states after "Sent": `Partly paid`, `Paid`, `Overdue` in `billingStatus` | `src/10-rules.js` (~line 203) | [x] |
| B3 | "Financially closed" (`financiallyClosed`) and its banner and notification | `src/10-rules.js:216`, `src/55-money.js:218`, `:299` | [x] |
| B4 | "Billing overdue" to-do on My work / Needs attention | `src/40-home.js` (~line 110) | [x] |
| B5 | Outstanding / collected figures and billing pills on job list and header | `src/50-jobs.js` (~lines 113, 133) | [x] |
| B6 | Permission `bill.send` wording "Send billing, record payments" becomes "Send SOA" | `src/00-data.js:266` | [x] |
| B7 | Accounting role description: "Releases funds, verifies liquidation, bills the client and records payments" | `src/00-data.js:233` | [x] |

## C. To decide before removing (not removed in this proposal)
These are Accounting tasks but are not "after the SOA is sent". Confirm each.
| # | Item | Location | Proposed |
|---|------|----------|----------|
| C1 | Fund requests: Accounting releases funds and verifies liquidation (`fund.release`, `fund.verify`) | `src/55-money.js`, `src/00-data.js:260-262` | KEEP (the "Duties paid" gate depends on a released fund request) |
| C2 | Vendor bills (`vendor.record`) | `src/55-money.js` | confirm |
| C3 | Job profit / reimbursable summary (`reimbSummaryHtml`, `jobProfit`) | `src/55-money.js`, `src/40-home.js` | confirm |
| C4 | "Ready to bill" list and notification to Accounting when a job completes | `src/10-rules.js:206`, `src/40-home.js:60`, `src/50-jobs.js:456` | KEEP (it starts the SOA step) |

## D. What stays
- Job completion, then Accounting uploads the SOA, a Manager approves it, Accounting marks it **sent** (with the invoice number and proof). This is where Accounting's flow ends.
- Duties gate on fund requests (see C1).

## E. Docs to update after removal
`docs/requirements/03-accounting-billing.md`, `docs/requirements/workflow-by-stage.md`, `docs/testing/UAT-test-plan.md`, `docs/demo/` manual (regenerate with `python docs/demo/manual/build_manual.py`).

## F. Accounting simplified further (APPLIED behind `ACCOUNTING_BASIC = true` in `apps/mockup/src/00-data.js`)
Accounting only: takes receipts or quotations, approves fund release, reviews liquidations. No billing, SOA, payments or profit in the portal (accounting is integrated later). Set `ACCOUNTING_BASIC = false` and rebuild to bring billing back.
- All `bill.*` and `profit.*` permissions are off for every role (including Admin) and hidden from the permission matrix.
- No Billing section, SOA actions, reimbursable summary or job profit on the job page; no billing status or "Ready to bill" anywhere; job completion no longer notifies Accounting.
- Money tab renamed **Funds**; "Vendor bills" renamed **Receipts & quotations** (no totals).
- Accounting wording: "Approve release" (was Release funds), "Review liquidation" (was Verify liquidation).
- Kept: fund requests (amounts are needed for release approval), the Duties paid / Port charges gates.

## G. Funds made simple (2026-10-03)
Wording and flow cleanup on top of F; no billing was restored. See "Funds made simple" in `03-accounting-billing.md`. Stored status keys are unchanged (`For approval`, `Returned`, `Approved`, `Released`, `Liquidated`, `Verified`); only the labels people see changed (see `FR_LABEL` in `src/10-rules.js`).


## H. Billing code deleted (2026-10-03)
The `FINANCE_SOA_ONLY` and `ACCOUNTING_BASIC` switches and everything they guarded (SOA upload, approval, send, payment recording, job profit, reimbursable summary, Finance dashboard tab, `bill.*` and `profit.*` permissions) were deleted from `apps/mockup/src`, not just hidden. It remains in git history before that cleanup. Its replacement is the billing-readiness handover (`53-readiness.js`, see 03-accounting-billing.md).
