# Stage 2 — Job (AGREED)

Follows Stage 1 (01-inquiry-quotation.md). Same ground rules: no AI; the system records and gives transparency; the Manager leads.

## Workflow
1. Inquiry CLOSED (client accepted, Manager acknowledged).
2. The Manager clicks "Convert to Job". Data carries over: customer, scope, direction, services, accepted quote version.
   The Manager assigns Ops staff. Sales stays on the job as VIEWER.
3. The system generates the PROGRESS MAP (one track per selected service) and the DOCUMENT CHECKLIST (per service).
4. Ops updates milestones with one click (tick + date, optional remark/attachment). No manager approval per milestone.
   Exception: "Duties paid" REQUIRES proof of payment.
   Ops uploads documents as they arrive (Pending → Received).
5. Problem → Ops flags an ISSUE (reason) → job shows "On Hold" until resolved.
6. All milestones done + required documents received → Ops submits for closing.
7. The Manager confirms → JOB COMPLETED → ready for the Accounting stage.

## Job structure
- 1 inquiry = 1 job (mockup). A job can hold multiple references (several BL/AWB nos., container nos.).
  Splitting into multiple jobs = Phase 2.

## Progress map = the job plan (REVISED 2026-10-02)

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

Previously each service had its own track chained in one fixed order; that was wrong for exports (trucking and customs come before the ship leaves) and for domestic trucking (pickup vs delivery). Source of truth in code: buildPlan() in apps/mockup/src/00-data.js.

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

## Free-time counter (display only, no emails)
- Applies to international imports. Two clocks:
  - PORT clock: Arrived → Gate pass/cargo out. Risk: port STORAGE + shipping-line DEMURRAGE.
  - CONTAINER clock (FCL only): Cargo out → Empty returned. Risk: DETENTION.
- Ops enters the free days for each clock (from the arrival notice / shipping line). The system shows days left.
  Color: green (>3 days), amber (1–3), red (last day / overdue, with days over).
- Each clock stops when its end milestone is ticked. The job list can sort by most urgent.

## Fund requests
Deferred to the Accounting stage (request → approve → release → liquidate is its own workflow).
For now, the "Duties paid + proof" milestone is the record.

## Client tracking page (public)
The client enters a tracking code and sees job progress (the user already built this in the first mockup; to be reviewed when source code is shared).
Recommendations (pending the user's confirmation):
- Use a NON-GUESSABLE tracking code, or Job ID + a second check. Sequential IDs let anyone view other clients' shipments.
- Show client-safe data only: tracks, milestone names + dates, current status, ETA. Hide internal remarks, costs, vendors, documents, staff names.
- Issue/On Hold appears as a neutral message, e.g. "Pending — our team is working on it".
- Job-level only. Inquiries/quotes are not trackable.

## Pain points covered
Missing/incomplete shipment details (document checklist), forgotten requirements (checklist + required proof),
delayed coordination with Ops/Accounting (Convert to Job + completed job goes to Accounting), scattered info, human errors (fixed tracks per service).


## Blueprint gap closure (2026-10-03)
Added so the mockup meets the client's blueprint (modules 5.3 to 5.6) without changing the agreed flow above.

### Due dates, overdue and reminders (5.4)
- Every step has a DUE DATE: the previous step's date plus the days allowed (Settings: "Days allowed per step", default 2; a few steps such as ocean transit have their own allowance). The first step is due that many days after the job is created.
- The owner or a Manager can change the due date ("Change" on the Milestones tab); the change is logged with an optional reason.
- A step past its date is OVERDUE: red dot on the progress map, an alert on the job, "Needs attention" health, a red "Next due" on the Jobs list (with an Overdue filter), a Needs attention row for Managers and a red row on the owner's My Work.
- AUTOMATIC EMAIL (simulated: saved and readable from the notification bell, "View email"): the owner is emailed when a step becomes overdue; a Manager is emailed after "Escalate to a Manager after N days overdue" (Settings, default 2). Corrective actions and unliquidated funds work the same way; a quote with no client answer triggers a follow-up email to Sales every N days. Each reminder is logged in the record's history ("System (automatic email)").
- Demo only: the avatar menu can jump the calendar ahead 1, 3 or 7 days (a "Demo date" badge shows) so a reviewer can watch a step go overdue.

### Exceptions (5.6)
- Replaces the old "issue". Operations raises an EXCEPTION against the current stage with CATEGORY, REASON, IMPACT and optional EVIDENCE. The job goes ON HOLD.
- Every exception needs MANAGER approval (decided 2026-10-03). The Manager approves by assigning a CORRECTIVE ACTION (what, owner, due date), which lifts the hold, or sends it back with a reason (the job stays on hold; Operations edits and resubmits).
- The corrective action is a tracked task (My Work, job page alert, overdue flags and emails). The owner marks it done with a note and optional proof, which resolves the exception. A job cannot be closed while any exception is unresolved.

### Delivery and POD (5.6)
- Marking "Delivered" (or "Delivered to warehouse" / "Released to consignee") records the TIME, who RECEIVED it, and the CONDITION: Good condition / Damaged / Incomplete (short). The signed POD is still required.
- Damaged or short raises an exception automatically (it does not freeze the job, so the empty container can still be returned) and the job page shows a Delivery panel.

### Documents (5.5)
- A Manager can ACCEPT or REJECT a received document; rejecting needs a reason (list + comment). Operations is notified and uploads a NEW VERSION; the rejected file stays in the version history ("History" on the row).
- Pending documents can be uploaded from the Documents tab by the assigned Operations staff. Rejected and missing documents are counted on the dashboard.

### Customer and inquiry data (5.1, 5.2)
- The customer profile keeps CONSIGNEES, DELIVERY ADDRESSES and standing REQUIREMENTS / delivery instructions. The inquiry form asks for the channel, cargo, optional consignee, cargo type, delivery instructions, warehousing volume and period, and the LTO vehicle, as listed in 01-inquiry-quotation.md.
- BL / AWB and container numbers are entered from the job ("Shipment references"). Sales have a read-only view of the jobs from their inquiries (never money).

### BL / AWB, container and booking numbers (2026-10-03)
Entered where the document appears, not in a separate form: the optional BOOKING NO. at "Booked with shipping line"; the BL / AWB NO. and the CONTAINER NO(S). at "Departed origin port" (import with freight), "Cargo arrived at port" (customs only), "BL released to client" (export) or "Loaded at origin port" (domestic). The BL / AWB number is required whenever the cargo has one (not for a land-only move). Container numbers are required for FCL (copy them from the BL), optional for LCL (shared container) and not asked for air, RoRo, bulk or breakbulk. "Shipment references" on the job menu remains for corrections.
