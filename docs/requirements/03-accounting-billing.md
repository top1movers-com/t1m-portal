# Stage 3 — Accounting & Billing (AGREED)

Follows Stage 2 (02-job.md). Same ground rules: no AI; the system records and gives transparency; the Manager approves anything involving money.

## Scope
Money as it relates to a job only: fund requests, job costs, billing, collection, job profit.
NOT a full accounting system (no general ledger, tax filing, payroll, or official BIR invoices).

## Workflow
During the job:
1. Ops creates a FUND REQUEST on the job: purpose, amount, payee, needed-by date, funding source.
2. The Manager approves, or returns it with a comment.
3. Accounting releases funds (cash / check / bank transfer) + reference/proof.
4. Ops pays (e.g. duties) → ticks the milestone ("Duties paid" + proof).
5. Ops LIQUIDATES: uploads official receipts + actual amount spent.
   Excess returned / shortfall reimbursed → Accounting verifies → fund request closed.
   Every liquidated amount is recorded automatically as a JOB COST.

After the job:
6. Job COMPLETED (Manager confirmed) → appears in Accounting's "Ready to Bill" list.
7. Accounting prepares the BILLING (Statement of Account) → Manager approves, or returns with a comment (version history, same as the quote).
8. Accounting sends it to the client → status SENT → due-date countdown.
9. Client pays (full or partial) → Accounting records the payment + proof.
10. Fully paid + all fund requests liquidated → JOB FINANCIALLY CLOSED.

Full lifecycle: INQUIRY → QUOTATION → JOB → BILLING → PAID → FINANCIALLY CLOSED

## Agreed decisions
1. Fund request flow as above (Ops requests → Manager approves → Accounting releases → Ops liquidates → Accounting verifies).
2. Each fund request has a funding source: Company funds / Client deposit (a client deposit is recorded with proof before release).
3. Billing = Option A: Accounting uploads the SOA in their own format + enters total amount + due date.
   Plus a "Reimbursable costs summary" panel listing all liquidated costs on the job (with receipts).
4. Manager approval before the bill is sent, with version history (same pattern as the quote).
5. Payments: Sent → Partially Paid → Paid, plus Overdue (display only).
   Each payment records date, amount, mode, reference no., proof, and a WITHHOLDING TAX field (e.g. 2% EWT, BIR Form 2307).
6. Vendor bills are recorded as job costs only (vendor, amount, file). No accounts-payable payment tracking (Phase 2).
7. Job profit view (Manager only):
   Billed − Reimbursable (pass-through) = Service revenue; − Own costs (vendor bills) = Job profit (%).
   Feeds the dashboard/sales reports.
8. Official sales invoices/receipts are out of scope (they require BIR registration). The system handles the SOA only;
   Accounting records the official invoice no. for reference.
9. Accounting role added (releases funds, prepares billing, records payments). Roles are configurable; one person may hold several.

## Pain points covered
Delayed coordination with Ops/Accounting, human errors, manual sales report preparation, scattered information.
