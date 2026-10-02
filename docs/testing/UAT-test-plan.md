> **Superseded (2026-10-02).** This describes the old import-only, nine-stage mockup (Dispatcher / Warehouse Crew / Finance). The agreed workflow is in `docs/requirements/` and the mockup now follows it. Kept for history only.

# Top1Movers Operations Portal: UAT Test Plan and Test Cases

**Product:** Top1Movers Operations Portal, stakeholder mockup (proposal stage)
**Build under test:** `apps/mockup/index.html` (single file, mock data only)
**Document type:** scenario-based user acceptance test (UAT) plan
**Status:** Draft v1.0
**Tracking sheet:** `docs/testing/UAT-test-cases.xlsx` holds every case below with Status, Tester, Date and Defect columns and a live progress summary. Use the spreadsheet to record results; keep this document as the reference.

This plan tells a tester exactly what to do, as which user, and what should happen. It covers every role's point of view (Dispatcher, Warehouse Crew, Manager, Admin, Finance, and the outside Customer), every feature in the mockup, and three kinds of scenario for each: things that go right, things that go wrong, and awkward edge cases.

---

## 1. How to use this document

### 1.1 Who does what

| Tester | Sections to run | Time (approx.) |
|---|---|---|
| Operations coordinator | 5 (Dispatcher) | 60 to 75 min |
| Warehouse / field lead | 6 (Warehouse Crew) | 40 to 50 min |
| Operations manager | 7 (Manager) | 75 to 90 min |
| IT / system administrator | 8 (Admin) | 45 to 60 min |
| Finance officer | 9 (Finance) | 45 to 60 min |
| Someone outside the company | 10 (Customer tracking) | 15 to 20 min |
| One person per role, together | 11 (End-to-end journeys) | 90 to 120 min |
| Anyone | 4 (Everyone), 12 (Cross-cutting checks), 13 (Data checks) | 40 min |

### 1.2 Test case format

Every case has the same columns:

| Column | Meaning |
|---|---|
| **ID** | Unique code. The prefix tells you the section (`DSP-` Dispatcher, `WHC-` Warehouse Crew, `MGR-`, `ADM-`, `FIN-`, `CUS-` Customer, `ACC-` Everyone, `E2E-` end-to-end, `XC-` cross-cutting, `DAT-` data). |
| **Type** | **Happy** = the normal path works. **Wrong** = something goes wrong (bad input, missing item, blocked action) and the system must handle it gracefully. **Edge** = an unusual but valid situation. **Access** = a role must be able to do, or must be blocked from doing, something. |
| **Scenario** | The situation in plain words. |
| **Steps** | What to do. Numbered. Names in **bold** are buttons, tabs or fields exactly as they appear on screen. |
| **Expected result** | What you must see. If anything differs, the case fails. |
| **Result** | Leave blank. Write **P** (pass), **F** (fail) or **B** (blocked) while testing. |

### 1.3 Marking and reporting

- Mark **P** only if every part of the expected result is true.
- Mark **F** if any part differs. Write the defect in section 15 (template provided) with the case ID, what you saw, and a screenshot.
- Mark **B** if you cannot run the case (for example, an earlier case failed and left the data in the wrong state).
- A defect is **Critical** if a role can see or do something it must not (access or data leak) or the page breaks; **Major** if a feature gives a wrong result; **Minor** if it is wording, layout or polish.

---

## 2. Test environment and setup

| Item | Value |
|---|---|
| How to open | Open `apps/mockup/index.html` in a browser (double-click the file). No server, no install. |
| Browsers | Chrome or Edge (latest) is the primary target. Spot-check Firefox and Safari. |
| Screen sizes | Desktop 1440 px wide for most cases. Section 12 covers tablet (768 px) and phone (400 px). |
| "Today" | The mockup's clock is **fixed at Monday 28 September 2026**. All overdue, due-in-N-days and storage-clock statements assume this date. Do not use your computer's date. |
| Baseline | The expected results in this plan were checked against the current build with an automated walkthrough of the same steps (more than 300 checks, all passing). If a screen differs from this plan, treat it as a finding. |
| Data reset | Data lives only in the open page. **Refresh the page (F5) to restore the original sample data**, then sign in again. Nothing is ever saved. |
| Data between cases | Cases within a section are designed to run in order on one page load. Where a case needs fresh data it says **Refresh first**. |
| Mock content | Every name, ID, amount and file is fictional. Buttons such as **Open**, **View** on a file, and **Download PDF** (except job SJ-2026-00101's PDF) do not open real files; they show a message saying so. |

**Before you start each section:** refresh the page, then sign in as the user named at the top of that section.

### 2.1 How to sign in

1. On the sign-in screen click **Sign in with Microsoft**. (The mockup simulates this; there is no password.)
2. In "Pick an account" click the row for the role you need.
3. To leave, click your avatar (top right) then **Sign out**.

### 2.2 Testing as the second person in a role

The account picker offers one person per role (the first active one). To test as the other person, use the app itself:

1. Sign in as **Admin**, open **Users & Roles**.
2. Turn the switch off for **Ben Santos** (to test as **Rico Domingo**) or for **Ana Cruz** (to test as **Cathy Lim**).
3. Sign out and sign in again. The picker now offers the other person for that role.

This is also a test in its own right (see ADM-03).

---

## 3. Users, roles and test data

### 3.1 People (demo accounts)

| Role | Person | Lands on | Owns / covers |
|---|---|---|---|
| Dispatcher | **Ana Cruz** | My Tasks | Customers: Sample Trading Co., Pacific Rim Logistics Partners, Meridian Import Export Ltd. |
| Dispatcher | **Cathy Lim** | My Tasks | Customers: Golden Harvest Exports Inc., BlueWave Distribution Corp. |
| Warehouse Crew | **Ben Santos** | My Tasks | Odd-numbered jobs: SJ-2026-00101, 00095, 00077, 00065 |
| Warehouse Crew | **Rico Domingo** | My Tasks | Even-numbered jobs: SJ-2026-00088, 00082, 00130, 00070, 00120, 00060, 00050, 00110 |
| Manager | **Grace Tan** | Dashboard | Everything except Users & Roles |
| Admin | **Mark Villar** | Dashboard | Everything |
| Finance | **Paolo Reyes** | Dashboard | Read-only view of jobs, charges and audit trail |
| Customer (no account) | Any customer contact | Public tracking page | Sees only shipment status |

### 3.2 What each role may do (the permission matrix to test against)

| Area | Dispatcher | Warehouse Crew | Manager | Admin | Finance |
|---|---|---|---|---|---|
| Dashboard | Own customers' jobs only | No | All jobs | All jobs | All jobs |
| Customers | Full | No | Full | Full | No |
| Inquiries and Quotations | Full | No | Full | Full | No |
| Shipment Jobs (list and detail) | All jobs | **Assigned jobs only** | All | All | All, **read-only** |
| Tasks | Complete, reassign | **Own tasks only**, complete (no reassign) | Complete, reassign | Complete, reassign | No tab |
| Documents | Upload, approve, reject | **Upload only** | Upload, approve, reject | Upload, approve, reject | No tab |
| Exceptions | Raise | Raise | Raise, **approve or reject** | Raise, **approve or reject** | No tab |
| Delivery and POD | No tab | Confirm delivery | Confirm delivery | Confirm delivery | No tab |
| Advance a job's stage or customs sub-stage | Yes | Yes (assigned jobs) | Yes | Yes | No |
| Customs lane, hold, clear hold | No | No | Yes | Yes | No |
| Status override (out of sequence) | No | No | Yes | Yes | No |
| Charges, funds, margin | **Hidden** | **Hidden** | Full (add, approve, absorb) | Full | **View only** |
| Billing Summary | No | No | Yes | Yes | Yes |
| Users and Roles | No | No | No | Yes | No |
| Audit Trail | No | No | Yes | Yes | Yes |

### 3.3 Sample shipments (the data you will test with)

"Today" is 28 Sep 2026. Dispatcher = the customer's dispatcher. Crew = the covering warehouse person.

| Job | Customer | Dispatcher / Crew | Stage now | What is special about it |
|---|---|---|---|---|
| **SJ-2026-00101** | Sample Trading Co. | Ana / Ben | Billing Ready | **Balance owed**: client sent ₱140,000, we spent ₱150,400 and our fee is ₱3,500, so bill client ₱13,900. Quote ₱174,500. Has a pre-built PDF. |
| **SJ-2026-00095** | Golden Harvest | Cathy / Ben | Documentation | **Document problems**: Bill of Lading pending review, Certificate of Origin rejected, Import Permit missing. High priority. |
| **SJ-2026-00088** | Pacific Rim | Ana / Rico | Sailed | Clean, mid-journey job. Good for status updates. |
| **SJ-2026-00082** | BlueWave | Cathy / Rico | Arrived at Port | **Overdue task** (Lodge customs entry, due 24 Sep) and **free storage expired** 26 Sep. |
| **SJ-2026-00077** | Meridian | Ana / Ben | Out for Delivery | **Delivery waiting to be confirmed.** Free detention until 3 Oct. |
| **SJ-2026-00130** | Sample Trading Co. | Ana / Rico | Customs Clearance | **Customs inspection** (Red lane, Under Inspection). Urgent. |
| **SJ-2026-00070** | Sample Trading Co. | Ana / Rico | Delivered | **Unquoted extra charge** (Extra storage fee ₱6,800) and a **payment with no receipt** (Port handling fee ₱2,400). Empty container return is due, with detention ending in 2 days. |
| **SJ-2026-00065** | Golden Harvest | Cathy / Ben | Exception Hold | **Open exception** (HS code mismatch) waiting for approval. Customs payment is waiting on the **client**. Free storage ends tomorrow. |
| **SJ-2026-00120** | Golden Harvest | Cathy / Rico | Customs Clearance | **Short on funds**: duty ₱18,400 due 30 Sep, only ₱10,000 on hand, so short by ₱8,400. Free storage ends in 2 days. |
| **SJ-2026-00060** | Pacific Rim | Ana / Rico | Billing Ready | **Refund due**: fully funded, refund due to client ₱16,100. Has ₱5,000 markup on freight. |
| **SJ-2026-00050** | BlueWave | Cathy / Rico | Closed | **Fully settled**: money in exactly covers everything. |
| **SJ-2026-00110** | Meridian | Ana / Rico | Booked | **All five documents missing.** Brand-new job. |

Tracking numbers work for the public page: any job ID above, its BL number (for example `BL-2026-04520` is SJ-2026-00120) or its container number (for example `TMWU-118899-2`).

### 3.4 Sample inquiries and quotations

| Item | State | Use it for |
|---|---|---|
| INQ-2026-0041 / QT-2026-0041 | Converted to SJ-2026-00101, approved by Ana Reyes | Multi-version quotation (v1 ₱186,000, v2 and v3 ₱174,500); "already converted" check |
| INQ-2026-0042 / QT-2026-0042 | Quoted ₱245,000, **awaiting customer approval**, missing consignee delivery address | Record approval, then convert |
| INQ-2026-0043 | **New**, no quotation, missing Container type and Requested pickup date | Create a quotation |
| INQ-2026-0044 | **Declined** | "No quotation" dead end |

### 3.5 IDs created during testing

If you start from a fresh page, new records get these IDs: inquiry **INQ-2026-0045**, quotation **QT-2026-0044**, customer **CUST-06**, converted job **SJ-2026-00123** (then 00124), exception **EX1** on a job with none (**EX2** on SJ-2026-00065, which already has EX1).

### 3.6 Key dashboard numbers at the start (fresh page)

| Card | Manager, Admin, Finance | Dispatcher Ana Cruz |
|---|---|---|
| Active jobs | 11 | 7 |
| Overdue tasks | 1 | 0 |
| Missing / rejected docs | 7 | 5 |
| Open exceptions | 1 | 0 |
| Billing ready | 2 | 2 |
| Jobs short on funds | 1 | (not shown) |

Audit Trail (fresh page, Manager or Admin): All time **66** events; Today **1**; Last 7 days **18**; Last 30 days **64**; This month **62**.

---

> **Files in tests:** whenever a step says "attach a file", use any small file (PDF, photo). The mockup keeps only the file name and shows it back to you.

## 4. Everyone: sign-in, access and shared tools (ACC)

Run as each role where noted. Refresh first.

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| ACC-01 | Happy | Each role signs in and lands in the right place | 1. Sign in as **Dispatcher**, note the page and the top bar.<br>2. Sign out. Repeat for **Warehouse Crew**, **Manager**, **Admin**, **Finance**. | Dispatcher and Warehouse Crew land on **My Tasks**. Manager, Admin and Finance land on **Dashboard**. The top bar always reads "Name · Role" (for example "Grace Tan · Manager"). | |
| ACC-02 | Access | Sidebar shows only what the role may use | Sign in as each role and read the left menu. | **Dispatcher:** My Tasks, Dashboard, Customers, Inquiries & Quotations, Shipment Jobs. **Warehouse Crew:** My Tasks, Shipment Jobs. **Manager:** Dashboard, Customers, Inquiries & Quotations, Shipment Jobs, Audit Trail. **Admin:** the same as Manager plus Users & Roles. **Finance:** Dashboard, Shipment Jobs, Audit Trail. Nothing extra is shown greyed out. | |
| ACC-03 | Wrong | Typing the address of a page the role may not open | 1. As **Manager**, change the address ending to `#/users` and press Enter.<br>2. As **Dispatcher**, use `#/audit`.<br>3. As **Warehouse Crew**, use `#/dashboard`.<br>4. As **Finance**, use `#/customers`. | Each time you see "**Not available for** *your role*" and a sentence naming the module. No data from that page is shown. | |
| ACC-04 | Wrong | Opening the app without signing in | 1. Refresh the page.<br>2. In the address bar type `#/dashboard` after the file name and press Enter. | You are taken to the sign-in screen. No dashboard content flashes. | |
| ACC-05 | Wrong | Going back after signing out | 1. Sign in as any role and open a job.<br>2. Sign out.<br>3. Press the browser **Back** button several times. | You always end on the sign-in screen. No protected page is shown. | |
| ACC-06 | Happy | Global search with the keyboard | 1. As **Manager** press **Ctrl+K** (Cmd+K on Mac).<br>2. Type `blue`.<br>3. Press the down arrow, then Enter.<br>4. Press Ctrl+K again and press Esc. | A "Jump to a job or customer" box opens. `blue` lists the customer BlueWave Distribution Corp. and jobs for that customer. Enter opens the highlighted item. Esc closes the box. | |
| ACC-07 | Wrong | Search with nothing found | 1. Press Ctrl+K.<br>2. Type `zzzz`. | The list says **No jobs or customers match "zzzz"**. Nothing breaks. | |
| ACC-08 | Access | Search only offers what the role may open | 1. As **Finance**, press Ctrl+K and type `sample`.<br>2. As **Warehouse Crew (Ben)**, press Ctrl+K with the box empty, then type `SJ-2026-00088`. | Finance sees jobs but **no customers**. Ben sees only his four assigned jobs and **no result** for SJ-2026-00088. | |
| ACC-09 | Happy | Notifications | Click the **bell** icon in the top bar. | A "Notifications" panel slides in showing an illustrative overdue-task email (task "Lodge customs entry" on SJ-2026-00082, addressed to Cathy Lim) and a warning that it is a mock. Close it with the X. | |
| ACC-10 | Happy | Demo role switch | 1. Sign in as **Manager**, open a job.<br>2. Avatar menu, **Demo: switch role**, choose **Finance**. | The top bar and sidebar change to Finance. The job stays open but shows only the Overview and Charges tabs. | |
| ACC-11 | Edge | Switching role while on a page the new role cannot open | 1. As **Admin**, open **Users & Roles**.<br>2. Switch role to **Manager**. | You are moved to the Dashboard instead of an error page. | |
| ACC-12 | Wrong | Job or page that does not exist | 1. Signed in as Manager, go to `#/jobs/SJ-2026-99999`.<br>2. Go to `#/customers/CUST-99`. | "**Job not found.**" and "**Customer not found.**" messages. No crash. | |
| ACC-13 | Happy | Customer tracking is reachable without an account | On the sign-in screen click **Track a shipment**. | The customer tracking page opens with no sign-in. (Full tests in section 10.) | |

---

## 5. Dispatcher's point of view (DSP)

**Sign in as Dispatcher (Ana Cruz).** Ana's customers: Sample Trading Co., Pacific Rim Logistics Partners, Meridian Import Export Ltd. To act as Cathy Lim see 2.2. Run in order. Refresh first.

### 5.1 My work and dashboard

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-01 | Happy | My Tasks after signing in | Read the My Tasks page. | Heading "My Tasks · Ana Cruz · Dispatcher". One section, **Upcoming (12)**. No Overdue or Due-now sections. Each row shows job, task, customer, due date, status, and a **Complete** button. Tasks that need proof show an "**evidence required**" tag. There is **no** "Deliveries to confirm" section. | |
| DSP-02 | Access | Dashboard is limited to Ana's customers and hides money | Click **Dashboard**. | Cards: Active jobs **7**, Overdue tasks **0**, Missing / rejected docs **5**, Open exceptions **0**, Billing ready **2**. The status ring reads "7 your jobs". Page subtitle says "Your jobs — Ana Cruz". **No** "Jobs short on funds" card or list, **no** "Cost & margin" section. The "Billing readiness" table shows status only, **no peso amounts** and no Charges column. | |
| DSP-03 | Happy | Dashboard drill-down | 1. Click the **Sailed** entry in the status ring legend.<br>2. Go back to Dashboard and click a row in "Missing & rejected documents". | The first click opens Shipment Jobs already filtered to **Sailed** (SJ-2026-00088). The second opens SJ-2026-00110's Documents tab. | |
| DSP-04 | Happy | Cathy's view of the same dashboard | Deactivate Ana (2.2), sign in as Cathy Lim, open My Tasks then Dashboard. | My Tasks shows **Overdue (1)**: Lodge customs entry on SJ-2026-00082 (due 24 Sep 2026). **Due now (3)**. **Upcoming (11)**. Dashboard shows Overdue tasks **1**. | |

### 5.2 Customers

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-05 | Happy | Find a customer and read their history | 1. Open **Customers**.<br>2. Type `pacific` in the search box.<br>3. Open Pacific Rim Logistics Partners.<br>4. Click the tabs **Overview**, **Contacts & Consignees**, **History**. | The list narrows to one customer (contact Liza Fernandez). Overview shows contact, requirements ("Dry van only, no reefer.") and delivery instructions. Contacts shows the consignee and delivery address. History links to inquiry INQ-2026-0043 and jobs SJ-2026-00088 and SJ-2026-00060. | |
| DSP-06 | Wrong | Search finds nothing | Type `xyz` in the customer search. | Table says "**No customers match your search.**" | |
| DSP-07 | Happy | Register a new customer | 1. Click **New customer**.<br>2. Enter name `Test Freight Co.`, contact `Lea Ramos`, address `Pier 3, Manila`.<br>3. Click **Save customer**. | Message "Test Freight Co. saved." The customer now appears in the list (6 customers, sidebar count 6) with contact Lea Ramos. | |
| DSP-08 | Wrong | Saving with no name | Open **New customer**, leave the name empty, click **Save customer**. | The name field shows "**Enter the customer name.**" and the drawer stays open. Nothing is added. | |
| DSP-09 | Edge | Duplicate customer name | In **New customer** type `Sample Trading Co.` | A warning appears at once: "**Possible duplicate** ... already exists (CUST-01). Review before creating a new record." Saving is still possible. | |
| DSP-10 | Happy | Start an inquiry from a customer row | On the customer list click the **⋮** on a row, choose **New inquiry**. | The Register inquiry drawer opens with that customer already selected. | |

### 5.3 Inquiries and quotations

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-11 | Happy | Register an inquiry | 1. **Inquiries & Quotations**, **Register inquiry**.<br>2. Customer **Meridian Import Export Ltd.**, cargo `Insured goods, 1x20ft`, origin `Shanghai, CN`, port of entry `Manila, PH`, destination `Pasig, PH`.<br>3. Click **Register inquiry**. | Message "Inquiry INQ-2026-0045 registered." The inquiry page opens, status **New**, **assigned to Ana Cruz**, with a warning "Missing required shipment info: Container type". | |
| DSP-12 | Wrong | Register with required fields blank | Open **Register inquiry**, enter only a cargo description, click the button. | Message "**Cargo, origin and destination are required.**" The drawer stays open. No inquiry is added. | |
| DSP-13 | Edge | Missing port of entry is called out | Register an inquiry with cargo, origin and destination but **no port of entry**. | The new inquiry's warning lists both **Port of entry** and **Container type**. It is assigned to the customer's dispatcher (Cathy Lim for Golden Harvest or BlueWave). | |
| DSP-14 | Happy | Create a quotation | 1. Open INQ-2026-0043 (status New).<br>2. Click **Create quotation**. | Quotation **QT-2026-0044** opens: version **v1**, total ₱150,000.00, terms Net 30, status **Pending customer approval**. Going back, the inquiry is now **Quoted**. | |
| DSP-15 | Happy | Revise a quotation and keep history | 1. On QT-2026-0044 click **Add revision**.<br>2. Click the **v1** tab, then **v2**. | A **v2** tab appears with the note "Revised, copy of v1, pending edits." **v1** is still there and unchanged. | |
| DSP-16 | Happy | See a multi-version approved quotation | Open QT-2026-0041. | Tabs v1, v2, v3. v1 total ₱186,000.00, v2 and v3 ₱174,500.00; v3 terms "Net 45". Green box "Customer approval recorded: Approved by Ana Reyes on 14 Sep 2026". Instead of a convert button there is **Converted to SJ-2026-00101**. | |
| DSP-17 | Happy | Record customer approval (conforme) and convert | 1. Open QT-2026-0042.<br>2. Click **Record customer approval / conforme**, enter `Marco Villanueva`, click **Save conforme**.<br>3. Click **Convert to Shipment Job**.<br>4. Review the carry-over page, click **Create Shipment Job**. | Message "Customer approval recorded." The quotation shows the green approval box. The carry-over page says "No re-keying needed" and lists customer Golden Harvest, cargo, route, approved total ₱245,000.00, conforme Marco Villanueva. Message "Shipment Job SJ-2026-00123 created." The new job is at **Booked**, ETA **TBD**, declared value ₱1,470,000.00, all five documents **Missing** (version 0), all seven tasks **Pending** (the first, "Verify shipment documents complete", is due 03 Oct 2026 and owned by Cathy Lim; "Deliver to consignee" is owned by Ben Santos). History shows "Job created" by Ana Cruz (Dispatcher). | |
| DSP-18 | Wrong | Convert before the customer approved | 1. Open QT-2026-0044 (no approval yet). Confirm there is no convert button.<br>2. Change the address to `#/jobs/new/QT-2026-0044`. | Only the approval button exists. The direct address shows "**Customer approval needed first**" and no job is created. | |
| DSP-19 | Wrong | Convert the same quotation twice | After DSP-17, open QT-2026-0042 again. | The convert button is gone. In its place: **Converted to SJ-2026-00123**. Only one job exists for that quotation. | |
| DSP-20 | Wrong | Declined inquiry has no route forward | Open INQ-2026-0044. | Red box "**Inquiry declined. No quotation will be created.**" and no Create quotation button. | |

### 5.4 Shipment jobs, status and customs

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-21 | Happy | Find jobs with search, filter and density | 1. **Shipment Jobs**. 2. Search `blue`. 3. Clear it, filter status **Customs Clearance**. 4. Switch density **Compact**, **Comfortable**. | Search shows BlueWave jobs (SJ-2026-00082 and 00050). The status filter shows SJ-2026-00130 and SJ-2026-00120 (SJ-2026-00065 is on exception hold, so it is listed under Exception Hold instead). Density changes row height only. All 12 jobs are visible to a Dispatcher. | |
| DSP-22 | Happy | Flags tell the story at a glance | Read the **Flags** column. | SJ-2026-00082: Overdue task, High priority, "Free storage expired 2d ago". SJ-2026-00130: Under Inspection, Urgent priority. SJ-2026-00065: Exception, High priority, "Free storage: 1d left". SJ-2026-00120: "Free storage: 2d left". SJ-2026-00110: Missing doc. **No** "Short on funds" flag for a Dispatcher. | |
| DSP-23 | Happy | Job detail overview | Open SJ-2026-00082. | Journey bar 38% (stage 4 of 9). Milestone track at "Arrived at Port". Status history is dated and newest first. Job details: container, BL, consignee, ownership, shipping line, vessel, declared value. The **Tasks** tab carries a red **!** marker. | |
| DSP-24 | Happy | Move a job to the next stage | 1. Open SJ-2026-00088 (Sailed).<br>2. **Update status**.<br>3. Read the list, then **Confirm: move to Arrived at Port**. | The list allows only the next stage; earlier stages say "already completed" and later ones "locked until ... is done". Message "SJ-2026-00088 moved to Arrived at Port." History gains "Status changed: Moved to Arrived at Port" by Ana Cruz. | |
| DSP-25 | Wrong | Cannot skip stages | On SJ-2026-00110 (Booked) open **Update status** and try to pick **Sailed** or **Delivered**. | Those options are disabled ("locked until the previous stage is done"). Only **Documentation** can be selected. | |
| DSP-26 | Wrong | Delivered and Billing Ready cannot be picked from the list | 1. On SJ-2026-00077 (Out for Delivery) open **Update status**.<br>2. Repeat on SJ-2026-00070 (Delivered). | Warning "**Delivered can't be picked here**: confirm the delivery with proof of delivery on the Delivery tab", then "**Billing Ready can't be picked here**: set by a Manager or Admin once the billing checklist passes". The confirm button is greyed out. No Go-to button appears for the Dispatcher (no access to those tabs). | |
| DSP-27 | Wrong | Customs must finish before the job leaves customs | On SJ-2026-00120 (Customs Clearance) open **Update status**. | Warning "**Customs clearance in progress**": advance the sub-stage first. Confirm is disabled. | |
| DSP-28 | Happy | Advance the customs sub-stage | 1. On SJ-2026-00120 click **Advance customs stage** in the Customs Clearance panel.<br>2. Confirm move to **Payment Completed**. | Message "Customs stage advanced to Payment Completed." The panel's track moves on. History gains "Customs stage advanced". | |
| DSP-29 | Edge | Advance to the very last customs stage | After DSP-28 on SJ-2026-00120, click **Advance customs stage** twice more (Release Pending, then Released), then click it once more. | The last click opens a panel saying "**This job has already reached the final customs sub-stage (Released).**" Afterwards **Update status** offers **Out for Delivery** as the next stage (customs is finished). | |
| DSP-30 | Wrong | A customs hold blocks progress and a Dispatcher cannot clear it | 1. Open SJ-2026-00130 (Under Inspection).<br>2. Read the Customs panel.<br>3. Click **Advance customs stage**. | A red box shows "Under Inspection" and the BOC note. **No** lane selector, **no** "Clear hold" and **no** "Place on hold" button for a Dispatcher. Advancing says "Clear the hold in the Customs Clearance panel before advancing further." | |
| DSP-31 | Access | No override for a Dispatcher | Open **Update status** on any job. | There is **no** "Admin/Manager override" section. | |
| DSP-32 | Access | Charges and delivery are not available | 1. Open any job and read the tabs.<br>2. Go to `#/jobs/SJ-2026-00120/charges`.<br>3. Go to `#/jobs/SJ-2026-00060/billing-summary`. | Tabs: Overview, Tasks, Documents, Exceptions only. The charges address just shows the Overview. Billing summary says "**Not available for Dispatcher**". No charges, funds, margin or "Short on funds" chip anywhere on the job (the job's own declared value is still shown in Job details). | |
| DSP-33 | Access | Money entries stay out of the job history | Open SJ-2026-00060 and read **Status history**. | You see created and stage-change entries only. **No** "Funds received" entries. | |

### 5.5 Tasks

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-34 | Happy | Complete a task that needs proof | 1. Open SJ-2026-00088, **Tasks** tab.<br>2. **Complete** on "Lodge customs entry" (tagged evidence required).<br>3. Attach a file, add note `Filed with BOC`, click **Mark complete**. | Message "Lodge customs entry marked complete." Status **Completed**, the row now shows **View evidence**. History gains "Task completed". | |
| DSP-35 | Wrong | Complete an evidence task with no file | Same task on another job (for example SJ-2026-00130 "Pay duties and assessment"), click **Mark complete** with no file. | Message "**Attach the completion evidence first. This task requires it.**" The task stays Pending. | |
| DSP-36 | Happy | Complete a task that needs no proof | On SJ-2026-00088 complete "Secure delivery order" with no file and no note. | It completes. The row shows "No evidence required". | |
| DSP-37 | Happy | Read the proof afterwards | Click **View evidence** on the task from DSP-34. | A "Task evidence" panel shows the task name, **Completed by Ana Cruz**, completed date, the attached file name, and the note "Filed with BOC". | |
| DSP-38 | Happy | Reassign a task | 1. On SJ-2026-00088 click **Reassign** on "Book delivery truck".<br>2. Owner **Cathy Lim**, due `10 Oct 2026`, **Save**. | Message "Reassigned to Cathy Lim." The row shows the new owner and date. History gains "Task reassigned". | |
| DSP-39 | Wrong | Reassign with a bad date | In the Reassign panel type `soon` as the due date, click **Save**. | Message "**Enter the due date like 05 Oct 2026.**" Nothing changes. | |

### 5.6 Documents and exceptions

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-40 | Happy | Approve a document | 1. Open SJ-2026-00095, **Documents** tab.<br>2. **Review** on Bill of Lading (Pending Review).<br>3. **Approve**. | Message "Bill of Lading approved." Status **Approved**; the button becomes **View**. | |
| DSP-41 | Happy | Upload a missing document | On SJ-2026-00110 click **Upload** on Packing List, attach a file, click **Upload**. | Message "Packing List uploaded for review." Status **Pending Review**, version 1. Dashboard "Missing / rejected docs" drops from 5 to 4. | |
| DSP-42 | Happy | Reject with a reason | On SJ-2026-00110 **Review** the Packing List, **Reject**, reason `Signature missing`, click **Reject**. | Message "Packing List rejected." The row reads "v1 — rejected: Signature missing", status **Rejected**, with a **Replace** button. | |
| DSP-43 | Happy | Replace a rejected document | Click **Replace** on that Packing List, attach a file, **Upload**. | Version goes up to **v2**, status returns to **Pending Review**, the rejection reason is cleared. | |
| DSP-44 | Wrong | Upload with no file | Click **Upload** on a missing document and submit with no file. | Message "**Choose a file to upload first.**" Status stays Missing. | |
| DSP-45 | Wrong | Reject with no reason | **Review**, **Reject**, leave the reason empty, click **Reject**. | Message "**Name the problem so the document can be fixed.**" The document is not rejected. | |
| DSP-46 | Edge | An already-rejected document shows its reason | Open SJ-2026-00095 **Documents**. | Certificate of Origin shows **v2 — rejected: Signature block expired — reissue with current authorized signatory.** and a **Replace** button. Import Permit shows **Missing** and **Upload**. | |
| DSP-47 | Happy | Raise an exception | 1. On SJ-2026-00088 open **Exceptions**, **Raise exception**.<br>2. Category **Documentation Discrepancy**, reason `Invoice total differs from packing list`, leave impact High, **Raise exception**. | The **Stage** defaults to the job's current stage. Message "Exception raised — job on hold." The job status becomes **Exception Hold** and the exception shows **Pending Approval**. A Dispatcher sees **no Review button**. | |
| DSP-48 | Wrong | Raise with no reason | Open **Raise exception**, leave the reason empty, submit. | Message "**Describe the reason for the exception.**" No exception is created. | |
| DSP-49 | Wrong | A held job cannot change status | On the job from DSP-47 open **Update status**. | Red box "**This job is on hold**": an exception is pending approval at the stated stage. A **Go to Exceptions** button is offered. | |

### 5.7 Sharing with the customer

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| DSP-50 | Happy | Preview what the customer sees | On SJ-2026-00120 click **Client tracking page** (job header). | The public tracking page for that job opens, with the customer-friendly status and no staff bar or back link. Use the browser Back button to return. | |
| DSP-51 | Happy | A status change shows on the customer page | 1. Move SJ-2026-00088 to **Arrived at Port** (DSP-24).<br>2. Open **Client tracking page** for it. | The customer page headline reads **Arrived at port** and the earlier steps show as completed. | |

---

## 6. Warehouse Crew's point of view (WHC)

**Sign in as Warehouse Crew (Ben Santos).** Ben covers SJ-2026-00101, 00095, 00077 and 00065. To act as Rico Domingo see 2.2. Refresh first. The field screens are also meant for phones; repeat WHC-01 at 400 px wide.

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| WHC-01 | Happy | My Tasks on the floor | Read the My Tasks page. | Heading "My Tasks · Ben Santos · Warehouse Crew". **Due now (1)**: Deliver to consignee on SJ-2026-00077 (due 30 Sep 2026). **Upcoming (5)**. A section **Deliveries to confirm (1)** lists SJ-2026-00077 with a **Confirm + POD** button. | |
| WHC-02 | Access | Only floor tools in the menu | Read the sidebar. | Only **My Tasks** and **Shipment Jobs**. No Dashboard, Customers, Inquiries, Users, Audit. | |
| WHC-03 | Access | Only assigned jobs are listed | Open **Shipment Jobs**. | Exactly four jobs: SJ-2026-00101, 00095, 00077, 00065. | |
| WHC-04 | Wrong | Opening a job that is not yours | Go to `#/jobs/SJ-2026-00088`. | "Not available for Warehouse Crew" and "**SJ-2026-00088 is not assigned to you.**" No job details shown. | |
| WHC-05 | Access | Tasks tab is limited to my own tasks | Open SJ-2026-00077, **Tasks** tab. | Note "**Showing your tasks only.**" Only Ben's two tasks appear (Deliver to consignee, Return empty container). There is **no Reassign** button. On a job where Ben has no open tasks the table says "No tasks assigned to you on this job." | |
| WHC-06 | Happy | Confirm a delivery with proof | 1. On My Tasks click **Confirm + POD** for SJ-2026-00077.<br>2. Received by `J. Ramos (Receiving)`, attach a file as proof of delivery, damage switch off.<br>3. **Confirm delivery**. | Message "Delivery confirmed in full." The job becomes **Delivered**. The **Deliveries to confirm** list now says "Nothing out for delivery right now." On the job's **Delivery** tab you see "Delivered in full", the date, the receiver, and your file name as the Proof of Delivery. | |
| WHC-07 | Wrong | Confirm without who received it | Open the same drawer, leave **Received by** empty, submit. | Message "**Enter who received the delivery.**" Job stays Out for Delivery. | |
| WHC-08 | Wrong | Confirm without proof of delivery | Fill **Received by** but attach nothing, submit. | Message "**Attach the proof of delivery before confirming.**" Job stays Out for Delivery. | |
| WHC-09 | Wrong | Delivered with damage (**Refresh first**) | 1. Repeat WHC-06 but switch **Damage or incomplete delivery** on and describe `Two pallets crushed`.<br>2. Confirm. | Message "Delivery confirmed — damage reported." The Delivery tab shows a red "**Damage / incomplete delivery reported**" box with your description. The job is Delivered. (Later, the billing checklist must stay blocked, see MGR-18.) | |
| WHC-10 | Wrong | Delivery cannot be confirmed too early | 1. Open SJ-2026-00095 (Documentation), **Delivery** tab. | Blue note "**Not out for delivery yet**: Delivery can be confirmed once the job is Out for Delivery. It is currently Documentation." No form. | |
| WHC-11 | Happy | Complete a delivery task with proof | On SJ-2026-00077 **Tasks**, **Complete** on "Deliver to consignee", attach a file, note `Left at dock 2`, **Mark complete**. | Status **Completed**, **View evidence** appears and shows Completed by Ben Santos. | |
| WHC-12 | Wrong | Complete without proof | Try the same on another proof-required task (SJ-2026-00065 "Deliver to consignee") without a file. | Message "**Attach the completion evidence first. This task requires it.**" | |
| WHC-13 | Happy | Return the empty container (act as Rico, see 2.2) | 1. On the jobs list note SJ-2026-00070 shows the flag "**Free detention: 2d left**".<br>2. Open it, **Tasks** tab, **Complete** "Return empty container" (no proof needed).<br>3. Go back to the jobs list. | Task Completed. The detention flag is **gone** from SJ-2026-00070. | |
| WHC-14 | Access | Documents: upload only | 1. Open SJ-2026-00095 **Documents**. | Import Permit (Missing) has **Upload**; Certificate of Origin (Rejected) has **Replace**; Bill of Lading (Pending Review) has **no Review button**. Uploading works as in DSP-41 (a first upload becomes version 1). | |
| WHC-15 | Happy | Raise an exception from the floor | On SJ-2026-00077 **Exceptions**, **Raise exception**, category **Damage**, reason `Container door seal broken`. | Job becomes **Exception Hold**, exception is **Pending Approval**, and there is **no Review** button for the crew. Message "Exception raised — job on hold." | |
| WHC-16 | Access | No money, no admin | 1. Open any assigned job.<br>2. Go to `#/jobs/SJ-2026-00077/charges`. | Tabs: Overview, Tasks, Documents, Exceptions, Delivery. No Charges tab. The address shows Overview. No charges, funds or margin anywhere. | |
| WHC-17 | Access | Dashboard is not for the crew | Go to `#/dashboard`. | "Not available for Warehouse Crew". | |
| WHC-18 | Happy | Rico's day (act as Rico) | Read Rico's My Tasks and Jobs. | Jobs list shows 8 jobs: SJ-2026-00088, 00082, 00130, 00070, 00120, 00060, 00050, 00110. **Due now (1)**: Return empty container on SJ-2026-00070. "Deliveries to confirm" says "Nothing out for delivery right now." | |
| WHC-19 | Happy | Phone use | Narrow the browser to 400 px (or use a phone) and repeat WHC-01 and WHC-06. | The menu becomes a bottom bar, tables scroll or stack, buttons are large enough to tap, and nothing is cut off. | |

---

## 7. Manager's point of view (MGR)

**Sign in as Manager (Grace Tan).** The Manager can do everything a Dispatcher can (repeat a sample once as a regression, see MGR-33), plus approvals, customs control, overrides and all money screens. Refresh first. Run in order.

### 7.1 Oversight dashboard

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| MGR-01 | Happy | The whole business at a glance | Open **Dashboard**. | Six cards: Active jobs **11**, Overdue tasks **1**, Missing / rejected docs **7**, Open exceptions **1**, Billing ready **2**, Jobs short on funds **1**. Panels in order: Shipment status, Workload per user, Overdue tasks, Missing & rejected documents, Open exceptions, Jobs short on funds, Billing readiness, Cost & margin, Billing-ready aging. Subtitle "Management visibility across every shipment job". | |
| MGR-02 | Happy | Workload per user | Read **Workload per user**. | Cathy Lim **15** (1 overdue shown in red), Ana Cruz **12**, Rico Domingo **11**, Ben Santos **6**. | |
| MGR-03 | Happy | Overdue, documents and exceptions lists | Read the three tables. | Overdue: SJ-2026-00082 Lodge customs entry, owner Cathy Lim, due 24 Sep 2026. Missing/rejected docs: SJ-2026-00095 (Certificate of Origin rejected, Import Permit missing) and five rows for SJ-2026-00110. Open exceptions: SJ-2026-00065, Customs Clearance, Documentation Discrepancy, 26 Sep 2026, Pending Approval. Clicking a row opens that job on the right tab. | |
| MGR-04 | Happy | Funds and margin roll-up | Read **Jobs short on funds**, **Billing readiness**, **Cost & margin**, **Billing-ready aging**. | Short on funds: SJ-2026-00120, Golden Harvest, Customs duty, due 30 Sep, funds on hand ₱10,000.00, short by ₱8,400.00, "Fees start in 2 days". Billing readiness: 00101 Ready ₱153,900.00, 00070 Not ready ₱149,200.00, 00120 Not ready ₱114,400.00, 00060 Ready ₱153,900.00, 00050 Ready ₱104,700.00 (recorded charges). Cost & margin: Billing-ready value **₱312,800.00** with "₱300,800.00 pass-through · ₱12,000.00 our fees", Avg. margin **2.5%**, Oldest billing-ready job **6 days**. Aging: 00060 6 days (red), 00101 1 day. | |

### 7.2 Exceptions and approvals

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| MGR-05 | Happy | Approve an exception and assign the fix | 1. Open SJ-2026-00065, **Exceptions** tab, **Review** on the HS code exception.<br>2. Corrective task `Re-issue commercial invoice with matching HS code`, owner **Cathy Lim**.<br>3. **Approve & assign**. | Message "Exception approved; task assigned to Cathy Lim." The exception shows **Approved** and a blue "Corrective task assigned ... assigned to Cathy Lim". The job leaves **Exception Hold** and returns to **Customs Clearance**. Dashboard Open exceptions falls to **0**. Cathy's My Tasks gains the new task (Pending, due 01 Oct 2026, evidence required). | |
| MGR-06 | Happy | Reject an exception (**Refresh first**) | 1. Raise an exception on SJ-2026-00088 (reason `Test`).<br>2. **Review**, then **Reject**. | Message "Exception rejected." Status **Rejected**, the hold is released, **no** corrective task is created. | |
| MGR-07 | Edge | Two exceptions on one job | On SJ-2026-00065 raise a second exception, then approve only the first. | The job **stays on hold** because one is still Pending. It releases only after the second is decided. Second exception is **EX2**. | |

### 7.3 Customs control and overrides

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| MGR-08 | Happy | Set the customs lane | On SJ-2026-00120, in the Customs Clearance panel change **Lane** from Green to **Yellow**. | Message "Customs lane set to Yellow." The panel shows a Yellow lane pill. History gains "Customs lane set". | |
| MGR-09 | Happy | Place and clear a customs hold | 1. On SJ-2026-00120 click **Place on hold / under inspection**.<br>2. Choose **Under Inspection**, note `Physical exam booked Wed`, **Place hold**.<br>3. Open the jobs list, then the customer tracking page for the job.<br>4. Back on the job click **Clear hold**. | Message "Under Inspection placed on SJ-2026-00120." A red box shows the note; the jobs list flags **Under Inspection**; the customer page shows "Customs inspection in progress". **Clear hold** gives "Hold cleared on SJ-2026-00120." and the flag disappears. | |
| MGR-10 | Happy | Clear a hold, then move customs forward, choosing who pays | 1. On SJ-2026-00130 click **Clear hold**.<br>2. **Advance customs stage** to **Assessment Pending**.<br>3. Advance again toward **Payment Pending**. | After the hold is cleared the panel is normal. On the second advance the panel asks "**Waiting on**" (Top1Movers or Client). Choose **Client**: the panel shows a warning "**Waiting on Client**: the client still needs to release funds or approve the assessment before Top1Movers can pay." | |
| MGR-11 | Happy | Override the stage order with a reason | 1. Open SJ-2026-00110 (Booked), **Update status**.<br>2. Open **Admin/Manager override**, force to **Sailed**, reason `Booked straight onto vessel`.<br>3. **Force change**. | Message "Overridden to Sailed." Job is now Sailed. History shows "Status override: Forced to Sailed. Reason: Booked straight onto vessel" by Grace Tan (Manager). | |
| MGR-12 | Wrong | Override with no reason | Repeat the override with the reason empty. | Message "**A reason is required for an override.**" (a message on the page, not a browser pop-up). The status does not change. | |
| MGR-13 | Access | Only Manager and Admin see lane, hold and override controls | Compare with DSP-30 and DSP-31. | The Manager sees the lane selector, hold buttons and the override section that the Dispatcher did not. | |

### 7.4 Tasks and delivery

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| MGR-14 | Happy | Read completed work and its proof | Open SJ-2026-00101, **Tasks** tab. Click **View evidence** on "Verify shipment documents complete". | Panel shows Completed by **Ana Cruz**, completed on 2026-09-10, file `verify-shipment-documents-complete-evidence.pdf`, note "No note provided." Tasks that need no proof (for example "Secure delivery order") show "No evidence required". | |
| MGR-15 | Happy | Reassign any task | Reassign SJ-2026-00095 "Verify shipment documents complete" to **Ana Cruz**, due `03 Oct 2026`. | Message "Reassigned to Ana Cruz." Row updates. Ana's My Tasks now includes it. | |
| MGR-16 | Happy | View a confirmed delivery | Open SJ-2026-00101, **Delivery** tab. | Green "**Delivered in full**", date 20 Sep 2026, received by A. Reyes (Cebu Branch), proof `POD-SJ-2026-00101.pdf` marked Approved. | |
| MGR-17 | Wrong | Delivery form is locked before the truck is out | Open SJ-2026-00110, **Delivery** tab. | "**Not out for delivery yet**" note and no form. | |
| MGR-18 | Wrong | Delivered with damage blocks billing | 1. On SJ-2026-00077 **Delivery**, confirm delivery with receiver, a file, damage switched on and a description.<br>2. Open **Charges**. | Delivery shows the red damage box. The billing checklist item "**Delivery confirmed with POD**" stays **Pending** (damage is not "in full"), so **Mark Ready for Finance** never appears for this job. | |

### 7.5 Client funds, charges and billing

Open **Charges** on each job named. The Charges tab order is: warning banner (if any), **Client funds**, **Needs client approval** (if any), **Cost & margin**, **Billing Summary** (only when Billing Ready or Closed), **Charges & expenses**, **Billing readiness checklist**.

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| MGR-19 | Happy | Read a job that is short on funds | Open SJ-2026-00120, **Charges**. | Amber banner "**Short on funds**: Customs duty of ₱18,400.00 due 30 Sep. Funds on hand cover ₱10,000.00. Short by ₱8,400.00. Free storage ends in 2 days, so storage fees start in 2 days." The job header shows a **Short on funds** chip. Client funds: Money in ₱106,000.00, Money spent ₱96,000.00, Left over ₱10,000.00; meter at 91% in amber; note "The final balance is worked out after delivery." Ledger rows: 18 Sep +₱106,000.00 (deposit-slip.pdf, balance ₱106,000.00); 20 Sep −₱96,000.00 Ocean freight (freight-invoice.pdf, balance ₱10,000.00); 30 Sep "Customs duty (not paid yet)" with a **Due in 2 days** tag. | |
| MGR-20 | Happy | Add funds and clear the warning | 1. Click **Add funds received** (banner or panel).<br>2. Date `28 Sep 2026`, amount `10000`, method **Bank transfer**, reference `BT-999001`, attach a deposit slip.<br>3. **Save deposit**. | Message "₱10,000.00 added to client funds." Ledger shows the new deposit with your file name and reference. Left over becomes ₱20,000.00. The banner **and** the header chip disappear. On the Dashboard, "Jobs short on funds" now says "Every job has enough funds for its upcoming payments." and the card reads 0. The jobs list no longer flags the job. History shows "Funds received" by Grace Tan (Manager). | |
| MGR-21 | Wrong | Bad deposit details | Open **Add funds received**. Enter date `nonsense` and leave the amount empty, submit. Then enter date `28 Sep 2026` with amount `0` and submit. | Errors under the fields: "**Enter the date like 28 Sep 2026.**" and "**Enter an amount greater than zero.**" Nothing is saved. | |
| MGR-22 | Edge | Deposit that exactly covers the gap | (**Refresh first**) On SJ-2026-00120 add exactly **8400**. | Left over ₱18,400.00 equals the duty, so the warning clears. | |
| MGR-23 | Edge | Deposit that only partly covers the gap | (**Refresh first**) Add **5000**. | Banner still shows, now "Funds on hand cover ₱15,000.00. Short by ₱3,400.00." | |
| MGR-24 | Happy | A new payment creates a new gap | (**Refresh first**) On SJ-2026-00088 **Charges** (empty state "No money recorded for this job yet"), **Add charge**: description `Customs duty`, category **Duties & Taxes**, type **Reimbursable**, amount `20000`, quoted **Yes**, payment **Not paid yet**, date `30 Sep 2026`. | Message "Charge added." Banner: "Customs duty of ₱20,000.00 due 30 Sep. Funds on hand cover ₱0.00. Short by ₱20,000.00." (no storage sentence, the job is still at sea). Header chip and the dashboard list now include SJ-2026-00088. Ledger "Coming up" row shows the duty. | |
| MGR-25 | Wrong | Bad charge details | In **Add charge** leave the amount empty, then enter a reimbursable charge with date `tomorrow`. | "**Enter an amount greater than zero.**" and "**Enter the date like 28 Sep 2026.**" No charge is added. | |
| MGR-26 | Edge | Our own service fee | Add a charge, type **Service fee**, amount `3500`, markup `9999`. | Row shows type "Service fee" and payment "**Billed to client**". Markup is ignored for service fees. Service fees total goes up by ₱3,500.00. It does not appear in the ledger (only pass-through costs do). | |
| MGR-27 | Happy | Unquoted charge: client approves | (**Refresh first**) Open SJ-2026-00070, **Charges**. Read, then click **Client approved** on "Extra storage fee". | Before: a **Needs client approval** panel with "Extra storage fee, Not in quotation, ₱6,800.00, Paid 27 Sep". After: message "Extra storage fee marked client approved." The panel disappears and the charge shows a green **Client approved** tag with "Client approved by Grace Tan, 28 Sep 2026 ...". The checklist line "Extra charges resolved" turns **Done**. History shows "Extra charge approved by client" by Grace Tan (Manager). | |
| MGR-28 | Happy | Unquoted charge: Top1Movers absorbs it (**Refresh first**) | On SJ-2026-00070 click **Absorb cost** on "Extra storage fee", enter reason `Caused by our late truck booking`, **Absorb cost**. | Message "Extra storage fee absorbed by Top1Movers." Money spent falls from ₱145,700.00 to **₱138,900.00**. Final balance becomes **Refund due to client: ₱17,600.00**. Cost & margin shows Margin **−₱3,300.00** "after ₱6,800.00 absorbed". The charge row reads "Absorbed by Top1Movers" with the reason. History shows "Extra charge absorbed" with the reason. | |
| MGR-29 | Wrong | Absorb with no reason | Click **Absorb cost**, leave the reason empty, submit. | "**A reason is required to absorb a cost.**" Charge stays unresolved. | |
| MGR-30 | Happy | Full route to Billing Ready (**Refresh first**) | On SJ-2026-00070: 1) **Tasks**: Complete "Return empty container". 2) **Charges**: click **Client approved** (MGR-27). 3) Read the checklist. 4) Click **Mark Ready for Finance**. | Before step 4 the checklist shows all six lines **Done** and the pill **Ready for Finance**. Message "SJ-2026-00070 is billing ready — handed to Finance." Status becomes **Billing Ready**. A **Billing Summary** panel (with a "Mock document" tag) appears on the Charges tab and the Mark Ready button is gone. Dashboard Billing ready becomes **3**. | |
| MGR-31 | Wrong | Not ready until every checkpoint passes | Open SJ-2026-00120 **Charges**, read the checklist. | Pill "**Not ready**". "All milestones complete" and "Delivery confirmed with POD" are **Pending**. No **Mark Ready for Finance** button. | |
| MGR-32 | Happy | Close a finished job | Open SJ-2026-00060 (Billing Ready), **Update status**, confirm **Closed**. | Status **Closed**; the **Update status** button no longer appears. The customer tracking page still reads **Delivered**. | |
| MGR-33 | Happy | Regression of Dispatcher powers | Repeat DSP-11, DSP-14, DSP-17 and DSP-40 to DSP-47 as Manager. | Same results. (DSP-47 also shows the **Review** button for the Manager.) | |
| MGR-34 | Access | Users and Roles is closed | Go to `#/users`. | "Not available for Manager". | |

---

## 8. Admin's point of view (ADM)

**Sign in as Admin (Mark Villar).** The Admin can do everything the Manager can (ADM-16) plus manage people. Refresh first.

### 8.1 People and roles

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| ADM-01 | Access | Admin sees every menu item | Read the sidebar. | My Tasks is absent (Admin is not a field role); Dashboard, Customers, Inquiries & Quotations, Shipment Jobs, **Users & Roles**, **Audit Trail** are present. | |
| ADM-02 | Happy | Read the user list | Open **Users & Roles**. | Seven people: Ana Cruz (Manila Ops, Dispatcher), Ben Santos (Warehouse, Warehouse Crew), Cathy Lim (Manila Ops, Dispatcher), Rico Domingo (Warehouse, Warehouse Crew), Grace Tan (Management, Manager), Paolo Reyes (Finance, Finance), Mark Villar (Management, Admin). All **Active**. | |
| ADM-03 | Happy | Deactivate one person, the colleague covers | 1. Turn the switch off for **Ben Santos**.<br>2. Sign out and open the account picker. | Message "Ben Santos is now inactive." and the switch label reads **Inactive**. The **Warehouse Crew** row now offers **Rico Domingo** and signing in as Warehouse Crew lands as Rico. | |
| ADM-04 | Wrong | Deactivate everyone in a role | 1. Turn off both **Ben Santos** and **Rico Domingo**.<br>2. Sign out and open the account picker.<br>3. Click the Warehouse Crew row. | The row is greyed out and reads "**Warehouse Crew · Deactivated**". It cannot be clicked. (If forced, the message is "That account is deactivated. Ask an Admin to reactivate it.") You cannot sign in as that role. | |
| ADM-05 | Happy | Reactivate | As Admin turn **Rico Domingo** back on. Sign out and check the picker. | Message "Rico Domingo is now active." The Warehouse Crew row is clickable again. | |
| ADM-06 | Wrong | Cannot deactivate the last Admin | Turn off **Mark Villar**. | Message "**There must be at least one active Admin.**" The switch springs back to Active. | |
| ADM-07 | Edge | Deactivating yourself | 1. **Add user** `Tess Admin`, role **Admin**.<br>2. Turn off **Mark Villar** (yourself). | Message "You deactivated your own account, so you were signed out." You land on the sign-in screen. The Admin row in the picker now offers Tess Admin. | |
| ADM-08 | Happy | Add a user | **Add user**: name `Nina Lopez`, department `Finance`, role **Finance**. | Message "Nina Lopez added." A new active row appears with that department and role. | |
| ADM-09 | Wrong | Add a user with bad details | 1. Submit with the name empty.<br>2. Enter `grace tan` (any capitals) and submit. | "**Enter the user's name.**" then "**grace tan already exists.**" (duplicates are caught regardless of capitals). No user added. | |
| ADM-10 | Access | The permission matrix matches the rules | Read **Permission matrix** (11 modules by 5 roles, tagged "Illustrative"). | Ticks exactly as in section 3.2: Dispatcher = Customer Mgmt, Inquiry & Quotation, Shipment Job, Milestones & Tasks, Document Mgmt, Exceptions & Approval, Dashboard & Reports. Warehouse Crew = Shipment Job, Milestones & Tasks, Document Mgmt, Exceptions & Approval, Delivery & POD. Manager = all except User & Role Mgmt. Admin = all. Finance = Shipment Job, Charges & Billing, Dashboard & Reports, Audit Trail. | |

### 8.2 Audit trail

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| ADM-11 | Happy | Presets | Open **Audit Trail**. Open the date picker and click each preset. | **All time 66**, **Today 1** (SJ-2026-00101 Billing ready, by System), **Last 7 days 18**, **Last 30 days 64**, **This month 62**. The header line says "N events in range." and the button label shows the range. | |
| ADM-12 | Happy | Custom date range | 1. Open the picker, stay on September 2026.<br>2. Click **10**, then **12**.<br>3. Click **Done**. | Label "Sep 10, 2026 – Sep 12, 2026" and **9 events** in range. Days between the two clicks are highlighted. **Clear** returns to All time. | |
| ADM-13 | Wrong | Range with no events | Pick **29** then **30** September. | Table says "**No audit events in this range.**" and the header says "0 events in range." | |
| ADM-14 | Edge | Paging | On All time, read the pager. Click **Next**, then **Previous**. | "Page 1 of 3" with 25 rows per page. **Previous** is disabled on page 1, **Next** is disabled on page 3. | |
| ADM-15 | Happy | The log records the real person | 1. Move SJ-2026-00088 to Arrived at Port.<br>2. Open **Audit Trail** (All time) and make sure you are on **page 1** (the page number is remembered while you stay signed in). | The top row is "Status changed" for SJ-2026-00088 with actor "**Mark Villar (Admin)**". Newest entries come first. Entries show timestamp, actor, action, entity and detail. | |
| ADM-16 | Happy | Admin regression of Manager powers | Repeat MGR-05, MGR-11, MGR-20, MGR-28, MGR-30 and MGR-32 as Admin. | Same results, with audit actor "Mark Villar (Admin)". | |

---

## 9. Finance's point of view (FIN)

**Sign in as Finance (Paolo Reyes).** Finance receives finished jobs and checks the money. Finance can look at everything money-related but cannot change anything. Refresh first.

### 9.1 Access and read-only behaviour

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| FIN-01 | Access | Menu and tabs | Read the sidebar, then open any job. | Sidebar: Dashboard, Shipment Jobs, Audit Trail. Job tabs: **Overview** and **Charges** only. | |
| FIN-02 | Access | Nothing can be changed | 1. Open SJ-2026-00120 (Overview).<br>2. Open its **Charges** tab. | Overview has **no Update status** button and **no Advance customs stage** button. Charges shows "**View only**" beside Client funds and has **no** Add funds received, Add charge, or Mark Ready buttons. | |
| FIN-03 | Access | Unquoted charge shows who must act | Open SJ-2026-00070 **Charges**. | In "Needs client approval" the action cell reads "**Waiting on a Manager or Admin**" with no buttons. | |
| FIN-04 | Wrong | Other areas are closed | Go to `#/customers`, `#/users`, `#/inquiries`, then `#/jobs/SJ-2026-00120/tasks`. | The first three say "Not available for Finance". The last just shows the Overview. | |
| FIN-05 | Access | Search and menus | 1. Press Ctrl+K, type `sample`.<br>2. On the jobs list click **⋮** on a row. | Search lists jobs only, **no customers**. The row menu offers only **Open charges**. | |
| FIN-06 | Happy | Dashboard for Finance | Open **Dashboard**. | Same six cards as the Manager (Active jobs 11 ... Jobs short on funds 1) and the same panels including Cost & margin and Jobs short on funds. | |

### 9.2 The five money scenarios

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| FIN-07 | Happy | **Refund due**: SJ-2026-00060 | Open its **Charges** tab. | Money in **₱175,000.00**, Money spent **₱150,400.00**, Left over **₱24,600.00**. Final balance (blue): "**Refund due to client: ₱16,100.00**. Money in ₱175,000.00, less money spent ₱150,400.00 and our fees ₱8,500.00 (service fees ₱3,500.00 + markup ₱5,000.00)." Ledger in date order with running balance: 08 Sep +₱100,000.00 (₱100,000.00), 11 Sep +₱75,000.00 (₱175,000.00), 12 Sep −₱132,000.00 Ocean freight (₱43,000.00), 15 Sep −₱18,400.00 Customs duty (₱24,600.00). In **Charges & expenses** the Ocean freight line reads "(+₱5,000.00 markup)". No warning banner. | |
| FIN-08 | Happy | **Balance owed**: SJ-2026-00101 | Open **Charges**. | Money in ₱140,000.00, Money spent ₱150,400.00, Left over **−₱10,400.00** (red) with "Top1Movers has advanced ₱10,400.00". Final balance (amber): "**Balance to bill client: ₱13,900.00**". Ledger balances: ₱135,000.00, ₱3,000.00, ₱8,000.00, then **−₱10,400.00**. Charges total ₱153,900.00 and quoted amount **₱174,500.00** with pill "Within quote". | |
| FIN-09 | Happy | **Fully settled**: SJ-2026-00050 | Open **Charges**. | Final balance (green) "**Fully settled**". Money in ₱104,700.00, spent ₱102,200.00, left over ₱2,500.00, which exactly equals our fees ₱2,500.00. The ledger's last running balance is ₱2,500.00. | |
| FIN-10 | Happy | **Short on funds**: SJ-2026-00120 | Open **Charges**. | Same banner, figures and chip as MGR-19, but read-only. | |
| FIN-11 | Happy | **Missing receipt and surprise charge**: SJ-2026-00070 | Open **Charges**. | Ledger row for Port handling fee (24 Sep, −₱2,400.00) shows a **Receipt missing** tag; the same tag is in the charges table. Extra storage fee (27 Sep, −₱6,800.00) shows **Not in quotation**. Final balance "Refund due to client: ₱10,800.00" with "**Not final yet: an extra charge still needs client approval.**" Money in ₱160,000.00, spent ₱145,700.00, left over ₱14,300.00. | |
| FIN-12 | Happy | Margin is on our fees, not pass-through costs | On SJ-2026-00060 read **Cost & margin**. | Quoted amount ₱101,667.00 (with note "No quotation on record ... estimated from the declared value, illustrative only"), Reimbursable costs ₱150,400.00 "pass-through", Service fees ₱8,500.00 "incl. ₱5,000.00 markup", Margin **₱8,500.00**, Margin % **5.3%**, pill "Over quote". The line "Margin = our service fees + any markup (less any cost we absorb). Pass-through costs are billed back at cost, so they are not margin. Margin % is of the total billed to the client." is on screen. Bars by category: Freight 86%, Duties & Taxes 12%, Fees 2%. | |
| FIN-13 | Happy | Charges table splits the two kinds of cost | On SJ-2026-00060 read **Charges & expenses**. | Columns Description, Category, Type, Payment, Evidence, Amount. Type shows "Reimbursable" or "Service fee". Sub-totals "Reimbursable costs (pass-through) ₱150,400.00", "Service fees ₱3,500.00", "Markup ₱5,000.00", then "**Total billed to client ₱158,900.00**". | |

### 9.3 Billing summary (the Finance handoff)

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| FIN-14 | Happy | Open the summary | On SJ-2026-00060 **Charges**, click **Open Billing Summary**. | Page titled "**Billing Summary**" with a dashed "**Mock document**" tag, job number, issue date 28 Sep 2026, customer and shipment blocks. Charges table with Type column. Split lines: Reimbursable costs ₱150,400.00, Service fees ₱3,500.00, Markup ₱5,000.00, Total billed to client ₱158,900.00, Quoted amount ₱101,667.00, Margin ₱8,500.00 (5.3%). **Client funds**: Money in ₱175,000.00, Money spent ₱150,400.00, Left over ₱24,600.00, Our fees ₱8,500.00, **Refund due to client ₱16,100.00**. Footer says it is not a client invoice or an accounting record. The word "Invoice" is never used as the document's title. | |
| FIN-15 | Happy | Print or export | Click **Print / Export**. | The browser's print preview shows **only** the document: no sidebar, top bar or buttons. | |
| FIN-16 | Happy | The pre-built PDF for SJ-2026-00101 | Open SJ-2026-00101's Billing Summary. Click **Download PDF**. | The button reads **Download PDF** and serves the pre-built sample PDF (titled "Billing Summary"). Its charges (Ocean freight ₱132,000.00, Customs duty ₱18,400.00, Documentation fee ₱3,500.00) and quote ₱174,500.00 match the screens. **Known difference (KL-02):** the PDF shows margin as ₱20,600.00 (11.8%), the old quote-minus-charges way, while the screen shows ₱3,500.00 (2.3%). The on-screen funds block reads "**Balance to bill client** ₱13,900.00". | |
| FIN-17 | Edge | Summary of a job not yet Billing Ready | Open `#/jobs/SJ-2026-00120/billing-summary` directly. | The page still renders (it is read-only), showing the unpaid duty in the charges table. The Charges tab does not offer the summary link for a job that is not yet Billing Ready. | |
| FIN-18 | Wrong | Summary of a job with no charges | Open `#/jobs/SJ-2026-00088/billing-summary`. | "No charges recorded." in the table and zero amounts. No crash. | |

### 9.4 Audit

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| FIN-19 | Happy | Finance can follow the money trail | Open **Audit Trail**, All time. | "Funds received" entries by "Grace Tan (Manager)" are present for jobs with deposits (for example SJ-2026-00120, ₱106,000.00, ref BT-780043). | |

---

## 10. Customer's point of view: shipment tracking (CUS)

No sign-in. Open the page, click **Track a shipment** on the sign-in screen (or use `#/track` after the file name). Use a phone-sized window for at least CUS-13.

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| CUS-01 | Happy | Track by job number | Enter `SJ-2026-00120`, click **Track shipment**. | Navy hero: "Shipment SJ-2026-00120", headline **Customs clearance**, pill **On track**, "Estimated arrival to be confirmed", route line Ningbo, CN to Davao, PH "via Batangas, PH" with the marker about two-thirds along. Journey timeline: Booked, Preparing documents, On the water, Arrived at port completed; **Customs clearance** current with "Customs stage: Payment Pending."; Out for delivery and Delivered greyed. Details panel shows cargo, vessel, container, BL, consignee. Contact panel names **Cathy Lim** and quotes the job number. | |
| CUS-02 | Happy | Track by BL and by container | 1. Enter `bl-2026-04520` (lower case).<br>2. Then enter ` TMWU-118899-2 ` (with spaces). | Both open the same shipment. Capitals and spaces do not matter. | |
| CUS-03 | Wrong | Number not found | Enter `nope-123`. | Red message "**We could not find a shipment for "nope-123". Check the number and try again.**" The box keeps what you typed. | |
| CUS-04 | Wrong | Empty search | Click **Track shipment** with the box empty. | "**Enter a job, BL or container number.**" | |
| CUS-05 | Wrong | A bad address | Go to `#/track/SJ-2026-99999`. | "We could not find that shipment" with a **Try another number** button. | |
| CUS-06 | Happy | Every stage reads in plain words | Track each job. | **00110:** Booked. **00095:** Preparing documents. **00088:** On the water ("Your cargo is at sea aboard ONE Busan."). **00082:** Arrived at port. **00120, 00130, 00065:** Customs clearance. **00077:** Out for delivery ("On its way to Pasig, PH.", ETA 30 Sep 2026). **00070, 00060, 00050, 00101:** Delivered. No internal status names (Billing Ready, Closed, Exception Hold) ever appear. | |
| CUS-07 | Wrong | Customs inspection | Track `SJ-2026-00130`. | Pill **Delayed**, amber step, and the notice "**Customs inspection in progress**: the Bureau of Customs has selected this shipment for a check. Our team is handling it and will contact you if anything is needed from you." The internal note about "physical examination at the container yard" is **not** shown. | |
| CUS-08 | Wrong | A held shipment and a payment waiting on the client | Track `SJ-2026-00065`. | Notice "**Your shipment is delayed**: our team is resolving an issue and will contact you." **and** a blue "**Action needed from you**: customs duties are waiting to be paid ... contact your coordinator." The exception details (HS code) are **not** shown. | |
| CUS-09 | Happy | Delivered shipment | Track `SJ-2026-00060`. | Headline **Delivered**, pill **Delivered**, "Delivered 20 Sep 2026", route marker at the end with a tick, all seven steps completed, last step "Delivered on 20 Sep 2026". A **Delivery** panel shows date, received by "R. Aquino (Site Lead)", and a "Proof of delivery" file row with a **View** button. | |
| CUS-10 | Wrong | Delivered with damage | (After MGR-18 or WHC-09 in the same session) track `SJ-2026-00077`. | The Delivery panel adds "**Damage or incomplete delivery reported**: our team will contact you about next steps." | |
| CUS-11 | Access | Nothing internal leaks | On at least three shipments use the browser's find (Ctrl+F) for `₱`, `fund`, `margin`, `quotation`, `Overdue`, `Reassign`, `audit`, staff names other than the coordinator. | None found. No sidebar, top bar, staff menu or staff back link is shown, even if you are signed in as staff. | |
| CUS-12 | Edge | Estimated arrival is not a real date | Track `SJ-2026-00120` and `SJ-2026-00130`. | Where the internal note is not a date ("Awaiting payment", "On hold, under inspection"), the page says "Estimated arrival **to be confirmed**", never the internal wording. | |
| CUS-13 | Happy | Phone width | Narrow the window to 400 px. | Single column, timeline readable, route line still fits, no sideways scrolling of the page. | |
| CUS-14 | Happy | Staff changes show up | Signed in as staff, move SJ-2026-00088 forward, then open its **Client tracking page**. | Headline reflects the new stage. | |

---

## 11. End-to-end journeys (E2E)

These follow one shipment across several people, the way the business really runs. Run each journey on **one page load** (Refresh first), and switch person with the avatar menu, **Demo: switch role**. Data carries across role switches. Each step has a checkpoint; a journey passes only if every checkpoint is true. Fill the **Result** for the whole journey in the last row.

### E2E-01 Happy path: from first inquiry to money settled, with the customer watching

| Step | Who | Do this | Checkpoint | 
|---|---|---|---|
| 1 | Dispatcher (Ana) | Open **INQ-2026-0043** (New). Click **Create quotation**. | Quotation **QT-2026-0044** at ₱150,000.00, status Pending customer approval. Inquiry now **Quoted**. |
| 2 | Dispatcher | **Record customer approval / conforme** as `Liza Fernandez`, then **Convert to Shipment Job**, then **Create Shipment Job**. | Job **SJ-2026-00123** exists for Pacific Rim, status **Booked**, five documents **Missing**. |
| 3 | Customer | Open the customer tracking page and enter `SJ-2026-00123`. | Headline **Booked**, "Your booking is confirmed.", "Estimated arrival to be confirmed". |
| 4 | Dispatcher | **Documents** tab: **Upload** each of the five documents, then **Review**, **Approve** each. On **Tasks**, complete "Verify shipment documents complete" with a file. | All five **Approved**. Dashboard "Missing / rejected docs" back to 5 for Ana. |
| 5 | Dispatcher | **Update status** three times: **Documentation**, **Sailed**, **Arrived at Port**. | Customer page after **Sailed** reads "On the water", after **Arrived at Port** reads "Arrived at port". |
| 6 | Dispatcher | **Update status** to **Customs Clearance**. In the Customs panel click **Advance customs stage** six times: Lodged, Assessment Pending, Payment Pending (choose **Top1Movers**), Payment Completed, Release Pending, Released. | Panel track ends at **Released**. Customer page shows "Customs stage:" moving along and never shows the "Delayed" tag. |
| 7 | Dispatcher | Complete tasks "Lodge customs entry" and "Pay duties and assessment" (files needed), "Secure delivery order" and "Book delivery truck". Then **Update status** to **Out for Delivery**. | Job is Out for Delivery. **Delivered** cannot be picked from the list (gate note). |
| 8 | Warehouse Crew (Ben) | **My Tasks**, **Confirm + POD** on SJ-2026-00123 with receiver `J. Ramos` and a file. Then complete "Deliver to consignee" (file) and "Return empty container". | Message "Delivery confirmed in full." Job **Delivered**. Customer page shows **Delivered**, the delivery panel and proof of delivery. |
| 9 | Manager (Grace) | **Charges**, **Add funds received** `200000`. **Add charge**: `Ocean freight` Freight Reimbursable 120000 paid, `Customs duty` Duties & Taxes Reimbursable 25000 paid, `Documentation fee` Fees Service fee 3500. Attach a file to each paid charge. | Money in ₱200,000.00, Money spent ₱145,000.00, Left over ₱55,000.00. Final balance "**Refund due to client: ₱51,500.00**". Cost & margin: quoted ₱150,000.00, margin ₱3,500.00, 2.4%, "Within quote". No receipt-missing tags. All six checklist lines **Done**. |
| 10 | Manager | Click **Mark Ready for Finance**. | Message "SJ-2026-00123 is billing ready — handed to Finance." Status **Billing Ready**. |
| 11 | Finance (Paolo) | Open the job's **Charges**, then **Open Billing Summary**. | Summary shows "Mock document", the split (Reimbursable ₱145,000.00, Service fees ₱3,500.00), Money in/spent/left over and **Refund due to client ₱51,500.00**. Every control is read-only. |
| 12 | Manager | **Update status** to **Closed**. | Status Closed. Customer page still says Delivered. |
| 13 | Admin (Mark) | **Audit Trail**, All time. Find entries for SJ-2026-00123. | Entries in time order from "Job created" (Ana Cruz) through document, status, customs, task, delivery (Ben Santos), funds and charge (Grace Tan), billing ready and close entries. Each actor is the real person who did it, with their role in brackets. |
| **Result** | | | |

### E2E-02 Something went wrong: a shipment in trouble, then recovered (SJ-2026-00065)

| Step | Who | Do this | Checkpoint |
|---|---|---|---|
| 1 | Customer | Track `SJ-2026-00065`. | "Your shipment is delayed" **and** "Action needed from you" (duties waiting on the client). No exception details. |
| 2 | Dispatcher | Open the job. Try **Update status**. | Blocked: "This job is on hold". No **Review** button on the exception. |
| 3 | Manager | **Exceptions**, **Review**, task `Re-issue commercial invoice with matching HS code` owner Cathy Lim, **Approve & assign**. | Hold released, status Customs Clearance. Dashboard Open exceptions 0. |
| 4 | Manager | **Charges**: **Add funds received** `30000` (the client released funds). **Add charge** `Customs duty`, Duties & Taxes, Reimbursable, 25000, Quoted Yes, **Not paid yet**, due `30 Sep 2026`. | No shortfall banner (Left over ₱30,000.00 covers ₱25,000.00). |
| 5 | Dispatcher | Tasks: complete the corrective task (file needed) and "Pay duties and assessment" (file needed). **Advance customs stage** to **Payment Completed**. | Customs panel moves on. |
| 6 | Customer | Reload `SJ-2026-00065`. | "Your shipment is delayed" and "Action needed from you" are **gone**; timeline shows "Customs stage: Payment Completed." Pill On track. |
| **Result** | | | |

### E2E-03 Something went wrong: a surprise charge on a delivered job (SJ-2026-00070)

| Step | Who | Do this | Checkpoint |
|---|---|---|---|
| 1 | Finance | Open the job's **Charges**. | "Needs client approval: Extra storage fee ₱6,800.00" with "Waiting on a Manager or Admin". Refund shown as **provisional** (₱10,800.00, "Not final yet"). Port handling fee shows **Receipt missing**. |
| 2 | Dispatcher | Open the same job. | No charges tab, no amounts, no funds wording. |
| 3 | Manager | Complete "Return empty container". On Charges, **Absorb cost** with the reason `Caused by our late truck booking`. | Money spent ₱138,900.00; refund **₱17,600.00**; margin **−₱3,300.00**; checklist all **Done**. |
| 4 | Manager | **Mark Ready for Finance**. | Billing Ready. |
| 5 | Finance | Open the Billing Summary. | The Extra storage fee row is labelled "absorbed by Top1Movers, not billed". Split: Reimbursable costs ₱138,900.00, Service fees ₱3,500.00, Absorbed by Top1Movers ₱6,800.00, Total billed to client ₱142,400.00, Margin −₱3,300.00 (-2.3%). Client funds: Money in ₱160,000.00, Money spent ₱138,900.00, Left over ₱21,100.00, Our fees ₱3,500.00, **Refund due to client ₱17,600.00**. The Port handling fee is still flagged **Receipt missing** on the Charges tab (the mockup has no edit). |
| 6 | Admin | Audit Trail. | "Extra charge absorbed" with the reason and actor Grace Tan (Manager); a second person can read it. |
| **Result** | | | |

### E2E-04 Something went wrong: short on funds, then covered (SJ-2026-00120)

| Step | Who | Do this | Checkpoint |
|---|---|---|---|
| 1 | Manager | Read the Dashboard. | "Jobs short on funds 1"; list row for SJ-2026-00120, short by ₱8,400.00, "Fees start in 2 days". |
| 2 | Finance | Open the job. | Chip **Short on funds** and the amber banner, read-only. |
| 3 | Manager | **Add funds received** `10000`. | Banner and chip vanish; dashboard card 0. |
| 4 | Dispatcher | Complete "Pay duties and assessment" (file needed). Advance customs to **Payment Completed**. | Job list still flags "Free storage: 2d left" (a separate clock). |
| 5 | Customer | Track the job. | "Customs stage: Payment Completed." |
| **Result** | | | |

### E2E-05 Something went wrong: damaged delivery blocks the handoff (SJ-2026-00077)

| Step | Who | Do this | Checkpoint |
|---|---|---|---|
| 1 | Warehouse Crew (Ben) | **Confirm + POD** on SJ-2026-00077, damage **on**, description `Two pallets crushed`. | Delivered with a red damage box. |
| 2 | Customer | Track the job. | Delivered, with "Damage or incomplete delivery reported ... our team will contact you". |
| 3 | Manager | Open **Charges**. | "Delivery confirmed with POD" is **Pending**, so the job cannot be marked ready. No Billing Summary panel. |
| 4 | Finance | Open the job. | Nothing to bill yet; Charges tab shows no billing summary link. |
| **Result** | | | |

### E2E-06 Something went wrong: a person leaves, work is handed on

| Step | Who | Do this | Checkpoint |
|---|---|---|---|
| 1 | Admin | Turn off **Cathy Lim** in Users & Roles. | Message "Cathy Lim is now inactive." and the switch reads **Inactive**. (The account picker still offers Ana Cruz for Dispatcher, as before.) |
| 2 | Manager | On SJ-2026-00082 **Tasks**, **Reassign** "Lodge customs entry" from Cathy Lim to **Ana Cruz**, due `30 Sep 2026`. | Row shows Ana Cruz; History logs "Task reassigned". The row still reads **Overdue** (KL-03). |
| 3 | Dispatcher (Ana) | **My Tasks** now includes the SJ-2026-00082 tasks. Complete "Lodge customs entry" with a file. | Dashboard Overdue tasks becomes **0**. |
| 4 | Admin | Turn Cathy Lim back on. | "Cathy Lim is now active." |
| **Result** | | | |

---

## 12. Cross-cutting checks (XC)

| ID | Type | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|---|
| XC-01 | Happy | Layout at four screen widths | For **sign-in, Dashboard, a job's Charges tab, Billing Summary and the tracking page**, test at 1440, 1024, 768 and 400 px wide. | No sideways scrolling of the page, no clipped or overlapping text. At 960 px and below the sidebar shrinks to an icon rail; below 640 px it becomes a bottom bar. Wide tables scroll inside their own box. | |
| XC-02 | Access | Keyboard only | Using only Tab, Shift+Tab, Enter and Space: sign in, open a job, open a drawer, close it. | Every control is reachable in a sensible order, focus is always visible, and no step needs a mouse. | |
| XC-03 | Access | Reduced motion | Turn on "reduce motion" in your operating system, reload, open SJ-2026-00120 Charges and a tracking page. | The warning banner, ledger rows, route line and timeline do not animate. | |
| XC-04 | Access | Status is never colour alone | Scan status tags (job status, task, document, funds, customer timeline). | Every status has an icon **and** a word next to its colour. Negative amounts also carry a minus sign. | |
| XC-05 | Happy | Everything mock is labelled | Look at Dashboard, Billing Summary, Charges footnote, tracking page footer, sign-in. | Illustrative or mock wording is visible ("Illustrative data", "Mock document", "Mockup only"). No real company, person or price appears. The Billing Summary is never titled an invoice. | |
| XC-06 | Happy | Every change leaves an audit entry | Perform each action in the table below on any suitable job, then read the job's **Status history** (or Audit Trail). | One entry per action, with the wording below and the real signed-in person as "Name (Role)". | |
| XC-07 | Wrong | No script errors | Open the browser developer tools console and run a long session (any journey in section 11). | No red errors. No browser pop-up dialogs (alert, confirm) ever appear. | |
| XC-08 | Happy | Messages behave | Trigger a success and an error message. | Messages appear bottom-right, are readable, and disappear after a few seconds without blocking anything. | |
| XC-09 | Edge | Refresh restores the sample data | After changing things, refresh and sign in again. | All original sample data is back. (This is expected; nothing is saved.) | |

**Audit wording to expect (XC-06):**

| Action | Entry | 
|---|---|
| Convert quotation | "Job created: Converted from INQ-… / QT-… — no re-keying required." |
| Move stage | "Status changed: Moved to *stage*." |
| Override | "Status override: Forced to *stage*. Reason: …" |
| Advance customs | "Customs stage advanced: Moved to *stage*." |
| Lane, hold, clear | "Customs lane set", "Customs hold placed", "Customs hold cleared" |
| Complete task, reassign | "Task completed", "Task reassigned: *task* → *owner* (due *date*)." |
| Documents | "Document uploaded", "Document approved", "Document rejected: *reason*" |
| Exceptions | "Exception raised", "Exception approved" (with owner), "Exception rejected" |
| Delivery | "Delivery confirmed: Delivered in full with POD." or "Delivered with reported damage." |
| Funds | "Funds received: ₱… received by *method* (ref …)." |
| Charges | "Charge recorded", "Extra charge approved by client", "Extra charge absorbed" (with reason) |
| Billing | "Billing ready: Checklist complete — handed to Finance." |

---

## 13. Data sanity checks (DAT)

Sample data must make sense. Check these against the screens.

| ID | Type | Check | Expected |
|---|---|---|---|
| DAT-01 | Happy | SJ-2026-00101 matches its PDF | Charges ₱132,000.00, ₱18,400.00, ₱3,500.00 (total ₱153,900.00); quotation ₱174,500.00 (QT-2026-0041 v3). |
| DAT-02 | Happy | The five money jobs add up | See table below. |
| DAT-03 | Happy | Dashboard counts equal their lists | Each card equals the number of rows in its table (overdue 1, missing/rejected 7, exceptions 1, short on funds 1). The status ring total equals the number of jobs (12; 11 active plus 1 closed). |
| DAT-04 | Happy | Task owners fit the role | Dispatcher owns commercial and customs tasks: Verify shipment documents complete, Lodge customs entry, Pay duties and assessment, Secure delivery order, Book delivery truck. Warehouse Crew own physical tasks: Deliver to consignee, Return empty container. The dispatcher owning a job's tasks is the dispatcher of that customer. |
| DAT-05 | Happy | No customer contact shares a name with staff | Customer contacts (Ana Reyes, Marco Villanueva, Liza Fernandez, Ramon Cruz, Gloria Tan) differ from staff names (Ana Cruz, Cathy Lim, Grace Tan and so on). |
| DAT-06 | Happy | Dates are believable | No job has activity before it was created. Audit history for each job starts with "Job created". Deposits and payments fall between job creation and today (28 Sep 2026). Completed jobs show delivery dates before their billing-ready date. |
| DAT-07 | Happy | IDs are unique and tidy | Jobs SJ-2026-000NN, inquiries INQ-2026-00NN, quotations QT-2026-00NN. BL and container numbers are different on every job. |
| DAT-08 | Happy | Every role has an active person | Each of the five roles is offered on the account picker. |

**DAT-02 figures**

| Job | Money in | Money spent | Left over | Our fees | Final balance |
|---|---|---|---|---|---|
| SJ-2026-00060 | ₱175,000.00 | ₱150,400.00 | ₱24,600.00 | ₱8,500.00 (₱3,500.00 fee + ₱5,000.00 markup) | Refund due to client ₱16,100.00 |
| SJ-2026-00101 | ₱140,000.00 | ₱150,400.00 | −₱10,400.00 | ₱3,500.00 | Balance to bill client ₱13,900.00 |
| SJ-2026-00050 | ₱104,700.00 | ₱102,200.00 | ₱2,500.00 | ₱2,500.00 | Fully settled |
| SJ-2026-00070 | ₱160,000.00 | ₱145,700.00 | ₱14,300.00 | ₱3,500.00 | Refund due ₱10,800.00 (provisional) |
| SJ-2026-00120 | ₱106,000.00 | ₱96,000.00 | ₱10,000.00 | none yet | Not worked out before delivery; short by ₱8,400.00 for the ₱18,400.00 duty |

---

## 14. Feature coverage matrix

Every feature in the mockup and where it is tested.

| Feature | Test cases |
|---|---|
| Sign-in, account chooser, sign-out | ACC-01, 04, 05, ADM-03 to 07 |
| Menus and page access by role | ACC-02, 03, 11, DSP-32, WHC-02 to 04, 16, 17, MGR-34, FIN-01 to 04 |
| Global search | ACC-06 to 08, FIN-05 |
| Notifications | ACC-09 |
| Demo role switch | ACC-10, 11 |
| Dashboard (all cards and panels) | DSP-02 to 04, MGR-01 to 04, FIN-06, DAT-03 |
| My Tasks | DSP-01, 04, WHC-01, 18 |
| Customers (list, search, detail, create, duplicate) | DSP-05 to 10 |
| Inquiries | DSP-11 to 13, 20 |
| Quotations, versions, approval, conversion | DSP-14 to 19 |
| Job list (search, filter, density, flags) | DSP-21, 22 |
| Job detail and status history | DSP-23 |
| Stage updates and gates | DSP-24 to 27, 49, MGR-11, 12 |
| Customs (sub-stage, lane, hold, payment party) | DSP-28 to 30, MGR-08 to 10 |
| Manager and Admin override | MGR-11 to 13 |
| Tasks (complete, proof, reassign, view proof) | DSP-34 to 39, WHC-11 to 13, MGR-14, 15, E2E-06 |
| Documents (upload, approve, reject, replace) | DSP-40 to 46, WHC-14, E2E-01 |
| Exceptions (raise, approve, reject, hold) | DSP-47 to 49, WHC-15, MGR-05 to 07, E2E-02 |
| Delivery and proof of delivery | WHC-06 to 10, MGR-16 to 18, E2E-01, 05 |
| Client funds and ledger | MGR-19 to 23, FIN-07 to 11, DAT-02 |
| Funding-gap alert and dashboard list | MGR-19 to 24, FIN-10, E2E-04 |
| Charges (reimbursable, service fee, markup) | MGR-24 to 26, FIN-12, 13 |
| Unquoted charge (approve, absorb) | MGR-27 to 29, FIN-03, 11, E2E-03 |
| Cost and margin | MGR-04, FIN-12, E2E-01 |
| Billing checklist, ready, close | MGR-30 to 32, E2E-01 |
| Billing Summary, print, PDF | FIN-14 to 18, E2E-01, 03 |
| Users and roles, permission matrix | ADM-01 to 10, E2E-06 |
| Audit trail (filters, paging, actors) | ADM-11 to 15, FIN-19, XC-06, E2E-01 |
| Customer tracking page | CUS-01 to 14, DSP-50, 51, E2E-01, 02, 04, 05 |
| Layout, keyboard, motion, labelling | XC-01 to 05, WHC-19, CUS-13 |

---

## 15. Defect log

Copy one row per problem.

| Defect ID | Test case | Severity (Critical / Major / Minor) | What you did | What you expected | What happened | Screenshot | Tester | Date | Status |
|---|---|---|---|---|---|---|---|---|---|
| D-001 | | | | | | | | | Open |

---

## 16. Known limitations and open questions

These are **not** failures. They are mockup boundaries or decisions for the stakeholders. Do not log them as defects unless the behaviour differs from what is written here.

| # | Note |
|---|---|
| KL-01 | Nothing is saved. Refreshing restores the sample data. |
| KL-02 | The pre-built PDF for SJ-2026-00101 was not regenerated. It shows margin as quote minus all charges (₱20,600.00, 11.8%), while the screens now use "service fees plus markup" (₱3,500.00, 2.3%). Its file name also contains the word "invoice". The PDF's charges and quote match the screens. Decision needed: regenerate it. |
| KL-03 | Task status (Pending, Due, Overdue) is set when the job is created. **Reassign** changes the owner and date but does not recalculate the status. Moving a job forward does not complete its tasks. |
| KL-04 | A delivery reported with damage has no "resolved" step in the mockup, so billing stays blocked (see MGR-18). Decision needed on the damage-claim process. |
| KL-05 | **View**, **Open** and download buttons on documents, proof of delivery and deposits do not open real files. Uploads keep only the file name. |
| KL-06 | Overdue escalation emails are an illustration; nothing is sent. |
| KL-07 | There is no edit or delete for customers, inquiries, charges or deposits. A new customer gets placeholder city and contact email. |
| KL-08 | The account picker offers one person per role. The second person is reached by deactivating the first (section 2.2). The demo role switch ignores deactivation. |
| KL-09 | A Dispatcher can open **every** job in the Shipment Jobs list; "own jobs only" applies to the Dashboard. Decision needed: should the list be limited too? |
| KL-10 | Any role that can see a job can advance its status or customs stage (except Finance). The permission rules do not say who may. Decision needed. |
| KL-11 | For jobs without a quotation record, the quoted amount is estimated from the declared value divided by 6 and labelled illustrative. |
| KL-12 | The customer tracking page finds shipments by a guessable number. A real system would use a signed, expiring link or require two identifiers. |
| KL-13 | Dashboard captions such as "+2 vs last week" are fixed illustrative text. |
| KL-14 | Entries you create are stamped "28 Sep 2026" with your computer's real clock time. |
| KL-15 | No payment gateway, bank link, tax calculation or accounting ledger exists or is implied. Funds figures are a per-job notebook only. |
| KL-16 | The "Charges" column on the Dashboard's Billing readiness table is recorded charges (without markup); a job's "Total billed to client" includes markup. Both are correct for their labels. |

**Out of scope for this mockup:** real Microsoft sign-in, a backend or database, real email or SMS, file storage, payments, tax, AI features.

---

## 17. Sign-off

| Role tested | Tester name | Date | Cases run | Passed | Failed | Blocked | Comments |
|---|---|---|---|---|---|---|---|
| Dispatcher | | | | | | | |
| Warehouse Crew | | | | | | | |
| Manager | | | | | | | |
| Admin | | | | | | | |
| Finance | | | | | | | |
| Customer | | | | | | | |
| End-to-end | | | | | | | |

**Acceptance rule (proposed):** all Critical and Major cases pass, no open Critical defects, and every Minor defect is logged with an owner.

| Approved by | Name | Signature | Date |
|---|---|---|---|
| Project sponsor | | | |
| Operations lead | | | |
| Finance lead | | | |
