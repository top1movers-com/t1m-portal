# Stage 3 — Accounting & Billing (AGREED)

> **Superseded in part (2026-10-03).** The SOA billing, payment recording, withholding tax and job-profit steps below (items 6 to 10 and the "After the job" workflow) were removed from the portal and their code deleted. Accounting's part is now: release approved funds, check receipts, keep vendor papers, and receive finished jobs through the billing-readiness handover described at the end of this file. The portal creates no invoices, SOA or tax records.


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
2. Fund requests are always paid from company funds; there is no funding-source choice and no client deposit (demo feedback, see 06).
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

## Funds made simple (2026-10-03, applies while `ACCOUNTING_BASIC` is on)
The portal keeps each job's money trail. Taxes, invoices and the books stay in the company's own accounting software.
1. One flow, one vocabulary: Operations asks → Manager approves (or sends back) → Accounting releases → Operations submits receipts → Accounting checks them (or sends them back) → Closed. "Liquidate / verify / reject / pass-through" are no longer shown.
2. Each request says how it is paid: **Staff gets the money** (the requester receives it, pays, and brings back receipts and any excess) or **Accounting pays the vendor** (the requester only submits the vendor's receipt). How Accounting hands the money over (cash, check or bank transfer) is chosen at release and is separate from this choice.
3. Ticking a money step (Duties paid, Port charges paid, D/O released, Fees paid) also submits the receipts for its released request: one upload, one action. A step can instead be recorded as **Paid another way** (client pays directly, vendor bills later) with a note; this is logged and the Manager is notified.
4. Release needs proof (voucher, check copy or transfer slip). A request can carry an optional supporting file (quotation, bill, assessment).
5. New **Funds** page (Accounting, Manager, Admin; Operations see their own jobs): totals, "Needs me / Open / Receipts due / Closed / All", overdue highlighted, "Waiting on" per request, click a row for who did what and when, and **Export money log** (CSV) for the accountant.
6. A job cannot be confirmed completed while released funds still have no receipts; other open requests only warn.
7. "Receipts & quotations" is now **Quotations & bills**, optionally linked to a fund request.


## Billing readiness and Finance handover (2026-10-03, blueprint 5.6)
After delivery the job's Billing tab shows a CHECKLIST: delivery confirmed with proof, all documents received, exceptions resolved, every fund request closed, and charges to bill listed.
- CHARGES TO BILL are plain lines (what, amount, type: Service fee or Pass-through at cost, optional evidence). Closed fund requests can be added at cost with one click. The tab compares the total with the accepted quote. Manager and Accounting add and remove charges until handover.
- When every item is met a Manager or Accounting marks the job READY FOR FINANCE (Accounting is notified). Accounting then marks it RECEIVED BY FINANCE with an optional reference from their own accounting system. Charges are locked from handover.
- Visible on the Jobs list (Billing column), the Billing tab count, Accounting's My Work, Managers' Needs attention and the Operations dashboard ("Billing readiness").
- Still out of scope: invoices, SOA, payments, withholding tax, receivables, profit and any ledger. Finance bills from the charges list in their own system.

### PDF downloads (2026-10-03)
Accounting can download a branded PDF (logo, status, amounts, who did what) for one fund request, one vendor quotation or bill, a job's whole bills list, and the job's billing handover (checklist and charges). Generated in the browser; a handover record, not an invoice.
