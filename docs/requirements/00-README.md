# Top1Movers Mockup — Requirements Index

Client: Top1Movers Worldwide Inc. (Manila forwarder + customs broker).
Purpose: requirements for overhauling the existing mockup, agreed stage by stage.
Ground rules: no AI; no quotation builder (quotes/SOAs are uploaded files + key fields); the system records and gives transparency; the Manager leads and approves.

| # | Stage | File | Status |
|---|---|---|---|
| 1 | Inquiry + Quotation | 01-inquiry-quotation.md | AGREED (updated by Stage 5: quote amount + reason type) |
| 2 | Job | 02-job.md | AGREED (client tracking page safeguards pending review of existing code) |
| 3 | Accounting & Billing | 03-accounting-billing.md | AGREED |
| 4 | Users, Roles & Permissions | 04-users-roles-permissions.md | AGREED |
| 5 | Analytics & Dashboards | 05-analytics-dashboards.md | AGREED |

## End-to-end lifecycle
INQUIRY → QUOTATION (versions + approval) → ACCEPTED → JOB (tracks per service, docs, free time, fund requests)
→ COMPLETED → BILLING (SOA approval) → PAID → FINANCIALLY CLOSED

## Mockup implementation
- Built in `apps/mockup/src/*.js` (overhauled 2026-10-02 against stages 1–5). Data: demo users only; all other records are session-only (lost on refresh).
- Regression suite: `node apps/mockup/build.mjs && python apps/mockup/e2e.py` (Playwright, six sections, 175 checks) drives the real UI as every role.
- Client tracking page decided: random tracking code only (T1M-XXXX-XXXX), client-safe fields, job level only.

## Open items
- "Awaiting client response · N days" badge in the mockup (Stage 1): suggested; the Stage 5 Needs-attention item covers it on the dashboard.
- Export accreditation: currently "Importer Accreditation" only (matches their website). It could become "Importer/Exporter Accreditation".

## Update 2026-10-03
The mockup was brought in line with the client's technical blueprint: exceptions with Manager approval, delivery and damage records, document review with versions, step due dates with overdue flags and simulated email escalation, billing readiness with a Finance handover, consignees and delivery addresses on the customer, and the missing inquiry fields. See 02-job.md, 03-accounting-billing.md and 05-analytics-dashboards.md (each has an update section). Decisions: quotes are emailed automatically on approval; Admin has all access; Sales see their jobs read-only; every exception needs Manager approval. The assessment is in `docs/assessment/`.
