# Top1Movers Shipment Workflow: Inquiry to Closed

As of 30 Sep 2026

## About this guide

A shipment moves from a client's first price request to a closed job in two tracks: sales (inquiry, quotation, conforme) and then a nine-stage shipment job. This guide walks one import shipment end to end, stage by stage, naming who acts, what the screen asks for and what must be true before the job can move on.

- **For:** stakeholders reviewing the Operations Portal mockup, demo presenters, and UAT testers.
- **Reflects:** the mockup on the `demo` branch as of 30 Sep 2026, including the latest quick fixes (required contact phone and email, date picker for pickup, confirm client payment with proof).
- **How to read it:** each stage section has what happens, who does it, and the gate that must be met to move on. The [Quick reference](#quick-reference) at the end collects every gate in one table.
- All data is sample data. Names, job IDs and amounts are mock.

## Roles

Five roles share the work. The Dispatcher runs the job day to day, the Manager makes the decisions and handles client money, and Finance only receives the finished job.

| Role | Does in this workflow | Cannot |
| --- | --- | --- |
| Dispatcher | Adds customers, registers inquiries, builds quotes, converts to a job, uploads and approves documents, completes tasks, moves stages up to Delivered, confirms the client has paid duties | See or record client money, approve exceptions, mark a job ready for Finance |
| Warehouse Crew | Works assigned tasks on a phone, confirms delivery with proof, returns the empty container, raises exceptions | See jobs without a task for them, move stages |
| Manager | Everything the Dispatcher does, plus: records client deposits, decides extra charges, approves exceptions, places and clears customs holds, marks ready for Finance, closes the job | Manage users and access |
| Admin | Everything a Manager does, plus users and roles | (nothing) |
| Finance | Reads billing-ready jobs, money and the Billing Summary | Change anything |

The client does not sign in. They receive the quotation, sign the conforme, pay deposits and duties, and can follow the shipment on the public tracking page.

## The lifecycle at a glance

Sales ends when the inquiry becomes a shipment job. The job then moves through nine stages in order, grouped into five phases. Customs Clearance has seven inner steps of its own.

```
SALES      Customer -> Inquiry -> Quotation -> Conforme (client signs) -> Create shipment job
                                                                              |
JOB        Pre-shipment        On the water   Port & customs                Delivery                     Finance
           1 Booked            3 Sailed       4 Arrived at Port             6 Out for Delivery           8 Billing Ready
           2 Documentation                    5 Customs Clearance           7 Delivered                  9 Closed
                                                 Lodging Pending
                                                 Lodged
                                                 Assessment Pending
                                                 Payment Pending
                                                 Payment Completed
                                                 Release Pending
                                                 Released
```

| # | Stage | Meaning | Moved on by |
| --- | --- | --- | --- |
| 1 | Booked | Booking confirmed with the shipping line | Dispatcher |
| 2 | Documentation | Collecting and checking the five shipping documents | Dispatcher |
| 3 | Sailed | The vessel has left the origin port | Dispatcher |
| 4 | Arrived at Port | The container is at the Philippine port; free storage days are running | Dispatcher |
| 5 | Customs Clearance | Lodging the entry, paying duties and getting the goods released | Dispatcher |
| 6 | Out for Delivery | Released and on a truck to the consignee | Warehouse Crew or Manager, by confirming delivery |
| 7 | Delivered | Received with proof of delivery; the empty container must go back | Manager (Mark ready for Finance) |
| 8 | Billing Ready | Money checked and handed to Finance | Manager (Close job) |
| 9 | Closed | Nothing left to do | — |

Every job page has a **Next step** panel: it shows the gate for the current stage as a checklist, puts the fix next to every unmet line, and offers exactly one primary action. Nobody has to know the rules in advance.

## Winning the work: inquiry to shipment job

A shipment job exists only after the client has signed a quotation. The Dispatcher takes the request from first contact to a job in five steps, and nothing is retyped along the way.

1. **Add the customer** (Customers, then New customer). Company name, contact phone and contact email are required; contact person, city, delivery address and delivery instructions are optional. A "Possible duplicate" warning appears if the name matches an existing customer.
2. **Register the inquiry** from the customer's page (New inquiry). The customer is fixed to the one you came from. Cargo, origin port and final destination are required. Container type, requested pickup (date picker) and delivery address can wait. From the Home page or the Inquiries list, the drawer instead shows a customer dropdown.
3. **Create the quotation** (Create quotation): total in PHP, terms (default Net 30), notes. A revision becomes v2, v3 and so on; earlier versions are kept, and each revision must say what changed.
4. **Record the client's approval (the conforme)**: who approved, date, how (signed PDF, email, in person), optional signed copy.
5. **Create the shipment job.** The drawer lists every detail carried over. The job opens at stage Booked with the five required documents set to missing and the standard task list assigned.

**Gate to become a job:** shipment details complete (cargo, route, container type, pickup date, delivery address), a quotation sent, and the conforme recorded. A request can be priced before every detail is known, but it cannot become a job until they are.

**Declining:** an inquiry can be declined at any point with a required reason (for example, "Client chose another forwarder").

## Booked to Arrived at Port

The first four stages get the paperwork right before the goods sail, then track the vessel to the Philippine port. The Dispatcher moves the job through each one from the job page's Next step panel.

1. **Booked.** The booking is confirmed with the shipping line. Gate: vessel and voyage recorded (carried over from conversion). Action: Start documentation.
2. **Documentation.** The five required documents are collected and checked: Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin, Import Permit. Each one is uploaded (Dispatcher, Warehouse Crew, Manager), then reviewed and either approved or rejected with a reason; a rejected document is replaced as a new version. Gate: all five approved, and the task "Verify shipment documents complete" done with a proof file. Action: Confirm vessel sailed.
3. **Sailed.** The vessel has left the origin port. Gate: none beyond open fixes from exceptions. Action: Confirm arrival at port.
4. **Arrived at Port.** The container is at the port and the free storage clock starts (the mockup sets the deadline 5 days out). Every job shows the countdown so port fees are never a surprise. Action: Start customs clearance.

Why documents come first: customs rejects an entry built on wrong paperwork, so documents are settled before the goods sail.

## Customs Clearance

Customs is one stage with seven inner steps, and the job cannot leave it until customs has released the goods and a truck is booked. Free storage keeps running throughout, so this is where delays cost money.

| Step | What happens | Gate to move on | Who |
| --- | --- | --- | --- |
| Lodging Pending | The customs entry (official declaration) is prepared | Task "Lodge customs entry" done, with the lodged entry or BOC acknowledgement as proof | Dispatcher |
| Lodged | Customs has the entry | None | Dispatcher |
| Assessment Pending | Customs works out the duties | None. Moving on asks who pays the duty: Top1Movers (from the client's deposit) or the client | Dispatcher |
| Payment Pending | Duties are paid | See below | Dispatcher, Manager |
| Payment Completed | Paid; customs processes the release | None | Dispatcher |
| Release Pending | The shipping line issues the delivery order | Task "Secure delivery order" done | Dispatcher |
| Released | Goods released by customs | Task "Book delivery truck" done. Action: Send out for delivery | Dispatcher |

### Payment Pending in detail

When the client is paying, the job shows "Waiting on the client" until someone confirms the money is in.

1. **Client has paid.** Clicking it opens a Confirm client payment drawer with a warning, the customer, contact and duty due. Proof of payment is required: if a Manager already recorded the client's deposit with a slip while the job was waiting, that slip is shown and reused; otherwise the user must upload a bank slip or transfer confirmation. An optional note records how it was confirmed. Only "Yes, client has paid" records it, and the audit log names the proof file.
2. **Enough client funds.** If the client's deposits do not cover the duty, the gate shows the shortfall and a Manager records the deposit (Add funds received).
3. **Pay duties and assessment.** The task needs the duty payment receipt. It cannot be marked done while client funds are short. Completing it marks the duty charges as paid.

### Lanes and holds

- **Lane** (set from the customs selectivity result): Green is a documents-only light check, Yellow is a document review, Red is a physical inspection and takes longest.
- **Customs hold** (Under inspection or On hold): placed with a note on what customs is waiting on. It freezes the customs steps until a Manager or Admin clears it.

## Out for Delivery and Delivered

A job reaches Delivered only through a confirmed delivery with proof, never by picking a status. That proof is what makes the job billable.

1. **Out for Delivery.** The goods are released and on a truck to the consignee. The free storage clock stops and the free detention clock on the shipping line's container starts (the mockup sets it 5 days out).
2. **Confirm delivery** (Warehouse Crew, Manager or Admin, usually on a phone). The drawer shows the customer's delivery instructions and asks for: who received the goods (required), the delivery date, and a proof of delivery file, such as a photo of the signed receipt (required). A switch reports damaged or incomplete goods with a description.
3. **Delivered.** Confirming moves the job here automatically and completes the "Deliver to consignee" task. The remaining field work is the "Return empty container" task, which stops the detention clock.

If damage was reported, a Manager must resolve it before the job can go to Finance.

## Billing Ready and Closed

Finance receives one clean, checked job instead of chasing people for receipts. Only a Manager or Admin can hand a job to Finance and close it.

**Billing checklist** (all six must be met before "Mark ready for Finance" works):

- [ ] All tasks done, including the empty container return
- [ ] All documents approved
- [ ] Delivery confirmed with proof, with no unresolved damage
- [ ] No open exceptions
- [ ] Extra charges decided: the client agreed to pay, or Top1Movers absorbs it with a reason
- [ ] At least one charge recorded

Each unmet line has its fix next to it on the job page (Complete task, Decide, Add charge, Resolve damage, or Open the right tab).

1. **Billing Ready.** Marking ready hands the job to Finance, who see it with its money and a printable Billing Summary. The Billing Summary is a handoff, not an invoice.
2. **Closed.** The Manager closes the job. Closing freezes the record; every stage, document, delivery proof and peso stays in the history.

## Running alongside every stage

Four things are not stages but apply at any point in the job.

### Tasks and proof

The standard task list is created with the job, each task tied to the point in the workflow where it becomes today's work:

| Task | Becomes due at | Proof needed | Done by |
| --- | --- | --- | --- |
| Verify shipment documents complete | Documentation | Yes | Dispatcher |
| Lodge customs entry | Customs: Lodging Pending | Yes (lodged entry or BOC acknowledgement) | Dispatcher |
| Pay duties and assessment | Customs: Payment Pending | Yes (duty payment receipt) | Dispatcher |
| Secure delivery order | Customs: Release Pending | No | Dispatcher |
| Book delivery truck | Customs: Released | No | Dispatcher |
| Deliver to consignee | Out for Delivery | Yes (proof of delivery) | Warehouse Crew |
| Return empty container | Delivered | No | Warehouse Crew |

A task that needs proof cannot be marked done without a file. That is what makes the record trustworthy later. Warehouse Crew can only complete their own tasks.

### Exceptions

Anyone except Finance can raise an exception when something goes wrong: a category, what happened, impact (Low, Medium, High) and optional evidence. **Raising one freezes the job**: nobody can move it on until a Manager or Admin reviews it.

- **Approve:** the Manager names the fix, who does it and by when. The job unfreezes, and the fix becomes a task with required proof that must be done before the job can leave its stage.
- **Reject:** the Manager must say why it is not a real problem. The job unfreezes.

### Client money

Each job keeps a funds ledger, a per-job notebook rather than accounting. Managers and Admins record money in and costs out; Finance can read it; Dispatchers and Warehouse Crew do not see amounts.

- **Add funds received:** amount, date, method, optional bank reference and a deposit slip.
- **Charges:** costs paid for the client are billed back at cost; service fees are Top1Movers' own. A cost that was not in the signed quotation is an extra charge and must be decided (client agreed, or absorbed with a reason) before billing.
- **Funding gap:** when an upcoming cost is not covered by the client's deposits, the job shows the shortfall, and paying duties is blocked until it is covered.

### Deadlines and the audit log

- **Free storage** runs while the container is at the port (Arrived at Port and Customs Clearance). **Free detention** runs from Out for Delivery until the empty container is returned. Only one runs at a time, and the job shows a warning when 2 days or fewer remain.
- **Audit log:** every stage change, task, document, exception, hold and money entry is logged with who did it and when. Managers can also override a job's stage directly; that is logged too.

## Quick reference

| Stage | Gate to move on | Required proof | Who moves it on |
| --- | --- | --- | --- |
| Inquiry | Details complete, quotation sent, conforme recorded | Signed copy optional | Dispatcher (Create shipment job) |
| 1 Booked | Vessel and voyage recorded | — | Dispatcher |
| 2 Documentation | All 5 documents approved; "Verify shipment documents complete" done | Task proof file | Dispatcher |
| 3 Sailed | No open fixes | — | Dispatcher |
| 4 Arrived at Port | No open fixes | — | Dispatcher |
| 5 Customs: Lodging Pending | "Lodge customs entry" done | Lodged entry or BOC acknowledgement | Dispatcher |
| 5 Customs: Lodged | — | — | Dispatcher |
| 5 Customs: Assessment Pending | Choose who pays the duty | — | Dispatcher |
| 5 Customs: Payment Pending | Client payment confirmed (if client pays); funds cover the duty; "Pay duties and assessment" done | Client proof of payment; duty payment receipt | Dispatcher; Manager records deposits |
| 5 Customs: Payment Completed | — | — | Dispatcher |
| 5 Customs: Release Pending | "Secure delivery order" done | — | Dispatcher |
| 5 Customs: Released | "Book delivery truck" done | — | Dispatcher |
| 6 Out for Delivery | Delivery confirmed | Receiver name + proof of delivery | Warehouse Crew, Manager, Admin |
| 7 Delivered | Billing checklist (6 items) met | — | Manager or Admin |
| 8 Billing Ready | Billing Summary handed to Finance | — | Manager or Admin (Close job) |
| 9 Closed | — | — | — |

At any stage: an open exception or a customs hold freezes the job until a Manager or Admin acts.
