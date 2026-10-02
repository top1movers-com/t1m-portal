# Stage 4 — User Management, Roles & Permissions (AGREED)

Permissions answer two questions: WHAT a role can do (role matrix) and WHICH records it can see (record access).

## Agreed decisions
1. Roles: Admin, Manager, Sales, Operations (includes customs broker, documentation, liaison), Accounting.
   External Client: NO login; public tracking page with a tracking code only.
2. One user can hold multiple roles (e.g. a founder = Admin + Manager, or Manager + Accounting).
3. Admin = users, permissions and settings only. No business actions unless also a Manager.
4. Record access:
   - Manager: all inquiries, jobs, customers (create/edit customers).
   - Sales: VIEW all inquiries, EDIT assigned only; jobs = assigned (viewer); customers view.
   - Operations: assigned jobs only + read-only linked inquiry; customers view.
   - Accounting: all jobs (for fund release/billing); customers view.
5. Sensitive info: quotes → Manager, Sales. Fund requests/costs/vendor bills → Manager, Accounting, Ops (assigned).
   Billing/payments → Manager, Accounting. Job profit → Manager only. Users/permissions → Admin.
6. Fixed roles + default matrix. Admin can tick/untick permissions per role. Custom roles = Phase 2.
7. User lifecycle: Admin creates (name, work email, roles); the person signs in with their Microsoft work account.
   DEACTIVATE, never delete (history preserved). On deactivation, open inquiries/jobs/fund requests must be reassigned by the Manager.
   (Changed 2026-10-02: sign-in is Microsoft SSO, so temporary passwords, forced change and password reset are not in the portal.)
8. Multiple Managers allowed; any Manager can approve. Self-approval allowed but labelled "Self-approved".
9. System-wide audit log (who/what/record/when), visible to Admin + Manager, with filters.
10. Sign-in = Microsoft single sign-on (CHANGED 2026-10-02). Password rules, lockout and MFA are handled by Microsoft / the company tenant.
    Portal side (implementation): inactivity logout. Mockup: "Sign in with Microsoft" + a stand-in account chooser.

## Default role matrix
Legend: Y = can do · V = view only · A = assigned records only · - = no access

### Administration                                  Admin Mgr  Sales Ops  Acctg
Create/deactivate users                              Y     -    -     -    -
Edit permission matrix                               Y     -    -     -    -
System settings (tracks, checklists, defaults)       Y     Y    -     -    -
View audit log                                       Y     Y    -     -    -

### Customers & Inquiry/Quotation
Create/edit customer                                 -     Y    V     V    V
Create inquiry, set scope/services, assign staff     -     Y    -     -    -
View inquiries                                       -     Y    V(all) V(linked) -
Upload quote + submit for approval                   -     Y    A     -    -
Approve / return quote                               -     Y    -     -    -
Mark sent, record client outcome + proof             -     Y    A     -    -
Acknowledge acceptance / close inquiry               -     Y    -     -    -

### Job
Convert to job, assign Ops                           -     Y    -     -    -
View job                                             -     Y    V(A)  A    V
Update milestones, upload documents                  -     Y    -     A    -
Flag / resolve issue                                 -     Y    -     A    -
Set free days                                        -     Y    -     A    -
Submit job for closing                               -     Y    -     A    -
Confirm job completed                                -     Y    -     -    -

### Money
Create fund request                                  -     Y    -     A    -
Approve / return fund request                        -     Y    -     -    -
Release funds                                        -     -    -     -    Y
Liquidate (upload receipts)                          -     Y    -     A    -
Verify liquidation                                   -     -    -     -    Y
Upload SOA + submit for approval                     -     -    -     -    Y
Approve / return billing                             -     Y    -     -    -
Send billing, record payments                        -     -    -     -    Y
Record vendor bills                                  -     -    -     -    Y
View job profit                                      -     Y    -     -    -

### Reports — replaced by Stage 5 (05-analytics-dashboards.md):
View dashboards / analytics / job profit                Y     Y    -     -    -
"My Work" home page (to-do lists, no analytics)          -     -    Y     Y    Y
(Admin's dashboard access is ON by default and can be unticked in the permission matrix.)

Money separation: the Manager APPROVES but does not RELEASE; Accounting RELEASES but does not APPROVE.
(If one person holds both roles, it is allowed and logged under their name.)

## Notifications (in-app bell in the mockup; email at implementation)
- Assigned to inquiry/job → assigned staff
- Quote / fund request / billing submitted → Manager(s)
- Approved / returned → submitter
- Client accepted/rejected → Manager(s) + assigned Sales
- Job converted → assigned Ops + Accounting
- Fund request approved → Accounting (to release)
- Issue flagged → Manager(s) + assigned Sales
- Job completed → Accounting ("Ready to Bill")
- Free time ≤ 1 day / billing overdue → Manager(s) + assigned Ops / Accounting
