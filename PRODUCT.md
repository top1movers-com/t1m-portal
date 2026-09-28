# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite (user choice), talking to mock data only. The eventual backend is fixed by the architecture PDF: ASP.NET, PostgreSQL, Docker on Ubuntu EC2, static assets via CloudFront.

## Users

Top1Movers Worldwide Inc. staff, all three groups primary:
- Dispatchers / operations coordinators (Manila and other local offices) creating, assigning, and tracking inquiries, shipment jobs, and tasks.
- Warehouse / field crew updating milestones, documents, and delivery/POD from the floor (phones/tablets possible; device mix unconfirmed).
- Managers / admins for oversight, approvals, exceptions, and user administration.
- Finance receives billing-ready jobs (downstream consumer of the Charges module).

## Product Purpose

The Top1Movers Operations Portal is the Phase 1 "Digitalization" logistics ERP: one record from inquiry to billing readiness for freight/shipment jobs, replacing scattered folders and email. Expected to accumulate hundreds of thousands of shipment, task, and document rows, so dense, fast list and search work is core.

**Current deliverable:** a stakeholder presentation mockup at proposal stage. No funding yet; the mockup is shown first to win the project. It uses mock data only and has no real backend.

## Operating Context

- Staff access from Manila and other Philippine offices (AWS ap-southeast-1).
- Environments: Production, Development, UAT (UAT only for client demos/acceptance testing).
- Shipment documents are stored per Shipment Job ID (S3 in production).
- Roadmap includes AI-assisted services later; not part of Phase 1.

## Capabilities and Constraints

Phase 1 modules (from the blueprint):
1. User & Role Management: users, departments, roles, activation/deactivation, access permissions. Outcome: controlled access and accountability.
2. Customer Management: customer, contact, consignee, delivery address, basic requirements; duplicate search; related inquiry/quotation/shipment history; customer-specific delivery instructions. Outcome: single customer reference.
3. Inquiry & Quotation: register and assign inquiries, validate required shipment info, create/revise quotations preserving history, record customer approval/conforme, convert approved inquiry to a Shipment Job without re-keying. Outcome: digital commercial-to-operations handoff.
4. Shipment Job: unique Job ID, shipment/commodity/routing/container/BL/consignee/ownership data, status; auto-applied milestone and document checklist; **Shipment 360 view** (status, tasks, documents, approvals, exceptions, delivery, charges); invalid status progression prevented, status history kept. Outcome: central operational record.
5. Milestones & Tasks: milestones from configured templates, owners, due dates, pending/due/overdue display, completion evidence required for selected tasks, overdue escalation by simple email. Outcome: clear accountability.
6. Document Management: checklist by shipment/service type, upload, review, rejection, replacement, version and status tracking; missing/rejected documents surface on Shipment 360 and dashboard. Outcome: no dependence on scattered folders/email.
7. Exception & Approval: raise exceptions against a shipment stage (category, reason, impact, evidence), route approval and corrective task. Outcome: controlled handling of deviations.
8. Delivery & POD: delivery confirmation, POD, damage/incomplete delivery. Outcome: digital proof of completion.
9. Charges & Billing Readiness: charges, expenses, supporting evidence, billing-ready status and checklist after delivery confirmation. Outcome: cleaner handover to Finance.
10. Dashboard & Reports: shipment status, overdue tasks, missing documents, exceptions, workload, billing readiness. Outcome: management visibility.
11. Audit Trail: create/update/status/approval/document actions. Outcome: traceability.

Constraints:
- Mock data only for the mockup; do not imply real integrations, live data, or completed backend.
- Production *servers* have no general outbound internet (no NAT gateway; AWS access goes through VPC endpoints). This limits server-side calls to third-party APIs only. Staff browsers are ordinary internet clients, so front-end assets (fonts, icons, CDNs) are not restricted by it. The portal is not a closed system.
- Role-level permissions and exact status values are not yet specified; mock plausibly and label as illustrative.

## Brand Commitments

Name: Top1Movers (Top1Movers Worldwide Inc.). No logo, palette, or voice provided. Do not invent claims about the company.

## Evidence on Hand

- `Top1Movers_AWS_Architecture_Documentation (2).pdf`: infrastructure rationale.
- Blueprint scope table and Section 5 (Application Modules and Functional Scope), supplied by the user as screenshots in conversation; no file in the folder. No real data, screens, or brand assets exist. All data shown must be clearly mock.

## Product Principles

- Job-centric: everything hangs off the Shipment Job; Shipment 360 is the hub.
- Built for daily, high-volume operational use: scanability and speed over decoration.
- Accountability visible: owners, due dates, overdue flags, and audit trail are first-class, not buried.
- Exceptions and missing documents surface proactively rather than waiting to be found.
- One portal, several roles: each role sees what it needs without separate apps.
