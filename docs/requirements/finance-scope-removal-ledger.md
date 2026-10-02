# Finance scope reduction: removal ledger (PROPOSED, nothing removed yet)

New scope for Finance / Accounting: **no Finance dashboard. Accounting's part of getting an inquiry to close ends at the SOA being sent (or proof that the SOA was sent to the client).**

This file records what would be removed or switched off, and where it lives, so every item can be put back. Status: `[ ]` not done yet, `[x]` removed. Nothing below has been changed in code.

## How to revert
1. Before removing anything, create a git checkpoint (commit or branch) of the current `demo` branch. Reverting is then `git revert <commit>` or checking out the files from the checkpoint.
2. Prefer a switch over deletion: add `const FINANCE_SOA_ONLY = true;` in `apps/mockup/src/00-data.js` and gate each item below behind it. Reverting is then setting it to `false`.
3. Rebuild with `node apps/mockup/build.mjs` after any change.

## A. Finance dashboard (remove)
| # | Item | Location | Status |
|---|------|----------|--------|
| A1 | "Finance" tab of the dashboard (`DASH_TABS.finance`, its KPIs: outstanding, billed, collected, profit) | `src/40-home.js` (`DASH_TABS`, finance tab renderer, ~line 223) | [ ] |
| A2 | Finance rows in dashboard CSV export (job profit, billing label) | `src/40-home.js` (~line 289) | [ ] |
| A3 | `dash.view` for Accounting | already not granted (Admin, Manager only) | n/a |

## B. Accounting steps after the SOA is sent (remove / hide)
| # | Item | Location | Status |
|---|------|----------|--------|
| B1 | Record payments (`openPayment`, `savePayment`, "Record payment" button) | `src/55-money.js` | [ ] |
| B2 | Billing states after "Sent": `Partly paid`, `Paid`, `Overdue` in `billingStatus` | `src/10-rules.js` (~line 203) | [ ] |
| B3 | "Financially closed" (`financiallyClosed`) and its banner and notification | `src/10-rules.js:216`, `src/55-money.js:218`, `:299` | [ ] |
| B4 | "Billing overdue" to-do on My work / Needs attention | `src/40-home.js` (~line 110) | [ ] |
| B5 | Outstanding / collected figures and billing pills on job list and header | `src/50-jobs.js` (~lines 113, 133) | [ ] |
| B6 | Permission `bill.send` wording "Send billing, record payments" becomes "Send SOA" | `src/00-data.js:266` | [ ] |
| B7 | Accounting role description: "Releases funds, verifies liquidation, bills the client and records payments" | `src/00-data.js:233` | [ ] |

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
