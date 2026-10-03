# T1M Portal mockup: assessment against the client blueprint

Date: 3 Oct 2026 · Build checked: `apps/mockup/index.html` as built from `apps/mockup/src` today · Blueprint: Top1Movers "Affordable Digitalization Technical Blueprint" (sections 1, 4, 5, 15, 21)

## TL;DR

| Area | Score | In one line |
|---|---|---|
| Meets the blueprint | **6 / 10** (61%) | 22 of 48 checkpoints met, 15 partly, 11 missing. Strong on inquiry, quote and job tracking; thin on the "control" modules (exceptions, delivery problems, document review, overdue tasks, billing readiness). |
| Easy to use | **7 / 10** (34 / 50) | Clear next-step guidance and role home pages. Pulled down by constant "Are you sure?" dialogs, a long job page and some dead ends. |
| Stability | **Good** | 0 console or page errors across two full passes (54 flows, 6 roles). No horizontal scrolling at phone width. |
| Code health | **Fair** | 3,128 lines. About 30 functions and constants are unused or can never run, mostly switched-off billing code. 1 duplicate element id. |

## How this was checked

1. **Line-by-line read** of all nine source files in `apps/mockup/src` and of `build.mjs`.
2. **Headless browser walkthrough of the real build**, driven through the UI the way staff would use it:
   - Sign-in, customer, duplicate check, inquiry, two quote versions (one sent back), client acceptance on the public quote page, convert to job.
   - All 14 steps of an import job (freight + customs + trucking, FCL), with 2 fund requests (one cash, one paid to the vendor directly), one "paid another way" step and one issue on hold.
   - Documents, closing, receipts checked by Accounting.
   - A second inquiry lost after the client declined.
   - Dashboards, access checks for every role, adding and deactivating users (with handover), settings, audit log, notifications, search, and the client tracking page.
   - Every click, field, upload and confirmation was counted.
3. **Second pass** exercising 29 more features the first pass did not touch (jobs list, edit inquiry, report an inquiry, settings save, audit date picker, and so on). Whatever still never ran after both passes is treated as unreachable.
4. **Automatic checks:**
   - Broken text on every screen ("undefined", "NaN", "null"): none found.
   - Console errors: none.
   - Duplicate element ids.
   - Accessibility with axe-core (WCAG 2 A/AA) on 5 key pages.
   - Phone width (390 px) on 5 pages.
   - Function-level code coverage from Chrome.
5. **Git history** checked where something looked like a regression.

The screenshots referenced below are in `2026-10-03-shots/`.

## 1. Requirements check (blueprint sections 4, 5 and 15)

✅ met · 🟡 partly · ❌ missing

### User & Role Management
| Checkpoint | | Evidence |
|---|---|---|
| Users, departments, roles, activation / deactivation | ✅ | Users page; several roles per person; deactivation waits for a handover; a deactivated person is greyed out at sign-in. |
| Access permissions enforced | 🟡 | Sales, Operations and Accounting are blocked correctly. But `can()` returns "yes" for any **Admin** on every action (`10-rules.js:14`). The Admin (Jun Robles, IT) can approve and release funds, approve quotes and confirm jobs, although the matrix shows those boxes unticked (22 permissions). This contradicts the agreed rule that Admin handles users, permissions and settings only, and breaks the "Manager approves, Accounting releases" split. |
| Access is auditable | 🟡 | User, role and permission changes are logged. Sign-ins are not. |

### Customer & Consignee (5.1)
| Checkpoint | | Evidence |
|---|---|---|
| Create and maintain customer and contact | ✅ | Required fields validated; edit works. |
| Consignee records | ❌ | No consignee anywhere (customer form fields: name, contact, phone, email, address). |
| Delivery-address records | 🟡 | A delivery address is typed per inquiry; it is not saved to the customer for reuse. |
| Duplicate search | ✅ | Warning with a link to the existing customer (`05-duplicate-warning.png`). |
| Related inquiry, quotation and shipment history | ✅ | The customer page lists inquiries with amounts, and jobs. |
| Customer requirements and delivery instructions | ❌ | No field exists. The agreed design (`01-inquiry-quotation.md`) keeps delivery instructions per shipment, but that input was lost too (see Bugs). |

### Inquiry & Quotation (5.2)
| Checkpoint | | Evidence |
|---|---|---|
| Register and assign inquiries | ✅ | The Manager creates and assigns; Sales is notified. |
| Validate required shipment information | 🟡 | Route and addresses are validated. **Cargo, cargo type, weight or volume, storage period and vehicle are not asked**, although `01-inquiry-quotation.md` requires them (`06-new-inquiry-form.png`). |
| Create and revise quotes, keeping history | ✅ | Version table with the reason for each version (`12-version-history.png`). |
| Record customer approval (conforme) | ✅ | Public quote page (`13-client-quote-page.png`), or Sales records the answer with proof. |
| Convert to job without retyping | ✅ | Customer, services, route and the accepted quote carry over. |

### Shipment Job (5.3)
| Checkpoint | | Evidence |
|---|---|---|
| Unique Shipment Job ID | ✅ | `SJ-2026-00001`. |
| Shipment, commodity, routing, container, consignee, ownership | 🟡 | Routing, cargo type and owners are captured. **Commodity** shows the services list instead ("Freight + Customs + Trucking"). **BL and container numbers cannot be entered**: the editor exists (`openRefs`) but no button opens it. No consignee. |
| Milestone and document checklist applied | ✅ | Built from scope, direction and services. |
| Shipment 360 view | 🟡 | One page holds status, steps, documents, issues, funds and history (`15-job-page-new.png`). There is no delivery-outcome or charges section. |
| Invalid progression prevented; status history kept | ✅ | Steps go in order ("Milestones are done in order."); gates; full history. |

### Milestones & Tasks (5.4)
| Checkpoint | | Evidence |
|---|---|---|
| Milestones from templates | ✅ | Templates per service. Tracks are fixed; document checklists can be edited in Settings. |
| Responsible users and due dates | 🟡 | One owner per service. **No due dates.** |
| Pending, due and overdue work | 🟡 | "Next" step and free-time clocks. **No due or overdue tasks.** |
| Completion evidence for selected tasks | ✅ | Proof is enforced on Duties paid, Delivered, Empty returned and Approved. |
| Overdue escalation by email | ❌ | There are no overdue tasks, so nothing to escalate; notifications are in-app only. |

### Document Management (5.5)
| Checkpoint | | Evidence |
|---|---|---|
| Checklist by shipment and service type | ✅ | Each document is tied to the step that needs or produces it. |
| Files stored under the Job ID | ✅ | (mock) |
| Upload, review, rejection, replacement | 🟡 | Upload, and replace (Manager only). **No review, accept or reject with a reason** (`21-documents-tab.png`). |
| Version and status | 🟡 | Pending / Received only. **Replace overwrites; no version history.** |
| Missing documents on Shipment 360 and the dashboard | 🟡 | On the job: yes. On the dashboard: no. |

### Exceptions (5.6)
| Checkpoint | | Evidence |
|---|---|---|
| Raised against a stage, with category, reason, impact | 🟡 | Reason only. The stage is not stored with the issue; no category or impact. |
| Approval and corrective action | ❌ | "Resolve" takes a note. No approval and no corrective task. |

### Delivery & POD (5.6)
| Checkpoint | | Evidence |
|---|---|---|
| Delivery date and time, with evidence | 🟡 | Date and signed POD are required. No time and no receiver name (`19-delivered-drawer.png`). |
| Damage or incomplete delivery | ❌ | Not capturable. |

### Charges & Billing Readiness (5.6, 15)
| Checkpoint | | Evidence |
|---|---|---|
| Expenses and charges against the job | 🟡 | Expenses: fund requests, receipts, quotations and bills (`26-funds-page.png`). No charges to bill the client. |
| Billing-readiness checklist after delivery | ❌ | Switched off (`ACCOUNTING_BASIC`). |
| Finance handover status visible | ❌ | Switched off. |

### Dashboard & Reports (4, 15)
| Checkpoint | | Evidence |
|---|---|---|
| Shipment status | ✅ | Active jobs by stage, jobs list. |
| Overdue tasks | ❌ | No panel (there are no task due dates). |
| Missing documents | ❌ | No panel. |
| Exceptions | ✅ | On-hold count and list; Needs attention. |
| Workload | ✅ | Team tab. |
| Billing readiness | ❌ | No panel. |
| Filters | ✅ | Date range, service, scope, customer, staff. |

### Audit, Workflow, Platform
| Checkpoint | | Evidence |
|---|---|---|
| Audit trail (create, update, status, approval, document) | 🟡 | 29 kinds of action are logged. **Customer edits and sign-ins are not.** A replaced document is logged like a first upload. |
| Only permitted transitions; who / what / when | ✅ | |
| Web portal, role-based screens | ✅ | |
| Reminders | ❌ | Planned for the real build; nothing in the mockup. |
| Works in a phone browser | ✅ | No horizontal scrolling. Small tap targets: see section 3. |

**Score:** 22 met + 15 partly (counted as half) = 29.5 of 48 = **61%**.

## 2. Bugs and mismatches found

| # | What | Where | Evidence |
|---|---|---|---|
| B1 | The inquiry form lost its **Cargo**, cargo type, volume, storage period, vehicle and delivery-instructions inputs. The screens still try to show them, so the job and the client tracking page show "Cargo: Freight + Customs + Trucking". | `60-sales.js:208` (`requestFieldsHtml`) vs `10-rules.js` (`reqVisible`) | Removed in commit `001756e`; `34-tracking.png` |
| B2 | **Admin can do every business action** (approve and release funds, approve quotes) despite the matrix. | `10-rules.js:14` | `29b-handover-by-admin.png` |
| B3 | **BL and container numbers can't be entered**: the editor has no button. Search, the jobs list, Key facts and the tracking page all read them, so they are always empty. | `50-jobs.js:427` | |
| B4 | **Notifications can't be clicked**: rows don't open their record (`openNotif` exists but is never wired). | `30-shell.js:131` | |
| B5 | **Sales can't open jobs at all**, although `04-users-roles-permissions.md` says Sales stays on the job as a viewer. The job page's "Accepted quote" line is therefore shown to nobody. | `00-data.js:257` (`job.view`), `50-jobs.js:205` | |
| B6 | Duplicate element id `inq-staff` (the list filter and the New inquiry field). The field's label points to the filter, and changing the filter closes the form. | `60-sales.js:56`, `:222` | |
| B7 | The inquiry list shows a dangling "·" after the date (reads `i.channel`, which no form sets any more). | `60-sales.js:40` | |
| B8 | "Close as lost" preselects the first reason (**Price too high**), so analytics count it even when nobody chose it. A client's own decline reason is stored as "Client reason", which isn't a category. | `60-sales.js:504`, `:480` | `27-dashboard-sales.png` |
| B9 | Field errors stay visible after the field is fixed, until the next submit. | `20-ui.js:79` | `06-new-inquiry-form.png` |
| B10 | Quotes still say **Reject** while the status says **Returned** (fixed for funds, not for quotes). | `60-sales.js:356` | |
| B11 | Team tab "Billed" column always shows ₱0.00 (billing is switched off). | `40-home.js:242` | |
| B12 | `apps/mockup/e2e.py` is broken: it stops at `#inq-channel` and uses removed billing flows. | | |

## 3. Ease of use

### Rated on Nielsen's 10 usability heuristics (1–5)

| Heuristic | Score | Why |
|---|---|---|
| Visibility of system status | 4 | Next-step panel, progress map, "waiting on", free-time clocks. But notifications are dead ends, and "Needs attention" never says why. |
| Match with the real world | 4 | Steps follow real Philippine import and export practice. The missing cargo field leaks into the client page. |
| User control and freedom | 3 | Cancel and send-back exist. No undo, and fund requests can't be cancelled. |
| Consistency | 3 | Funds wording is now consistent. Quotes still mix Reject and Returned. Operations see "Sales" in the phone nav. The "Ready to send" filter is always 0. |
| Error prevention | 4 | Required fields, gates, order guard, proof uploads, duplicate check. Weak spot: the preselected lost reason. |
| Recognition rather than recall | 4 | My Work tells each person what to do next; step hints on hover. |
| Flexibility and efficiency | **2** | One import job took **183 UI actions across 7 people, and 33 of them were "Are you sure?" clicks** (22 during job operations alone). No bulk actions; list rows can't be opened with the keyboard. |
| Minimalist design | 3 | Clean visual style, but the job page shows the same steps three times (progress map, next-step checklist, Milestones table) and is about 2,000 px tall (`15-job-page-new.png`). |
| Error recovery | 3 | Errors appear under the field and say how to fix it. They don't clear while typing, and "denied" toasts vanish after 3 seconds. |
| Help and documentation | 4 | Hints on fields and steps; a user manual. |
| **Total** | **34 / 50** | |

### Effort for one import job (freight + customs + trucking, 14 steps)

| Stage | Actions | Of which "Are you sure?" |
|---|---|---|
| Customer + inquiry (Manager) | 18 | 0 |
| Two quote versions, client accepts | 20 | 5 |
| Acknowledge + convert to job | 16 | 2 |
| Running the 14 steps (3 Operations staff + Manager + Accounting for 2 fund requests) | 114 | 22 |
| Remaining documents, closing, receipts checked | 15 | 4 |
| **Total** | **183** | **33 (18%)** |

### Accessibility and phone (automatic checks)

- **axe-core (WCAG 2 A/AA):**
  - Dashboard (critical): a filter select has no accessible name.
  - Job page (serious): invalid list markup.
  - Inquiry page (serious): a scrollable region isn't keyboard-focusable.
  - Funds and Users pages: clean.
- **Keyboard:** 8 list tables (jobs, inquiries, customers, funds and others) open a record only on mouse click. The rows have no `tabindex` and no keyboard handler.
- **Phone (390 px):** no horizontal scrolling on the 5 pages tested. Tap targets under the 44 px rule in `docs/ai/ui-rules.md`:

  | Page | Under 44 px |
  |---|---|
  | Inquiries | 18 of 26 |
  | Funds | 11 of 15 |
  | Dashboard | 8 of 25 |
  | Job | 8 of 36 |
  | My Work | 6 of 10 |

## 4. Unused code and components

Verified two ways: a static search for declarations nobody references, and two full browser passes recording which functions ever ran.

| Group | What | Size | Suggestion |
|---|---|---|---|
| **Switched-off billing** | `billingSection`, `openUploadSOA` / `saveSOA`, `openReviewBill` / `decideBill`, `openSendBill` / `saveSendBill`, `openPayment` / `savePayment`, `reimbSummaryHtml`, `financeTab`, `jobProfit`, `paidTotal`, `reimbursable`, `ownCosts`, `moneyShort`, `toPHP`. Plus 28 lines branching on `ACCOUNTING_BASIC` / `FINANCE_SOA_ONLY`, the "Billed" Team column, the "Payment terms" setting, and `j.billing` | ~190 lines | Never ran in either pass. **Delete both switches and this code**; it stays in git at `001756e`. If billing readiness is built (section 6), build it new and small. |
| **Quote "Mark as sent"** | `openMarkSent`, `saveSent`, the "ready" branches in `inqNext` and `salesWork`, the "Ready to send" filter chip, `CHANNELS` | ~25 lines | Unreachable: approval now emails the quote automatically. Decide: delete it, or restore the manual send with proof that `01-inquiry-quotation.md` describes. |
| **Built but not connected** (wire these, don't delete) | `openRefs` / `saveRefs` (BL and containers), `openNotif` / `markAllRead` (clickable notifications), `exportDashCSV` (Excel export agreed in Stage 5) | ~30 lines | Wire them up. |
| **Leftovers from the old inquiry form** | `planPreviewHtml` (plan preview no longer shown), `reqVisible` keys `cargo` / `ctype` / `wh` / `deliv` with no inputs, `convertToJob` reading `bl`, `containers`, `portDays`, `containerDays` from fields that no longer exist | ~10 lines | Fixed by restoring the fields (B1). |
| **Plain unused** | `serviceBlockReason`, `CURRENCIES`, `initials`, `jobLink`, `inqLink`, `formError`, `kv`, `firstSent`, `CLIENT_TRACK` | ~15 lines | Delete. |
| **Settings that do nothing** | "Payment terms (days)" (billing off), "Follow-up reminder" (planned) | — | Remove, or label "planned". |
| **Stale test** | `apps/mockup/e2e.py` | 143 lines | Replace it with an updated walkthrough (the one used for this assessment can be adapted). |

## 5. Docs and code disagree

| Topic | Docs say | Code does |
|---|---|---|
| Quote sending | Sales marks it sent, with proof (`01`) | Approval auto-emails it |
| Inquiry fields | Cargo is required; delivery instructions (`01`) | Neither field exists |
| Sales on jobs | Viewer of assigned jobs (`04`) | No access |
| Admin | Users, permissions and settings only (`04`) | Can do everything |
| Dashboard | Export to Excel and PDF (`05`) | No export button |
| Hosting | Windows Server (blueprint 1, 21) | `PRODUCT.md`: ASP.NET on Docker / Ubuntu EC2 |
| Fund requests | "Deferred" (`02-job.md`) | Built (Stage 3) |

## 6. Recommended improvements (for discussion)

**Before showing the client.** These map straight onto rows of their own blueprint table:
1. Restore the cargo details on the inquiry: cargo, cargo type, weight or volume (or container count), delivery instructions, vehicle for LTO, warehousing volume and period (B1).
2. Add "Shipment references" (BL/AWB and container numbers) to the job menu (B3).
3. Exceptions: category, impact, evidence, stage, Manager approval, corrective task with an owner and due date.
4. Delivery: time, received by, and condition (complete / damaged / short, with photos). Anything other than complete raises an exception.
5. Thin billing readiness, with no invoices and no tax: after delivery a checklist (POD in, documents in, receipts closed, charges listed), then "Ready for Finance", then Finance marks it "Received". Shown on the dashboard.
6. Documents: Accept / Reject with a reason; keep old versions when a file is replaced.
7. Due dates on steps from the templates, overdue flags, and an overdue list on My Work and the dashboard.
8. Dashboard panels for missing documents, overdue tasks and billing readiness.
9. Admin gets only what the matrix grants (B2).

**Ease of use:**
10. Keep "Are you sure?" only for money, completing a job, closing as lost and deactivation. That would cut about 30 of the 37 confirmations in this walkthrough.
11. Make notification rows open their record (B4).
12. Clear field errors as soon as the field is fixed (B9).
13. Let Sales view their jobs read-only (B5).
14. Quotes: "Send back" instead of "Reject"; no preselected lost reason (B8, B10).
15. Fix the duplicate id; name the dashboard selects; make list rows keyboard-openable; 44 px tap targets on phones.
16. A "Load sample data" button for demos (everything starts empty and disappears on refresh).
17. Shorten the job page: drop the Milestones table, or merge it into the progress map.

**Cleanup:**
18. Delete the dead code in section 4 and the two finance switches; update the docs in section 5 to match decisions; replace `e2e.py`.
