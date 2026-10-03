# Demo feedback (stakeholder notes)

Raw notes from a stakeholder demo, with what we know so far. Status (2026-10-03): items 2, 3, 4 and 5 and the UI port in section 6 are built in the mockup (uncommitted); only the billing fix is still to build (waiting on the stakeholder). Docs for the built items are updated in `05-analytics-dashboards.md`, `DESIGN.md` and the style guide. More detail is coming from the stakeholder; update this file before building.

## 1. Billing tab: figures not tallied

Reported: the data in the Billing tab of a job is not tallied properly.

Investigation (2026-10-03):
- Arithmetic is correct. `apps/mockup/billing_test.py` checks on every delivered job that service fees + pass-throughs = total, the tab total = sum of lines, Difference = charges - accepted quote, no duplicate charge ids, no fund request billed twice, and each at-cost line = its fund's actual receipts. All pass, also after add/remove/add-from-funds.
- Probable causes (meaning, not math):
  1. "Difference" compares all charges (incl. at-cost pass-throughs) to the accepted quote. Sample job D: charges 403,000 vs quote 390,000.
  2. No subtotal by type (service fee vs pass-through) on the tab.
  3. At-cost lines use actual spent, so they differ from the Funds tab "Paid out" (released amount).
  4. Quotations & bills are not part of billing.
- Open question for the stakeholder: which two numbers did not match?
- Test is kept so it cannot regress.

## 2. Stats: overall revenue per month

Dashboard stats need to show overall revenue per month. Open: what counts as revenue (accepted quote, charges listed, or received by Finance)? Which months/range?

## 3. Fund source defaults to company funds

Fund requests default to **Company funds**; no client deposit involved. **Decision (2026-10-03): remove the "Where does the money come from?" question and the client deposit proof from the fund request form entirely.** Every request is stored as Company funds; the Source row is dropped from the request summary, history, PDF and money-log CSV.

## 4. Job summary export

Add a **Generate summary report** action on each job that exports one report for that job.
- Where: job page header, available to roles that can view the job.
- Format: PDF, same look as the existing downloads (`56-pdf.js`).
- Contents (proposed, to confirm): job and customer, services, current status and health, milestones with dates and who did them, documents received/missing, exceptions, fund requests with totals (requested, released, spent), charges to bill vs the accepted quote, and the Finance handover status.
- Built (2026-10-03): job page, More menu, "Generate summary report" (`downloadJobSummaryPdf` in `src/56-pdf.js`). Fund and charge sections are shown only to roles that can view money on that job. Still open: PDF only or also CSV; which sections the stakeholder wants.

## 5. Dashboard layout: Needs attention

Feedback: on the Dashboard, "Needs attention" should stand out and alarm the user that transactions or documents still have to be provided.

Direction (author's opinion, to confirm):
- Stats at the **top**.
- "Needs attention" as a **side panel** next to the stats/analytics, not the first full-width block (currently `40-home.js`, `#needs-attention`, rendered first).
- Highlighted with the design system's warning/danger treatment, with a count, so missing documents and pending transactions are noticed. Rows still open the record.
- Must use design-system tokens/components only (`docs/ai/ui-rules.md`); add anything missing to the design system first.
- Also update `05-analytics-dashboards.md`, which currently says Needs attention comes first.

## 6. UI changes from `feature/customer-inquiry-portal` to carry over

These live on the feature branch (commits `b92c5be`, `70b45bb`), not yet on `demo`. Port the UI items below (pill, elevation, hero) independently of the portal, and document them in the design system (`DESIGN.md`, style guide) as well.

- **Customer inquiry portal** (`#/inquire`, `src/80-portal.js`): **on hold, not for merge yet.** It changes the SOP (customers would submit inquiries themselves and the Manager would triage them from intake), so it must be discussed with the client first. Open points for that talk: who owns triage, what a customer may submit, how a portal inquiry becomes a real inquiry, and whether customers get any confirmation or reference. What the branch does today: public page with no sign-in; name, company, email, mobile, shipment type, direction, services, route, description and an optional file; lands in the intake queue, notifies the Manager, shows a reference number; linked from the sign-in and tracking pages.
- **Sliding group-selection pill** (`.ds-seg--slide`): the segmented control (e.g. International/Domestic, Import/Export) gets a pill that glides to the chosen option. Sizes to its content, equal-width options, set `--n` (option count, up to 4) inline. Stays visible on phones (other `.ds-seg` hide at 640px); larger touch height on mobile. Respects the existing focus ring.
- **Elevation on scroll** (`.ds-acct-picker__head`): the account-picker header lifts with a soft shadow plus a hairline once its list scrolls underneath (`data-scrolled` toggled by the list's scroll). Uses `color-mix` on the navy token, no new colors.
- **Branded public hero** (`.ds-public__hero`): dot grid, two drifting blurred glows and an outlined "T1M" mark, matching the login brand pane. Used on tracking, quotation and inquiry pages. The mark is hidden on phones; animation is off under `prefers-reduced-motion`.

Rules when porting: tokens only (no hardcoded values), add new classes to `packages/design-system/components.css` and the HTML style guide, and keep the mobile and reduced-motion rules.

## Also built during the demo-feedback pass (not in the notes above)
- Charts chosen by job: donut for "Where inquiries stand" and "Customs lanes"; column charts for the three monthly series (see `DESIGN.md` Charts).
- Every select on pointer devices now opens the design-system dropdown (`src/25-dropdown.js`).
- The six Operations KPI cards sit in an even 3 x 2 grid (`.ds-kpis--3`).

## Build checklist (when asked)

1. Billing tab: confirm the mismatch with the stakeholder, then add subtotals by type and fix the quote comparison. Keep `billing_test.py` passing.
2. Monthly revenue stat on the Dashboard.
3. Remove the fund source question and deposit proof from the fund request form (also drop Source from summary, history, PDF, CSV).
4. Job summary report (PDF) per job.
5. Dashboard layout: stats on top, highlighted Needs attention side panel. Update `05-analytics-dashboards.md`.
6. Port the pill, elevation and hero from section 6 (not the inquiry portal, which waits for the client discussion on SOP changes).
7. Rebuild with `node apps/mockup/build.mjs`, run `apps/mockup/e2e.py`, regenerate the manual.
