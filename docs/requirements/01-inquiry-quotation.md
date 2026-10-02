# Stage 1 — Inquiry + Quotation (AGREED)

Client: Top1Movers Worldwide Inc. (Manila-based forwarder + customs broker, est. 2021)
Services: Customs Clearance, Importer Accreditation, Freight Solutions (sea/air/land; FCL/LCL/RoRo/bulk/breakbulk), LTO Transactions, Warehousing & Distribution, Trucking.
Status: AGREED — to be combined with later stages once all requirements are final.

## Ground rules
- No AI (cost).
- No quotation builder. Top1Movers prepares quotes in their own format; the system only keeps the record and gives transparency.
- The client is not available for further questions. Design from the pain points they provided.

## Workflow
1. The client inquires through any channel (WhatsApp, Viber, email, text, call). The sales staff who received it reports it to the Manager.
2. The Manager creates or selects the Customer profile, creates the Inquiry, sets SCOPE (+ DIRECTION), selects services (multi-select, any combination), and assigns staff/stakeholders.
   - SCOPE: Domestic / International. DIRECTION (International only): Import / Export.
   - If Domestic: Customs Clearance and Importer Accreditation are disabled.
   - If International Export: Importer Accreditation is disabled.
   - LTO Transactions and Warehousing are available in any scope.
   - The system generates a PROGRESS MAP from scope + direction + selected services.
   - The request also records cargo, origin, destination, cargo type, notes and DELIVERY INSTRUCTIONS (optional; per shipment,
     not per customer — moved off the customer form 2026-10-02). They carry into the job.
   - Work starts only after staff are assigned.
3. Sales gets rates from carriers, prepares the quotation in their own format, uploads it + enters TOTAL AMOUNT + CURRENCY (required, added in Stage 5), and submits it for approval.
4. The Manager approves, or returns it with a required comment. Returns are logged in VERSION HISTORY and go back to step 3.
5. Sales sends the quote to the client through any channel and marks it as Sent, with PROOF it was sent (required; e.g. the sent email or chat screenshot).
6. Client outcome:
   - Accepted (with proof) → Manager acknowledges → Inquiry CLOSED → ready for Convert to Job.
   - Renegotiates / Rejects / Expires (reason + proof) → logged in VERSION HISTORY → back to step 3.

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

## Version history
One timeline per inquiry that combines every reason a version did not go through: Manager returned, Client renegotiated, Client rejected, Expired.
Each entry shows version no., reason, comment and proof.
REASON TYPE dropdown + free text (decided in Stage 5, used for analytics):
- Manager returned: Pricing error / Missing charge / Wrong details / Other
- Client: Price too high / Transit time / Chose competitor / Shipment cancelled / No response / Other

## Supporting pages
- Customer profile, listing all of that customer's inquiries.
- All Inquiries page with filters: client, status, service type, scope, direction, assigned staff, date range.
  Includes an Amount column (from the required amount entered on quote upload).

## Decided to leave out of this stage
- "Incomplete inquiry" status. Sales cannot get carrier rates without full details, so missing or incomplete shipment details surface in the JOB stage instead (handled there with a document/details checklist).
- A dedicated quote comparison feature. Staff compare manually using the All Inquiries page and the customer profile.
- Follow-up reminders in the mockup. Planned for implementation: an email reminder every 2 days to inquiry members while awaiting the client.
  (Suggested, not decided: show an "Awaiting client response · N days" badge in the mockup.)

## Pain points handled in this stage
Scattered client info, duplicate customers (manager-controlled), manual prospect monitoring (statuses + list page),
quotation history and transparency, approval control, handover readiness.
Phase 2 / later: quote builder (computation and format consistency), AI intake (encoding, long messages).
