# End-to-End Test Guide: Inquiry to Paid

Follows the agreed requirements in `docs/requirements/` (Stages 1–5), including the changes made during testing on 2 Oct 2026. Use it to check the mockup step by step: who to sign in as, what to do, and what you should see.

## Before you start

- Open `apps/mockup/index.html` in a browser (double-click is fine).
- **Sign in:** click **Sign in with Microsoft**, then pick a person in "Pick an account".
- **Switch person:** avatar menu (top right), then **Switch person (demo)**, or **Sign out** and pick again.
- **Session data only.** Nothing exists at first except people. **Don't refresh until you finish**, or everything you created is lost.
- **Uploads:** every upload box has **Use a sample file (demo)**.
- **Notifications:** the bell (top right) shows what each person was told.

## Cast

| Person | Roles | Used for |
|---|---|---|
| Grace Tan | Manager + Accounting | Customers, inquiries, approvals |
| Lorna Bautista | Manager | Second approver |
| Mark Villar | Admin + Manager | Dashboard |
| Jun Robles | Admin | Users, permissions, settings |
| Ana Cruz, Cathy Lim | Sales | Reports, quotes |
| Ben Santos, Rico Domingo | Operations | Jobs, fund requests |
| Paolo Reyes | Accounting | Release, verify, billing, payments |

---

## Part 0: Sign-in

1. On the sign-in page, click **Sign in with Microsoft**.

**Expect:**
- A "Pick an account" box listing the demo people grouped by role.
- No email or password fields.
- "Use another account" says only demo accounts exist.

---

## Stage 1: Inquiry and quotation

### 1.1 Sales reports an inquiry (optional)
**Sign in as:** Ana Cruz (Sales)
1. **My work**, then **Report an inquiry to the manager**.
2. Fill in Client (e.g. "Test Freight Co"), Channel and "What do they need?", and optionally attach a **Supporting document**. Then **Send to managers**.

**Expect:**
- **My work** shows **My reports** with "Test Freight Co · Sent · waiting for manager".
- **View** opens it with a waiting banner and only a **Close** button.

### 1.2 Manager creates the customer
**Sign in as:** Grace Tan (Manager)
1. **Customers**, then **New customer**.
2. Fill in Company name, Contact person, Phone, Email and **Business address**. There's no City field and no Delivery instructions field.
3. Try saving without the business address.

**Expect:**
- Saving without the business address shows "Enter the client's business address."
- A name, phone or email similar to an existing customer shows **Possible duplicate**.

### 1.3 Manager sees the report
**Still Grace.**
1. Open **Dashboard**. Under **Needs attention**, find "New inquiry reported: Test Freight Co".
2. Click the row, or **View**.

**Expect:**
- A drawer with Client, Channel, Reported by and on, "What they need", and the **Supporting document** with a View button.
- Buttons: **Dismiss** and **Create inquiry**.

### 1.4 Manager creates the inquiry
1. **Create inquiry** from the report, or the **New inquiry** button anywhere.
2. **Customer:** pick it. If a report is waiting, **From a reported inquiry** is picked automatically when the customer name matches, even with a small typo.
3. **Channel, Scope, Direction.**
4. **Services:** only the ones that apply are listed.

| Scope | Services listed |
|---|---|
| International · Import | All 6 |
| International · Export | No Importer Accreditation |
| Domestic | No Customs Clearance, no Importer Accreditation; Direction is hidden |

5. **The request:** the fields change with the services ticked.

| Services ticked | Fields shown |
|---|---|
| Accreditation only | Notes only |
| Customs only | Cargo, **Port of entry** (import) / **Port of exit** (export), Cargo type |
| LTO only | **Vehicle**, **LTO transaction** |
| Warehousing only | Cargo, **Expected volume**, **Storage period** |
| Freight | Cargo, From, To, Cargo type |
| + Trucking on import | adds **Delivery address** and Delivery instructions |
| + Trucking on export | adds **Pickup address** |
| Domestic Freight + Trucking | **Trucking covers** (Pickup / Delivery), plus the matching addresses |

6. **How the job will run:** the preview updates as you tick services. Hover a step to see what it means.
7. **Assign staff:** a dropdown where you pick one or more Sales people, e.g. Ana Cruz and Cathy Lim.
8. **Create inquiry.**

**Expect:**
- The inquiry opens at **Preparing quote**.
- The report leaves Needs attention.
- Ana's **My reports** shows "Inquiry created → INQ-…", and she gets a notification.
- The supporting document is attached under **The request**.

### 1.5 Sales uploads v1, manager returns it
1. **Ana:** **Upload quotation v1**: file, amount, currency, valid until. Then **Submit for approval**.
2. **Grace:** **Review quotation v1**. Pick a reason (e.g. Missing charge), add a comment, then **Return to sales**.

**Expect:**
- Status **Revision needed**.
- **Version history** shows v1 Returned with the reason.

### 1.6 v2: approve, send with proof
1. **Ana:** upload v2.
2. **Grace:** **Approve**.
3. **Ana:** **Mark as sent**: channel, date and **Proof it was sent** (required). Try saving without the proof first.

**Expect:**
- Without proof: "Attach proof that the quotation was sent."
- With proof: status **Awaiting client**, with the "Awaiting client response · N days" badge.
- The version history shows the proof file next to "sent".

### 1.7 Client renegotiates, then accepts
1. **Ana:** **Record client response**, then **Renegotiate**: reason, comment and proof. Then upload v3.
2. **Grace:** approve v3. If the same person uploads and approves, it's labelled **Self-approved**.
3. **Ana:** mark v3 as sent (with proof), then **Record client response**, **Accepted**, with proof.

**Expect:** status **Accepted · awaiting manager**. Managers and Ana are notified.

### 1.8 Manager closes it
1. **Grace:** **Acknowledge & close**.

**Expect:**
- **Won · ready for job**.
- All six items on the round checklist are ticked.

### 1.9 Lost path (on a second inquiry)
1. Run a quote round on another inquiry and record **Rejected** with a reason.
2. As Grace, use **Close as lost**. The reason is pre-filled from the client's answer.

**Expect:** status **Lost**. It appears in "Why we lose deals" on the dashboard.

---

## Stage 2: Job

### 2.1 Convert to job
**Sign in as:** Grace Tan
1. **Convert to job**.
2. **Assign Operations:** a dropdown where you pick one or more, e.g. Ben Santos and Rico Domingo.
3. Cargo type (only asked when freight, customs or trucking is involved), optional BL and container numbers, and free days for imports. Then **Create job**.

**Expect:**
- The job page shows:
  - the **Progress map** as numbered phases;
  - the **Next step** panel;
  - **Free time** (imports);
  - **Key facts**, with the **Tracking code**.
- Operations and Accounting are notified.

### 2.2 Check the job plan order
Compare the progress map with the order for the job's scope:

| Scope | Expected phases, in order |
|---|---|
| Import | Importer accreditation → Shipping to the Philippines → Customs clearance → Delivery to the consignee (or Trucking to the warehouse) → Warehousing → LTO registration |
| Export | LTO clearance → Warehousing → Booking → Pickup to the port (or Cargo to the port) → Export customs → Shipping out |
| Domestic | Booking → Pickup from the shipper → Sea / land freight → Delivery to the consignee → Warehousing → LTO registration |

- Only the phases for the services picked appear.
- **Customs without freight** starts with **"Cargo arrived at port"**.
- **FCL** adds the empty-container steps.

### 2.3 Operations works the steps
**Sign in as:** Ben Santos
1. Use **Mark "…" done** on the Next step panel, one step at a time.
   - **Expect:** each step shows a one-line explanation, e.g. "D/O released: local charges paid; the shipping line issued the Delivery Order…".
2. Try ticking a later step from the Milestones tab.
   - **Expect:** steps go in order only.
3. **Lane assigned:** pick Green, Yellow or Red.
   - **Expect:** the lane shows on the map.
4. **Duties paid:** try without a file.
   - **Expect:** it won't save without proof.
5. **Arrived at port:**
   - **Expect:** the port free-time clock starts.

### 2.4 Documents follow the steps
1. At **"Booked with shipping line"**, look at the Next step panel.
   - **Expect:** no BL, Arrival Notice or D/O listed yet.
2. At **"Departed origin port"**, **"Arrived at port"** and **"D/O released"**, open Mark done.
   - **Expect:** the drawer asks for the **BL/AWB**, **Arrival Notice** or **Delivery Order** respectively. These are optional at that moment.
3. At **"Docs received"**:
   - **Expect:**
     - Commercial Invoice and Packing List show as **"Needed first"**;
     - the main button is **"Upload Commercial Invoice"**;
     - the step's Mark done stays hidden until both are uploaded.
4. At **"Entry lodged"** and **"Gate pass"**:
   - **Expect:** they ask for the Import Entry and the Gate Pass.
5. At **"POD signed"**:
   - **Expect:** the POD upload is the step's required proof.
6. **Documents tab:**
   - **Expect:** each document says "Needed before '…'" or "Comes with '…'", in step order.
   - **Add a document** (e.g. FDA Import Permit) shows "Needed before closing".

### 2.5 Issue / on hold
1. **More**, then **Flag an issue** (e.g. "Red lane, missing FDA permit").

**Expect:**
- Health shows **On hold**, and the Next step panel turns red.
- Milestones are frozen.
- Managers and Sales are notified.

Then **Resolve issue** with a note. The job moves again.

### 2.6 Free time
1. **Set free days.**

**Expect:**
- The **port clock** runs from Arrived to Gate pass (or to D/O released, if we don't handle customs).
- The **container clock** (FCL, only when we deliver) runs from Gate pass to Empty container returned.
- Colors are green, then amber at 3 days or fewer, then red.

### 2.7 Closing
1. **Ben:** once every step and document is done and no issue is open, **Submit for closing**.
2. **Grace:** **Confirm completed**, or **Send back to Ops** with a note.

**Expect:** job **Completed**. Accounting sees **Ready to bill**.

### 2.8 Client tracking page
1. Copy the **Tracking code** from Key facts.
2. Sign out, click **Track a shipment**, and enter the code. Then try the job number.

**Expect:**
- The code shows the job's phases in plain words, with no money, staff or documents. An issue shows only as "Pending".
- The job number is not found.

### 2.9 Check other scenarios (repeat 1.4 → 2.1 with these)

| Scenario | Scope · services | Expected plan |
|---|---|---|
| Customs only (supplier shipped it) | Import · Customs + Trucking | Customs clearance (starts "Cargo arrived at port") → Delivery to the consignee |
| Car import | Import · Accreditation + Freight + Customs + Trucking + LTO, RoRo | Accreditation → Shipping → Customs → Delivery (no empty-container step) → LTO registration |
| Export | Export · Freight + Customs + Trucking, FCL | Booking → Pickup to the port → Export customs → Shipping out |
| Export, client trucks it | Export · Freight + Customs | Booking → Cargo to the port → Export customs → Shipping out |
| Domestic, delivery only | Domestic · Freight + Trucking, untick Pickup | Booking → Sea / land freight → Delivery to the consignee |
| Warehousing after import | Import · Customs + Trucking + Warehousing | Customs → Trucking to the warehouse → Warehousing |
| LTO only | Domestic · LTO | LTO registration only. The request asks for Vehicle and LTO transaction; there's no route. |

---

## Stage 3: Accounting and billing
(Fund requests can be raised any time while the job is active.)

### 3.1 Fund request
**Sign in as:** Ben Santos
1. **Money** tab (or **More**), then **New fund request**: purpose, amount, pay to, needed by.
2. For **Funding source**, pick **Client deposit**.
   - **Expect:** the **Client deposit proof** field appears, and only then.

**Expect:** status **For approval**, and managers are notified.

### 3.2 Approve, then release
1. **Lorna (Manager):** **Approve**, or **Return** with a comment so Ben can **Edit & resubmit**.
2. **Paolo (Accounting):** **My work**, then **Release**.

**Expect:**
- A Manager can't release, and Accounting can't approve.
- Grace (both roles) sees a note that she also approved it.

### 3.3 Liquidate, then verify
1. **Ben:** **Liquidate**: actual amount and receipts.
2. **Paolo:** **Verify**.

**Expect:**
- The excess or shortfall is shown.
- Verified amounts appear in the **Reimbursable costs summary**.

### 3.4 Vendor bill
1. **Paolo:** **Record vendor bill**.

**Expect:** counted as the job's own costs.

### 3.5 Billing (after the job is Completed)
1. **Paolo:** **Upload SOA**: file, total, due date.
2. **Grace or Mark:** **Review SOA**, then Approve, or Return with a reason.
3. **Paolo:** **Mark as sent** (optional official invoice no.).
4. **Paolo:** **Record payment**, partial and with **withholding tax**. Then record the balance.

**Expect:**
- Billing status goes: Ready to bill → For approval → Approved · ready to send → Sent → Partially paid → **Paid**.
- With all fund requests verified, the job shows **Financially closed**.
- **Job profit** is visible to Managers only.

---

## Stage 4: Users, roles and permissions

**Sign in as:** Jun Robles (Admin)

1. **Add user**: name and one or more roles.
   - **Expect:** sign out, then sign in as them through Microsoft. There's no password.
2. **Roles:** change someone's roles.
   - **Expect:** the last active Admin keeps the Admin role.
3. **Switch off** someone with no open work.
   - **Expect:** they become Inactive and can't sign in. Their history stays.
4. **Switch off** someone **with** open work.
   - **Expect:** **Pending handover**. A Manager gets **Reassign** on the dashboard. After the reassignment the account switches off.
5. **Permission matrix:** untick something, e.g. Admin › View dashboards.
   - **Expect:** it takes effect immediately.
6. **Record access:**

| Sign in as | Expect |
|---|---|
| Sales | Can view all inquiries but only act on their own; sees their inquiries' jobs (view only) |
| Operations | Sees only assigned jobs |
| Accounting | Sees all jobs, no dashboard |

7. **Settings:** change the defaults, and add or remove checklist documents (applies to new jobs).
8. **Audit log:** everything is logged, filterable by person, search and date.

---

## Stage 5: Dashboards

**Sign in as:** Mark Villar (Admin + Manager)

1. **Needs attention**, most urgent first:
   - reported inquiries (click to view);
   - quotes, fund requests and SOAs to approve;
   - acceptances to acknowledge;
   - won inquiries to convert;
   - jobs for closing or on hold;
   - free time of 1 day or less;
   - overdue bills;
   - unliquidated advances;
   - quotes waiting too long for the client;
   - pending handovers.
2. Check each tab:
   - **Sales & quotations**
   - **Operations**
   - **Finance** (profit is for Managers only)
   - **Team**
3. Use the **filters**, **Excel** (CSV download) and **PDF** (print).
4. Sign in as Sales, Operations or Accounting.
   - **Expect:** **My work** to-do lists only.

---

## Quick reference: who does what

| Step | Who |
|---|---|
| Report a new inquiry | Sales (optional) |
| Create customer / inquiry, assign Sales | Manager |
| Upload quote, mark sent (with proof), record client answer | Assigned Sales |
| Approve / return quote, acknowledge, close as lost, convert to job | Manager |
| Steps, documents, issues, free days, submit for closing | Assigned Operations |
| Confirm job completed | Manager |
| Fund request, liquidate | Operations · approve: Manager · release, verify: Accounting |
| SOA upload, send, payments, vendor bills | Accounting · approve SOA: Manager |
| Users, permission matrix | Admin · Settings, audit: Admin and Manager |
