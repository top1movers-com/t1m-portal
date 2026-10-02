# Stage 5 — Analytics & Dashboards (AGREED)

Answers "What needs my attention?" first, then "How is the business doing?". Built only from data recorded in Stages 1–4.

## Agreed decisions
1. Access: Admin + Manager by default (including job profit). Can be unticked per role in the permission matrix.
2. Sales / Ops / Accounting get a "My Work" home page: to-do lists only, no charts/KPIs.
   - Sales: my inquiries by status, quotes returned to me, quotes awaiting client
   - Ops: my jobs, milestones due, free-time alerts, fund requests to liquidate
   - Accounting: funds to release, liquidations to verify, jobs ready to bill, overdue billings
3. Quote upload requires TOTAL AMOUNT + CURRENCY (Stage 1 updated).
4. REASON TYPE dropdown in version history (Stage 1 updated):
   - Manager returned: Pricing error / Missing charge / Wrong details / Other
   - Client: Price too high / Transit time / Chose competitor / Shipment cancelled / No response / Other
5. Layout: "Needs attention" panel on top + 4 tabs.
6. Filters on every tab (date range, service, scope/direction, customer, staff) + export to Excel and PDF.
7. Simple charts only: KPI tiles, monthly trend lines, bar charts, funnel.
8. ~~Mockup filled with sample data~~ CHANGED by the user (2026-10-02): NO seeded customers, inquiries or jobs. Only many demo USERS are seeded.
   Everything else is created while testing and lives in memory until the page is refreshed. Dashboards show empty states until then.
9. Phase 2: scheduled report emails, monthly targets, client profitability over time.

## Needs attention (clickable, goes to the record)
- Quotes waiting for approval (S1)
- Fund requests waiting for approval (S3)
- Billings waiting for approval (S3)
- Jobs on hold (S2)
- Free time red / overdue (S2)
- Billings overdue (S3)
- Cash advances not liquidated after X days (S3)
- Quotes awaiting client response > X days (S1)

## Tab 1 — Sales & Quotations
- Inquiries received (count by period)
- Conversion funnel: Inquiries → Quoted → Accepted
- Win rate = Accepted ÷ (Accepted + Rejected + Expired)
- Pipeline value = sum of latest quote amounts not yet decided
- Quote turnaround = inquiry created → first quote sent (avg days)
- Approval turnaround = submitted → approved (avg hours)
- Avg versions per won deal
- Lost reasons (bar chart by reason type)
- By service / scope / direction
- Top customers (inquiries, wins, billed value)

## Tab 2 — Operations
- Active jobs by stage (per track/milestone)
- Jobs on hold (count + reasons)
- Customs lanes: % Green / Yellow / Red
- Customs release time = Arrived → BOC released (avg days)
- Job cycle time = job created → completed (avg days)
- Free-time performance: % released within free time; total days over
- Jobs completed (by period)

## Tab 3 — Finance
- Billed (sum of approved SOAs)
- Collected (sum of payments)
- Receivables aging: 0–30 / 31–60 / 61–90 / 90+ days
- Unliquidated advances (by age)
- Withholding tax total (for matching BIR 2307)
- Job profit = service revenue − own costs (by customer, service, month)
- Quoted vs. billed (difference per job)

## Tab 4 — Team
- Workload per staff (open inquiries / jobs / fund requests)
- Sales per staff (inquiries handled, win rate, billed value)
- Ops per staff (jobs handled, avg cycle time)

## Pain points covered
Manual sales report preparation, manual prospect monitoring, difficulty following up prospects,
delayed coordination with Ops/Accounting, human errors (quoted vs. billed).
