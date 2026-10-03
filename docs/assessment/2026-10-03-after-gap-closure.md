# T1M Portal mockup: re-assessment after closing the blueprint gaps

Date: 3 Oct 2026 · Compares with `2026-10-03-mockup-assessment.md` (written before the work) · Blueprint: Top1Movers "Affordable Digitalization Technical Blueprint" sections 1, 4, 5, 15

## TL;DR

| Area | Before | After |
|---|---|---|
| Meets the blueprint (48 checkpoints) | 6/10 · 22 met, 15 partly, 11 missing (61%) | **9.5/10 · 48 met (100%)**, or 97% if you count the 3 simulated-email items at half |
| Easy to use (10 usability heuristics, 1 to 5 each) | 7/10 · 34/50 | **8/10 · 40/50** |
| "Are you sure?" dialogs in the same full walkthrough | 37 | **12** |
| Automatic regression checks | old `e2e.py` broken | **175 checks, 6 sections, all passing** |
| Console or page errors | none | none |
| Accessibility (axe-core WCAG 2 A/AA) | 3 serious or critical findings on 5 pages | **0 findings on 18 pages** (16 staff + 2 client pages) |
| Controls under 44 px on a phone (5 pages) | 51 of 110 | **0**, no sideways scrolling |
| Unused code | ~30 items, ~190 lines of dead billing code | **none** (static search + coverage) |

The score is measured the same way as before: by driving the real build as every role and counting what is on screen. It is my reading of the blueprint; a few bullets are vague (see "How to read the 100%").

## What was done, and why each piece exists

Every addition maps to a line of the client's own blueprint or to a rule in your agreed requirement docs.

**1. Restored the inquiry's cargo fields and added consignees, delivery addresses, requirements, channel (5.1, 5.2).**
Why: your agreed Stage 1 document lists these inputs; a past rework removed the inputs but left the code that still read them, so the job and the client tracking page showed "Cargo: Freight + Customs + Trucking". The blueprint (5.1) also lists consignee, delivery-address and customer-requirements records, none of which existed.
Why it is intuitive: the form only asks what the chosen services need (warehousing asks volume and period; LTO asks the vehicle), the customer's saved addresses and standing instructions pre-fill it, and a new delivery address is remembered automatically, so nobody types the same thing twice.

**2. Exceptions with category, impact, evidence, Manager approval and a corrective action (5.6).**
Why: blueprint 5.6 and the MVP acceptance criteria ("category, reason and impact are captured; approval is recorded; corrective task is created"). The old "issue" only took a sentence.
Why it is intuitive: raising one puts the job visibly on hold; the Manager sees it in Needs attention; approving means writing the fix, who does it and by when, which becomes a task with an owner and a date instead of a note nobody follows up.

**3. Delivery record with damage or shortage (5.6).**
Why: the blueprint asks for "delivery confirmation, POD, damage or incomplete delivery". Before, "Delivered" only needed a file.
Why it is intuitive: it is part of the step Operations already tick, not a separate form; choosing Damaged opens the fields and raises the exception automatically without freezing the job.

**4. Document review, rejection with a reason, and versions (5.5).**
Why: blueprint 5.5 lists review, rejection, replacement and version tracking. Replace used to overwrite the old file. Also fixed a real gap: pending documents had no Upload button on the Documents tab.
Why it is intuitive: the buttons follow the document's state (pending shows Upload, received shows Accept and Reject, rejected shows Upload new version, accepted shows Replace).

**5. Due dates, overdue flags and automatic email reminders and escalation (5.4).**
Why: the blueprint asks for due dates, overdue flags and "escalate overdue tasks through simple email". There were no due dates at all.
Why it is intuitive: the date is computed for you (previous step plus days allowed) and can be changed in one click; overdue shows in the same places people already look (progress map, job page, jobs list, My Work, Needs attention); the email is shown from the notification bell. A "Demo date" control lets a reviewer jump ahead and watch a step go overdue.

**6. Billing readiness and Finance handover (5.6).**
Why: the blueprint asks for a billing-readiness checklist after delivery and a visible Finance handover status. It deliberately defers "deep accounting", which matches your rule: no invoices, tax or ledger.
Why it is intuitive: five yes/no checks that fix themselves (each has a button to the screen that fixes it), a plain list of charges, then two clear states: Ready for Finance, Received by Finance.

**7. Dashboard panels (4).** Overdue tasks, Missing documents, Open exceptions by category, Billing readiness, plus Export to Excel.

**8. Bugs fixed.** Admin all access (your decision) shown honestly in the matrix; Sales read-only job view; BL and container entry; clickable notifications; reasons must be chosen, never defaulted; errors clear as you fix a field; duplicate id; the stray dot in the inquiry list; "Reject" renamed "Send back".

**9. Ease-of-use work.** 25 fewer confirmation dialogs (the routine ones are gone; what remains guards decisions and money: approvals, releasing funds, completing a job, closing as lost, raising an exception, removing saved data, deactivating a person); list rows open with the keyboard; phone controls all 44 px; every field has an accessible name; a "Load sample data" button for demos.

**10. Cleanup.** Deleted the switched-off billing code and both switches, a dozen unused helpers, the dead manual "Mark as sent" path; net code is still only +336 lines for all of the above.

## Requirements check: 48 checkpoints

✅ met. Evidence is in `2026-10-03-after-shots/` (file names in brackets) and in the automatic checks.

| Module | Checkpoints | Result | Evidence |
|---|---|---|---|
| User & Role | users, departments, roles, deactivate · permissions enforced · access audited | ✅ ✅ ✅ | permission matrix with Admin full access [20]; sign-ins, role and customer changes in the audit log |
| Customer | customer + contact · consignee · delivery addresses · duplicate search · history · requirements and instructions | ✅ ×6 | [15], [16] |
| Inquiry & Quotation | register and assign · validate required info · quote versions · conforme · convert without re-keying | ✅ ×5 | [16], [17] |
| Shipment Job | unique ID · commodity, routing, container, consignee, ownership · checklist applied · Shipment 360 · no invalid progression | ✅ ×5 | [04], [08] |
| Milestones & Tasks | templates · owners and due dates · pending, due, overdue · evidence · email escalation | ✅ ×5 | [03], [04], [18], [19] |
| Documents | checklist · stored under the Job ID · upload, review, reject, replace · versions and status · missing on the job and dashboard | ✅ ×5 | [10], [02] |
| Exceptions | category, reason, impact, evidence · approval and corrective action | ✅ ×2 | [05], [06], [07] |
| Delivery & POD | delivery date, time and evidence · damage or incomplete | ✅ ×2 | [08] |
| Charges & Billing Readiness | expenses and charges · checklist after delivery · Finance handover visible | ✅ ×3 | [09], [11] |
| Dashboard | shipment status · overdue · missing documents · exceptions · workload · billing readiness · filters | ✅ ×7 | [01], [02] |
| Audit, workflow, platform | audit trail · permitted transitions · role-based web portal · reminders · phone browser | ✅ ×5 | [20], [21], [22] |

### How to read the 100%
- **Email is simulated.** The mockup saves each reminder and escalation and shows it as an email from the notification bell; it sends nothing. Three checkpoints rely on that (task escalation, quote follow-up reminders, reminders). If the client insists on real mail inside a mockup, the honest score is 97%.
- **My checklist is my reading of the blueprint.** A few bullets are vague ("ownership", "basic requirements"). I interpreted them as: ownership = the customer plus who created the job and the Operations staff per service; basic requirements = standing delivery requirements on the customer. Confirm these with the client.
- **Step due dates are my defaults** (2 days per step; a few longer ones such as ocean transit). Typical durations should come from the client.
- It measures the mockup only: no real storage, accounts or mail.

## Ease of use

| Heuristic | Before | After | Why |
|---|---|---|---|
| Visibility of system status | 4 | 5 | overdue and on-hold are visible everywhere; notifications open their record; emails shown |
| Match with the real world | 4 | 4 | steps follow real PH import, export and domestic work; some jargon (D/O, arrastre) remains but has hover hints |
| User control and freedom | 3 | 3 | send-back and change-due-date exist; still no undo and no way to cancel a fund request |
| Consistency | 3 | 4 | one vocabulary for money and decisions; statuses are always icon, colour and word |
| Error prevention | 4 | 5 | required reasons with no silent defaults; gates; duplicate warnings |
| Recognition rather than recall | 4 | 4 | next-step panel, My Work, "Waiting on" |
| Flexibility and efficiency | 2 | 4 | 37 to 12 confirmations; keyboard row access; "Needs me" filter; export; sample data |
| Minimalist design | 3 | 3 | the job page is still long and shows the steps in three places |
| Error recovery | 3 | 4 | errors clear as you fix them; every send-back carries a reason |
| Help and documentation | 4 | 4 | hints and plain-language sentences on screens |
| **Total** | **34/50** | **40/50** | |

These scores are my judgement from driving the screens, not user testing. The same full walkthrough now does more (cargo, exception, delivery record) yet needs 216 actions against 229 before, with confirmations down from 37 to 12.

## Room for improvement (to discuss)
1. **The job page is still long.** The progress map, the next-step checklist and the Milestones table all show the same steps. Collapse the table by default.
2. **Document rows are busy** (View, Accept, Reject, Upload, History). A single action menu per row would be calmer.
3. **No undo, and fund requests cannot be cancelled.** A "Cancel request" for the requester would close the biggest gap in user control.
4. **Two money lists** (fund requests and "Quotations & bills"); linked now, but still two places.
5. **Confirm the due-date defaults** and the exception categories with the client; they are plausible, not agreed.
6. **The user manual in `docs/demo/` is out of date.** Its screenshot script uses old labels and a helper that sets a confirm flag. Regenerating it needs the script updated first.
7. **Sample data is opt-in** (menu or dashboard button). Keep the session empty by default as agreed, or load it for the demo.

## How this was verified
- Full real-UI walkthrough as all roles (customer to closed job, second lost inquiry, users, settings, audit, search, tracking page, phone width): 0 errors, 0 broken text.
- `apps/mockup/e2e.py` (new, in the repo): 175 checks in six sections, passing on repeated runs.
- axe-core WCAG 2 A/AA on 18 pages: 0 violations (the one login-page contrast flag appears only during its fade-in animation and passes once settled).
- Phone width (390 px): 0 controls under 44 px, no horizontal scrolling, on the pages tested.
- Code: static search for unreferenced code found none; coverage across the suite leaves only 3 functions unexercised, all reachable from on-screen buttons.
