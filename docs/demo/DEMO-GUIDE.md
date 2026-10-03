# T1M Portal: demo guide (about 20 minutes)

For presenting the mockup to your manager. Everything shown is mock data and disappears when you refresh the page.

## 1. The whole workflow in plain words

Top1Movers is a freight forwarder and customs broker. A client asks for a service, Top1Movers quotes it, and if the client says yes, the team does the work (shipping, customs, trucking) while keeping every document and every peso paid out on record. At the end the job is handed to Finance.

```
Client asks          Sales quotes        Manager approves      Client answers
 (inquiry)      ->   (upload quote)  ->   (quote is emailed) -> (accept / change / decline)
                                                                       |
                                                                       v
 Finance receives <- Billing checklist <- Job completed <- Operations do the steps <- Manager turns it
 (handover)          (charges listed)     (Manager        (tick steps, upload docs,   into a JOB and
                                           confirms)       ask for funds, raise        assigns Operations
                                                           exceptions, record delivery)
```

Three ideas explain almost everything on screen:
1. **Everything hangs off one record.** The inquiry becomes a Job, and the job page holds its steps, documents, funds, problems and billing. Nothing lives in scattered folders or chats.
2. **The screen always says what to do next.** Each person has a "My work" list; Managers have a "Needs attention" list.
3. **Money and exceptions need a Manager.** Staff ask, the Manager approves, Accounting releases or pays, and every step is logged with who did it and when.

## 2. Who is who (use "Switch person" in the avatar menu)

| Person | Role | Use them to show |
|---|---|---|
| **Lorna Bautista** | Manager | dashboard, approvals, converting to a job, completing a job |
| **Ana Cruz / Cathy Lim / Mia Navarro** | Sales | quotes and the inquiry pipeline (read-only view of their jobs) |
| **Jessa Aquino** | Operations (customs) | ticking customs steps, asking for funds, raising an exception |
| **Rico Domingo** | Operations (freight) | shipping steps and the overdue emails |
| **Mike Salazar** | Operations (trucking) | delivery |
| **Paolo Reyes** | Accounting | releasing funds, checking receipts, receiving a job for billing |
| **Jun Robles** | Admin (all access) | users and the permission matrix |

## 3. Before you start (2 minutes)

1. Open `apps/mockup/index.html` (double-click). If it looks outdated, rebuild with `node apps/mockup/build.mjs`.
2. Click **Sign in with Microsoft** and pick **Lorna Bautista**.
3. On the dashboard click **Load sample data**. You now have 3 customers, 10 inquiries and 4 jobs in different situations.
4. Keep the browser window wide. Do not refresh during the demo (it clears everything).

What the 4 sample jobs are:

| Job | Situation | Use it for |
|---|---|---|
| SJ-2026-00001 (Sample Trading) | Duties step waiting, a fund request awaiting approval, free time already over | money flow, overdue |
| SJ-2026-00002 (Sample Motors) | On hold: exception waiting for approval | exceptions |
| SJ-2026-00003 (Sample Foods) | A step is 3 days overdue | overdue emails |
| SJ-2026-00004 (Sample Trading) | Completed, damaged delivery, ready for Finance | delivery, documents, billing handover |

## 4. The demo script

### Scene 1: "What needs me today?" (2 min) as Lorna (Manager)
- Open the **Dashboard**. Point at **Needs attention**: 12 items sorted by urgency, each opens its record.
- Click the **Operations** tab: Overdue steps, Missing documents, Open exceptions by category, Billing readiness. Mention **Export to Excel**.
- *Say:* "A manager sees the day's problems on one screen instead of chasing people."

### Scene 2: From inquiry to job (4 min)
1. **Inquiries & quotes.** Show the list and the filters.
2. Open **INQ-2026-0002** (quote waiting for approval). Click **Review quotation v1**, then **Approve**. *Say:* "Approval emails the quote to the client automatically."
3. Open **INQ-2026-0003** (awaiting the client). In the checklist click **View page** on "Client response": this is the page the client sees. Choose **Accept**, **Send my answer**.
4. Back as Lorna, open **INQ-2026-0004** and click **Acknowledge & close**. Then open **INQ-2026-0005** and click **Convert to job**. Assign one Operations person per service and **Create job**.
5. Show **Version history** on any inquiry: every quote version is kept with the reason it was returned or lost.
- *Proves:* quote versions, approval, client conforme, convert without re-typing.

### Scene 3: Running a job and the money (5 min)
1. Open **SJ-2026-00001**. Show the **progress map** (phases), the **Next step** panel (what to do now and what blocks it), and **Free time** (port storage and demurrage clock).
2. The next step "Duties paid" is blocked: customs duties need money first. Show **Request funds**.
3. Sign in as **Jessa Aquino** (My work shows it), or as Lorna: open **Funds** tab, click **Review** on FR-2 and **Approve**.
4. Sign in as **Paolo Reyes** (Accounting). **My work** shows "Release". Open it, enter a reference, attach proof (use "sample file"), **Release funds**.
5. Back as **Jessa**: **Mark "Duties paid" done**. Note the one upload: it ticks the step AND submits the receipts. Then as Paolo: **Check receipts**, **Confirm receipts**.
6. Show the **Funds** page (left menu): totals, who each request is waiting on, **Export money log**.
- *Say:* "Staff ask, a manager approves, accounting releases, staff bring receipts, accounting confirms. Nobody pays out without a record."
- *Proves:* controlled funds, audit trail, no accounting system needed.

### Scene 4: Overdue and automatic email (2 min)
- Open **SJ-2026-00003**: the red **Overdue by 3 days** alert says the owner and a Manager were emailed automatically.
- Sign in as **Rico Domingo**, click the bell, then **View email**.
- Optional: avatar menu **Demo: jump ahead 3 days** to watch more things go overdue. Choose **Demo: back to today** when done.
- *Say:* "Overdue work escalates by itself. In this mockup the email is shown on screen rather than sent."

### Scene 5: Exceptions (2 min) as Lorna
- Open **SJ-2026-00002** (on hold). Click **Review exception**: category, impact, evidence. Write a corrective action, pick the owner and due date, **Approve**.
- The hold lifts and the action becomes a tracked task. Open the **Exceptions** tab.
- *Say:* "Any deviation needs a manager and ends with a named person fixing it by a date."

### Scene 6: Delivery and documents (2 min)
- Open **SJ-2026-00004**. The **Delivery** panel shows time, who received it and "Damaged"; that raised an exception automatically (see Exceptions tab, now resolved).
- **Documents** tab: **Accept** or **Reject** (reason required). A rejected document asks Operations for a new version; **History** shows the old one.

### Scene 7: Billing readiness and Finance handover (2 min)
- Same job, **Billing** tab: five checks, charges to bill, comparison with the accepted quote.
- Sign in as **Paolo Reyes**: My work shows "Receive this job for billing". Open it, click **Mark received by Finance**, add a reference.
- *Say:* "We do not create invoices or handle tax. We hand Finance a clean, complete file."

### Scene 8: Close (1 min)
- Client tracking page: any job, Key facts, **Client view**. Clients see progress only, never money or staff.
- Jun Robles: **Users & roles** and the **permission matrix**. **Audit log**: every action with who and when.
- Shrink the window or use a phone: it works on a phone.

## 5. If you are asked to build one from scratch
Sign in as Lorna: **Customers, New customer**, then **New inquiry** (pick services, watch the job plan appear). Then follow Scene 2 and 3. Start without loading sample data if you want to show this.

## 6. Likely questions
| Question | Answer |
|---|---|
| Does it send real emails? | Not in this mockup; each email is saved and shown from the bell. |
| Does it do invoicing or tax? | No, by design. It records funds, receipts and charges, then hands the job to Finance. |
| Is the data real? | No. All mock data, lost on refresh. |
| What about AI, mobile apps, customer portals? | Deferred in the client's own blueprint (section 1). |
| Who can approve money? | A Manager approves, Accounting releases. Admin has all access, and both actions are logged under the person's name. |
| Can Sales see money? | No. Sales can view their jobs read-only. |

## 7. Tips
- If something looks stuck, the data is session-only: refresh and click **Load sample data** again.
- Do not click through every tab; the story is "inquiry, job, money, problems, handover".
- The detailed assessment against the client's blueprint is in `docs/assessment/2026-10-03-after-gap-closure.md`.
