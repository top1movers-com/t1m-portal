# Workflow by Stage

As of 2 Oct 2026

## About this document

The agreed workflow of the Top1Movers Operations Portal, stage by stage: who does what, in which order, and which rules apply. It is the summary of the requirements in docs/requirements (Stages 1 to 5) and is what the stakeholder mockup follows.

- **For:** the team reviewing the workflow before the mockup walkthrough.
- **Client:** Top1Movers Worldwide Inc., a Manila-based freight forwarder and customs broker.
- **Services covered:** Importer Accreditation, Freight Forwarding (sea, air, land; FCL, LCL, RoRo, bulk, breakbulk), Customs Clearance, Trucking / Delivery, Warehousing & Distribution, LTO Transactions.
- **How to read it:** each stage lists the steps in order, the statuses a record moves through, and the rules the system enforces. A who-does-what table is at the end.

## The lifecycle at a glance

```
diagram
```

One record carries the work from the client's first message to a paid job. Nothing is typed twice: the inquiry becomes the job, and the job carries its costs into billing.

## Ground rules

- **The Manager leads.** The Manager creates customers and inquiries, assigns staff, and approves anything involving price or money.
- **Record and transparency, not automation.** Quotations and billing statements are prepared in Top1Movers' own format and uploaded. The system keeps the versions, approvals, reasons and proof.
- **No AI in this phase.** It may come later.
- **Approvals keep a reason.** Anything returned or rejected needs a reason (picked from a list plus a short comment), and it stays in the history.
- **Every action is logged** with who did it and when.
- **Sign-in is Microsoft single sign-on.** Passwords stay with Microsoft; the portal has none.

## Roles

One person can hold several roles (for example, a founder who is Admin and Manager) and gets the best permission any of their roles has.

| Role | Main job in the workflow |
| --- | --- |
| Admin | Users, roles, permission matrix, settings. Sees dashboards. No business actions unless also a Manager. |
| Manager | Creates customers and inquiries, assigns staff, approves quotes, fund requests and billing, converts inquiries to jobs, confirms jobs completed. |
| Sales | Uploads quotations, sends them, records the client's answer. Can view all inquiries but acts only on those assigned to them. |
| Operations | Runs assigned jobs: milestones, documents, issues, free days, fund requests and liquidation. Includes customs brokers, documentation, liaison, trucking and warehouse staff. |
| Accounting | Releases funds, verifies liquidation, records vendor bills, uploads the SOA, sends it and records payments. |
| Client (no login) | Follows the shipment on a public tracking page using a private tracking code. |

## Stage 1: Inquiry and quotation

### Workflow

1. A client reaches out by email, Viber, WhatsApp, text, call or walk-in. Sales can report it to the Manager in the system (client, channel, what they need, optional supporting document).
2. The Manager creates or picks the **customer** (company name, contact person, phone, email and business address are required; the system warns about possible duplicates).
3. The Manager creates the **inquiry**: channel, scope (Domestic or International), direction (Import or Export, international only), services (any combination), the request (fields depend on the services; see below) and the **assigned Sales staff** (one or more).
4. The assigned Sales gets carrier rates, prepares the quotation in their own format and **uploads** it with the total amount, currency and validity date, then submits it for approval.
5. The Manager **approves** it, or **returns** it with a reason. A returned version stays in the history and Sales uploads the next version.
6. Sales sends the approved quotation to the client by any channel and **marks it as sent**, attaching **proof** that it was sent (required).
7. Sales records the **client's answer** with proof: Accepted, Renegotiate or Rejected (with a reason). Renegotiation or rejection leads to a new version; a quote past its validity date shows as expired.
8. When the client accepts, the Manager **acknowledges and closes** the inquiry as won. It is then ready to become a job.
9. If the deal is dead, the Manager **closes it as lost** with a reason.

### The request (fields follow the services)

| Services ticked | Fields asked |
| --- | --- |
| Freight | Cargo, From, To, Cargo type |
| Customs without freight | Cargo, Port of entry (import) or Port of exit (export), Cargo type |
| Trucking | Cargo, Cargo type, plus Pickup address and/or Delivery address (import = delivery, export = pickup, domestic = the legs ticked, trucking alone = both) |
| Warehousing | Cargo, Expected volume, Storage period |
| LTO | Vehicle, LTO transaction (New registration, Renewal, Transfer of ownership, Export clearance) |
| Accreditation only | Nothing extra (notes only) |

Combinations show the combined set without duplicates. Notes are always available; Delivery instructions only appear when Top1Movers delivers. Cargo type and notes are optional; the other shown fields are required.

### Services offered per scope

| Scope | Services shown |
| --- | --- |
| International · Import | Importer Accreditation, Freight, Customs, Trucking, Warehousing, LTO |
| International · Export | Freight, Customs, Trucking, Warehousing, LTO |
| Domestic | Freight, Trucking, Warehousing, LTO |

### Statuses

| Status | Meaning |
| --- | --- |
| Preparing quote | Staff assigned; no quotation uploaded yet |
| For approval | A version is waiting for the Manager |
| Revision needed | The last version was returned by the Manager, or the client renegotiated or rejected it |
| Approved · ready to send | Sales can send it to the client |
| Awaiting client | Sent; the system counts the days without an answer |
| Quote expired | Sent but past its validity date |
| Accepted · awaiting manager | The client accepted; the Manager has to acknowledge it |
| Won · ready for job | Closed as won |
| Converted to job | The job exists |
| Lost | Closed as lost, with a reason |

### Version history

One timeline per inquiry keeps every version: who uploaded it, the amount, validity, who approved it (marked "self-approved" when the same person uploaded and approved), and why it did not go through.

| Reason type | Choices |
| --- | --- |
| Manager returned | Pricing error, Missing charge, Wrong details, Other |
| Client renegotiated, rejected or lost | Price too high, Transit time, Chose competitor, Shipment cancelled, No response, Other |

### Supporting pages

- **Customer profile:** contact details, business address, and every inquiry (with amounts and status) and job for that client. Used to compare previous quotes.
- **All inquiries:** filter by client, status, service, scope, assigned staff and date range, with an amount column.

## Stage 2: Job

### Workflow

1. The Manager **converts** the won inquiry to a job and assigns Operations staff. Customer, scope, services, the accepted quote, cargo and delivery instructions carry over; the Sales staff stay on as viewers.
2. The system builds the **job plan** (the steps in the order the work really happens, grouped into phases), the **document checklist** per service, and a private **tracking code** for the client.
3. Operations ticks the **next milestone** (date, optional remark and file). Milestones go in order; no approval per milestone. "Lane assigned" records Green, Yellow or Red. "Duties paid" and "POD signed" need proof attached.
4. Operations uploads documents at the step they belong to (see "Documents follow the steps") and can add a document to the checklist (for example an import permit).
5. If something stops the job, Operations **flags an issue**. The job is On hold and its milestones are frozen until the issue is resolved. Managers and the Sales staff are told.
6. When every milestone and document is done and no issue is open, Operations **submits the job for closing**.
7. The Manager **confirms it completed** (or sends it back with a note). It then appears in Accounting's "Ready to bill" list.

### How the job is ordered (the job plan)

The job is one ordered list of steps, grouped into phases, built from scope, direction and services. Each step has a one-line hint on screen (hover a step).

| Scope | Order of phases |
| --- | --- |
| International · Import | Importer accreditation → Shipping to the Philippines → Customs clearance → Delivery to the consignee (or Trucking to the warehouse) → Warehousing → LTO registration |
| International · Export | LTO clearance → Warehousing → Booking → Pickup to the port (or Cargo to the port, if the client trucks it) → Export customs → Shipping out |
| Domestic | Booking → Pickup from the shipper → Sea / land freight → Delivery to the consignee → Warehousing → LTO registration |

Trucking is a **delivery** leg on imports and a **pickup** leg on exports. On domestic freight with trucking, the inquiry says which legs Top1Movers covers: pickup, delivery or both. Trucking without freight or customs is a simple trip.

| Phase | Steps |
| --- | --- |
| Importer accreditation | Requirements complete, Filed with BOC, Under evaluation, Approved |
| Shipping to the Philippines | Booked with shipping line, Departed origin port, In transit, Arrived at port, D/O released |
| Customs clearance (import) | (Cargo arrived at port, if we did not ship it), Docs received, Entry lodged, Lane assigned, Duties paid, BOC released, Port charges paid, Gate pass |
| Delivery to the consignee | Truck scheduled, Picked up at port, Delivered, POD signed, Empty container returned (FCL) |
| Booking (export) | Booked with shipping line, Empty container released (FCL) |
| Pickup to the port (export) | Truck scheduled, Empty container picked up (FCL), Cargo loaded at shipper, Delivered to port (gate-in) |
| Export customs | Docs received, Export declaration lodged, Inspection / permits (if any), Cleared for export |
| Shipping out | Loaded on vessel, Departed, BL released to client |
| Sea / land freight (domestic) | Loaded at origin port, Departed, Arrived at destination port, Released at destination port |
| Warehousing | Received at warehouse, Stored, Release requested, Dispatched |
| LTO registration | Requirements complete, Filed at LTO, Fees paid, OR/CR released, Handed to client |

Freight and customs are separate services: freight moves the cargo, customs clears it with BOC. A client may buy either or both (for example customs only when the supplier already paid the freight).

### Documents follow the steps

Each document belongs to the step where it really appears:

| Document | Step | Rule |
| --- | --- | --- |
| Commercial Invoice, Packing List (and BL/AWB when we don't ship it) | Docs received | **Needed first:** the step cannot be ticked until they are received |
| Bill of Lading / AWB | Departed origin port | Comes with the step |
| Arrival Notice | Arrived at port | Comes with the step |
| Delivery Order | D/O released | Comes with the step |
| Import Entry / Export Declaration | Entry lodged / Export declaration lodged | Comes with the step |
| Gate Pass | Gate pass | Comes with the step |
| Delivery Receipt / POD | POD signed | Comes with the step (it is the proof) |
| Booking Confirmation, Bill of Lading (export), Warehouse Receipt, Release Order, OR/CR copy, Accreditation Application | Their matching step | Comes with the step |
| SEC/DTI, BIR registration, Vehicle Release Documents, CTPL Insurance | Requirements complete | Needed first |
| Shipping Instructions | Loaded on vessel | Needed first |

"Comes with the step" documents are uploaded in that step's Mark done drawer (optional at that moment). Documents added by Operations have no step. Every document is still required before the job can close.

### Free-time counter (international imports)

Two clocks count down so storage, demurrage and detention never come as a surprise. They are display only: no emails.

| Clock | Starts | Stops | Risk |
| --- | --- | --- | --- |
| Port free time | Arrived at port | Gate pass (or D/O released, if we don't do customs) | Storage and demurrage |
| Container free time (FCL, with our delivery) | Gate pass | Empty container returned | Detention |

Free days come from the arrival notice (defaults are set in Settings). Green means more than 3 days left, amber 1 to 3, red on the last day or overdue.

### Client tracking page

- Opened only with the job's random tracking code (for example T1M-7KQ4-X9P2), never with a job, BL or container number.
- Shows one step per service in plain words, and "Pending, our team is working on it" when the job is on hold.
- Never shows money, staff, documents or internal issue details.

## Stage 3: Accounting and billing

### Fund requests (during the job)

1. Operations creates a **fund request**: purpose, amount, payee, needed-by date, always paid from company funds (no funding-source choice).
2. The Manager **approves** it or returns it with a comment.
3. Accounting **releases** the funds (cash, check or bank transfer, with reference).
4. Operations pays, then **liquidates** with the official receipts and the actual amount spent. An excess is returned; a shortfall is reimbursed.
5. Accounting **verifies** the liquidation. Verified amounts are the job's pass-through costs.

The Manager approves but does not release; Accounting releases but does not approve. A person holding both roles can do both, and both actions are logged under their name.

### Billing (after the job is completed)

1. Accounting sees the job under **Ready to bill**, with a summary of the pass-through costs and receipts on file.
2. Accounting **uploads the Statement of Account** (in their own format) with the total and due date.
3. The Manager **approves** it or returns it with a reason (kept in the billing history).
4. Accounting **sends** it and can record the official invoice number from their BIR-registered system.
5. Accounting **records payments**: date, amount, mode, reference, proof and **withholding tax** (for example 2% with a BIR Form 2307).
6. When it is paid in full and every fund request is verified, the job is **financially closed**.

Billing statuses: Ready to bill, For approval, Returned, Approved · ready to send, Sent, Partially paid, Overdue, Paid.

### Other money rules

- **Vendor bills** (shipping lines, truckers and others billing Top1Movers) are recorded on the job as its own costs. Paying them stays in the accounting tool.
- **Job profit** (Manager only): billed minus pass-through costs equals service revenue; minus vendor bills equals job profit.
- **Out of scope:** general ledger, tax filing, payroll and official invoices.

## Stage 4: Users, roles and permissions

### User management

- The Admin **adds** a person with their work email and one or more roles; they sign in with Microsoft.
- The Admin **edits roles**. There must always be at least one active Admin.
- People are **deactivated, never deleted**, so their history stays.
- If the person still has open inquiries, jobs or fund requests, the deactivation waits until a **Manager reassigns** that work.

### Record access

| Role | Inquiries | Jobs | Customers |
| --- | --- | --- | --- |
| Manager | All | All | Create and edit |
| Sales | View all, act on assigned | Assigned (view only) | View |
| Operations | Only the inquiry linked to their job (view) | Assigned only | View |
| Accounting | None | All (for funds and billing) | View |
| Admin | None | None | None |

### Permission matrix

The system ships with the default matrix agreed in Stage 4. The Admin can tick or untick any permission per role on the Users and roles page; changes apply immediately and are logged. Creating new custom roles is Phase 2.

### Notifications

In-app (the bell) in the mockup; also by email in the real build.

| Event | Who is told |
| --- | --- |
| Assigned to an inquiry or job | The assigned people |
| Quote, fund request or SOA submitted | Managers |
| Approved or returned | The person who submitted it |
| Client accepted or rejected | Managers and the assigned Sales |
| Job created | Assigned Operations and Accounting |
| Fund request approved | Accounting (to release) |
| Issue flagged | Managers and the assigned Sales |
| Job completed | Accounting ("Ready to bill") |

### Audit log and settings

- **Audit log** (Admin, Manager): every action, filterable by person, record and date.
- **Settings** (Admin, Manager): quote validity, alert thresholds, default free days, payment terms and the document checklists per service.

## Stage 5: Dashboards

Admins and Managers land on the **Dashboard**. Sales, Operations and Accounting land on **My Work**, a to-do list with no charts.

### Needs attention (always on top)

Quotes, fund requests and SOAs waiting for approval; accepted inquiries to acknowledge; won inquiries to convert; jobs for closing or on hold; free time of 1 day or less; overdue bills; cash advances not liquidated in time; quotes waiting too long for the client; inquiries reported by Sales; staff waiting for a work handover. Each row opens the record.

### Tabs

| Tab | Shows |
| --- | --- |
| Sales and quotations | Inquiries, quotes sent, win rate, pipeline value, conversion, quote and approval turnaround, versions per win, why deals are lost, why quotes were returned, by service and scope, top customers |
| Operations | Active jobs by stage, jobs on hold, customs lanes, customs release time, job cycle time, free-time performance, jobs completed per month |
| Finance | Billed, collected, outstanding, withholding tax, receivables aging, unliquidated advances, job profit and quoted vs billed (Manager only) |
| Team | Workload per person, sales per person, operations per person |

Every tab filters by date range, service, scope, customer and staff, and exports to Excel or PDF.

## Not in this phase

- AI (reading inquiries, drafting replies).
- A quotation builder (computing quotes inside the system).
- Splitting one inquiry into several jobs.
- Accounts payable, ledgers and official invoices.
- Custom roles, scheduled report emails and monthly targets.
- Automatic follow-up emails (planned: a reminder every 2 days while a quote waits for the client).

## Quick reference: who does what

| Step | Who |
| --- | --- |
| Report a new inquiry | Sales (optional) |
| Create the customer and the inquiry, assign Sales | Manager |
| Upload the quote, mark it sent, record the client's answer | Assigned Sales |
| Approve or return the quote, acknowledge, close as lost | Manager |
| Convert to job, assign Operations | Manager |
| Milestones, documents, issues, free days, submit for closing | Assigned Operations |
| Confirm the job completed | Manager |
| Fund request and liquidation | Operations |
| Approve a fund request | Manager |
| Release funds, verify liquidation | Accounting |
| Vendor bills, SOA upload, send, payments | Accounting |
| Approve the SOA | Manager |
| Users and the permission matrix | Admin |
| Settings and the audit log | Admin, Manager |
