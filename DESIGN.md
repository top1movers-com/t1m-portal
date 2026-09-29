---
name: Top1Movers Operations Portal
description: Dense, calm logistics operations UI in Top1Movers navy, with brand red kept for identity marks.
colors:
  brand-red: "#e5383b"
  midnight: "#1c2050"
  navy-deep: "#272d78"
  harbour-navy: "#2F3A8F"
  navy-hover: "#3f4bab"
  navy-wash: "#e7eaf8"
  navy-tint: "#f2f4fc"
  canvas: "#f6f8fc"
  surface: "#ffffff"
  surface-muted: "#eff2f8"
  border: "#e3e8f1"
  border-strong: "#8794ae"
  ink: "#262b52"
  ink-2: "#545b7c"
  ink-3: "#5d6485"
  ink-on-midnight: "#c4c9ea"
  danger: "#b3372d"
  danger-hover: "#922c24"
  danger-bg: "#fbeceb"
  warning: "#93500f"
  warning-bg: "#fdf3e3"
  success: "#1f7a55"
  success-bg: "#e8f4ee"
  info: "#2b62c0"
  info-bg: "#e9f0fb"
typography:
  title:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
  panel-title:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  nav:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  body:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  table:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  data:
    fontFamily: "ui-monospace, Cascadia Mono, Consolas, Courier New, monospace"
    fontSize: "0.92em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.harbour-navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "36px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.navy-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.harbour-navy}"
    rounded: "{rounded.sm}"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "36px"
    padding: "0 12px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    height: "44px"
  table-row:
    height: "52px"
  sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    width: "240px"
  nav-item-current:
    backgroundColor: "{colors.navy-wash}"
    textColor: "{colors.harbour-navy}"
    rounded: "{rounded.sm}"
    height: "36px"
---

# Design System: Top1Movers Operations Portal

Canonical files: `packages/design-system/tokens.css` (values), `components.css` (reference `ds-*` styles), `index.html` (visual guide), `icons.svg`. This file is the agent-facing summary. If it disagrees with `tokens.css`, `tokens.css` wins; fix this file.

## Overview

**Creative North Star: "The Dispatch Desk"**

A dispatcher's desk at 9 a.m.: everything in reach, nothing decorative, the urgent item visible without hunting. The portal borrows Top1Movers' identity (their navy, their type-forward wordmark, their red mark) and puts it to work in a dense, calm, table-first interface that people read for hours.

Surfaces are flat and outlined. Structure comes from borders, tint, and consistent row rhythm, not shadow. Navy carries action; status colors carry meaning and are always backed by an icon and a word. Type is light and weight follows attention: chrome rests at regular-to-light weights and grows heavier only when it is hovered, current, or urgent. The look is deliberately quiet so overdue tasks, missing documents, and exceptions are the loudest things on any screen.

**Key Characteristics:**
- Job-centric: the Shipment 360 view is the hub; every module links back to a job.
- Two densities from one component set: 36px desktop, 44px touch.
- Quiet chrome: a white, bordered sidebar with light-weight labels; navy is spent on primary buttons, links, and headings.
- Softened color: brand navy and red are lifted and eased in the UI; the exact brand colors live in the logo. Body text is 13.6:1, never harsher.
- Light theme only in Phase 1 (daytime offices, lit warehouse floors).
- Brand red is an identity mark, not a control color.

## Colors

Restrained palette: navy plus navy-tinted neutrals, one set of four status colors, red held back for identity.

### Primary
- **Harbour Navy** (#2F3A8F): every primary button, link, heading, selected tab text, and focus ring. Lifted from the exact brand navy #191970, which lives in the logo. Hover uses **Navy Hover** (#3F4BAB), pressed uses **Navy Deep** (#272D78).
- **Midnight** (#1C2050): reserved for the login field and other full-bleed brand moments. Not used in the app shell.
- **Navy Wash** (#E7EAF8) / **Navy Tint** (#F2F4FC): selected row and row/ghost-button hover.

### Brand accent
- **Signal Red** (#E5383B): the logo, the 3px rule atop the sidebar, and the active-tab underline. Never a fill, never a side stripe, never text under 24px (white on it is 4.2:1). The exact brand red #FF0000 lives in the logo asset; the UI echoes it at this lower intensity.

### Neutral
- **Canvas** (#F6F8FC) page background; **Surface** (#FFFFFF) panels, tables, inputs; **Surface Muted** (#EFF2F8) table header and disabled fields.
- **Border** (#E3E8F1) dividers; **Border Strong** (#8794AE) input outlines.
- **Ink on Midnight** (#C4C9EA): secondary text on the Midnight login field only.
- **Ink** (#262B52) text; **Ink 2** (#545B7C) secondary; **Ink 3** (#5D6485) placeholder and meta, still 4.5:1 on canvas.

### Status
- **Danger** #B3372D (bg #FBECEB; hover #922C24): overdue, rejected, destructive. **Warning** #93500F (bg #FDF3E3): due soon, missing. **Success** #1F7A55 (bg #E8F4EE): delivered, approved. **Info** #2B62C0 (bg #E9F0FB): in progress, neutral notices.

### Named Rules
**The Navy Works, Red Signs Rule.** Actions are navy. Red #E5383B only ever marks identity or current location. Trouble is Danger #B3372D, always with an icon.
**The Never Color Alone Rule.** A status is a color, an icon, and a word together.

## Typography

**UI Font:** Inter, variable weight axis (bundled; source swappable in tokens.css), for headings, nav, buttons, tabs, labels, pills, tables, and forms, with Helvetica Neue / Arial as fallback
**Data Font:** system monospace, for IDs, container and BL numbers only

**Character:** one neutral, screen-native family so spacing and widths stay consistent at 12 to 14px, with tabular numerals where columns need to align (tables, stats, counts, inputs; not prose, where Inter would widen hyphens) and a distinct I / l / 1. The brand's own geometric type lives in the logo, not the UI; the client's identity reaches the interface through navy, red, and shape, not the typeface.

### Hierarchy
- **Title** (600, 24px, 1.2): page title, one per screen.
- **Headline** (600, 18px, 1.2): section headings.
- **Panel title** (600, 16px, 1.2): panel and drawer headings.
- **Nav** (400 at rest, 600 on hover, focus, or current; 14px): sidebar and tab labels, with a 200ms weight transition and reserved width so nothing shifts.
- **Body** (400, 14px, 1.5): default; measure max 70ch for prose.
- **Table** (400, 13px, 1.5): dense cells.
- **Label** (600, 12px, +0.04em, uppercase): table headers, stat labels, field groups.
- **Data** (mono, 0.92em): Job IDs, container numbers, BL numbers.

### Named Rules
**The Weight Follows Attention Rule.** Chrome rests light (nav and tabs 400, controls 500). Weight rises to 600 for hover, focus, and current states, and never as a default. Bold is a signal, so nothing is bold at rest.
**The Tokens Own The Font Rule.** Font families are declared once as `--t1m-font-*` in tokens.css. Components never name a font. The source (bundled file, Google Fonts, CDN) can change there without touching components.

## Layout

Fixed app shell: 240px white sidebar with a 1px right border, 56px top bar, content capped at 1440px with 24px gutters (16px under 640px). Both the sidebar and top bar are sticky (`position: sticky; top: 0`) so they stay in view while the content column scrolls — only `.ds-content` scrolls, never the whole page. At 960px and below the sidebar collapses to a 64px icon rail; under 640px it becomes a bottom bar (sticky to the bottom instead) and controls switch to the 44px touch height. Spacing is a 4px base scale (4, 8, 12, 16, 20, 24, 32, 40, 48): tight inside a group, 24 to 48 between groups, more space above a heading than below it. Tables scroll horizontally inside their panel rather than shrinking type. Prefer one panel per topic over nested containers.

## Elevation & Depth

Flat and outlined. Panels have a 1px border (#E3E8F1) and no shadow. Only elements that float over the page (menus, drawers, toasts) use `--t1m-shadow-float` (`0 2px 6px rgba(2,3,59,.08), 0 8px 24px rgba(2,3,59,.12)`). Keyboard focus is a 2px navy ring offset by 2px of surface (`--t1m-focus-ring`).

### Named Rules
**The Flat-Until-Floating Rule.** If it doesn't overlay other content, it has no shadow.

## Shapes

Soft, modern radii: 8px (`--t1m-radius-sm`) for controls and nav items, 12px (`--t1m-radius-md`) for panels, menus, and alerts, 16px (`--t1m-radius-lg`) for drawers and dialogs (the edge-anchored drawer rounds its leading corners only). Status pills, nav count chips, avatars, and milestone dots are fully round. This is a deliberate step softer than the client marketing site, chosen for a friendlier, contemporary app feel. Borders are 1px; the only thicker lines are the 3px brand rule and the 3px active-tab underline.

## Components

### Buttons
- **Shape:** 8px radius, 36px tall (30px small, 44px touch), 16px horizontal padding, 500 weight, sentence-case action label.
- **Primary:** Harbour Navy fill, white text, with a faint top-edge highlight and a soft navy drop (`--t1m-btn-lift`) that deepens on hover and flattens on press. One per view.
- **Secondary:** tonal, a Navy Tint fill with navy text and no outline; hover deepens to Navy Wash. On a tinted surface such as the bulk bar it switches to white with the field shadow so it stays visible. **Ghost:** transparent with navy text, Navy Tint on hover. **Danger:** Danger fill, white text, same lift as primary; destructive actions only.
- **States:** press nudges the button down half a pixel; hover shifts fill (120ms, `--t1m-ease`), focus shows the navy ring, disabled uses Surface Muted + Ink 3, loading hides the label behind a spinner.

### Inputs / Fields
- 36px tall (30px small, 44px touch), white, 1px Border Strong, 8px radius, with a faint 1px lift shadow. Hover darkens the border to Ink 3. Focus swaps the border to Harbour Navy and adds a soft 4px translucent navy halo (`--t1m-field-focus`, 18% of Harbour Navy) instead of the hard double ring buttons use. Invalid: Danger border and a Danger halo on focus, with an icon-led error line beneath that names the problem and the fix. Disabled and read-only fields sit on Surface Muted with no shadow. Labels sit above at 13px/500; optional fields say "optional" in Ink 3 rather than marking required with an asterisk.
- **Select and dropdown:** the trigger is field-styled with a custom chevron (Ink 3, navy and flipped when open); the open state shows the same navy border and halo as focus. The panel is a custom listbox that floats like every overlay: white, 1px Border, 12px radius, `--t1m-shadow-float`, 6px below the trigger (or above it via `data-placement="top"`), 4px inner padding, max 296px with scroll, entering with a 120ms fade and 4px slide. Options are 36px minimum with 8px radius; the highlighted option (hover or keyboard) is Navy Tint, the selected option is Harbour Navy at weight 500 with a trailing check, disabled options are Ink 3. Options may carry a 12px Ink 3 description line; groups use 12px caps labels; separators are 1px Border. Behavior follows the ARIA listbox pattern (arrows, Home/End, type-ahead, Enter/Space, Escape). On touch devices use the native select, whose picker is better on phones.
- **Input group:** prefix and suffix adornments (PHP, kg) sit inside one shared border on Surface Muted and share one focus halo.
- **Text area:** same treatment, 96px minimum height, vertical resize, optional character count in Ink 3.
- **Checkbox and radio:** 18px, Border Strong outline, filled Harbour Navy when on (check mark or inner dot); focus uses the same halo. **Switch:** 38x22 track, white knob, Harbour Navy when on, for settings that take effect immediately.

### Status pill
- 28px tall with 12px horizontal padding, fully round (pill), 12px/600 text with a 12px icon. Info = in progress, Success = done, Warning = needs attention soon, Danger = overdue or rejected, Brand = billing ready, neutral = not started.

### Tables
- Quiet header: a 44px sticky row on white with 12px caps labels in Ink 3 over a hairline (no grey band). Rows are 52px at 14px text by default; Compact is 40px at 13px, Comfortable is 60px; density is a user switch (segmented control), not a page setting. Cells have 16px horizontal padding. Row dividers are 1px Border. Hover (Navy Tint) and selection (Navy Wash) are inset rounded highlights (8px on the row ends) and the neighbouring dividers fade out so the highlight reads clean. The ID column is Harbour Navy at weight 500 in the monospace data face; a customer cell may carry a secondary line in 12px Ink 3. Numbers are right-aligned. A trailing 32px kebab button appears on row hover or focus (always visible on touch). Checkboxes are 18px, 5px radius, filled Harbour Navy with a white check. The whole row opens the record. Overdue dates are Danger at weight 500.

### Navigation
- White sidebar (1px right border, 3px Signal Red rule across the top), 36px items with 20px icons (1.5 stroke) and Ink 2 labels at weight 400. Group labels are 12px caps in Ink 3. Hover does not change the background: the label turns navy and grows to weight 600 over 200ms (width is reserved, so nothing shifts). The current item is a Navy Wash fill with navy text at weight 600 (no side stripe); its count chip turns white. Only an actionable count (for example My tasks) gets a navy chip; other counts are quiet grey. At 960px and below the sidebar is a 64px icon rail: labels are visually hidden but stay in the accessibility tree, and every link must carry a title tooltip. Under 640px it becomes a bottom bar with 44px targets.

### Table power tools
- Sortable headers are buttons inside `th` with `aria-sort` and a chevron; a checkbox column feeds a bulk bar (Navy Wash, count + actions) above the table; the pager carries a page-size select; `/` focuses search (shown as a `kbd` hint). Under 640px, `ds-table--stack` turns rows into labeled cards.

### Tabs
- 40px, weight 400 in Ink 2; hover and selected grow to weight 600 in navy (200ms, width reserved). Selected also gets a 3px Signal Red underline. The label sits in its own `.ds-tab__label` span (that's what carries the width-reservation trick); an optional count/alert pill is a plain flex sibling next to it, not inside the label — putting a badge directly in `.ds-tab`'s own former grid layout pushed it onto its own line below the text.

### Alerts
- Tinted status background, matching-hue border at 25%, icon + bold title + one sentence naming problem and recovery. Inline; a modal only when the user must decide before continuing.

### Milestone track (signature)
- Horizontal stepper for a shipment job. Done = solid navy dot and line, current = ringed navy dot, overdue = Danger-outlined dot on Danger Bg with a Danger label, upcoming = hollow. Date beneath each step.
- The current step's ring breathes (a slow 2s pulse between Navy Tint and Navy Wash 100), and — only when it follows a done step, never an overdue one — the connector leading into it carries a slow-moving light stripe. Together they read as "progress is actively heading here" rather than a static snapshot. Both respect `prefers-reduced-motion`.

### Progress bar
- `.ds-bar-track` + `.ds-bar-fill`: a thin rounded meter (Surface Muted track, solid Navy 700 fill, Danger when blocked). Add `.ds-bar-fill--active` only on a bar that represents a job actively moving forward (a job's own Journey progress) for a soft sweeping highlight; leave a static gauge like workload-per-user alone, since nothing there is "in motion." A row whose value is a money amount plus a share (Cost & margin by category) adds `.ds-bar-row--wide` so the value column fits instead of spilling past the panel.

### Document checklist row (signature)
- 52px row: file icon, name plus version/meta line, status pill, one row action (View, Upload, Replace). Rejected rows state the reason in the meta line.

### Cost & margin panel (signature)
- No new component — a `.ds-panel` combining the existing stat-card row (`.ds-stats`/`statCard`), the existing category bars (`.ds-bar-row`/`.ds-bar-track`/`.ds-bar-fill`), and a `pill()` in the panel head for the break-even state (Warning tone when actual charges reach or exceed the quoted amount, Success otherwise — never Danger; this is a caution about margin, not a failure). This is cost-visibility only: no AR/GL, no ledger, no payment tracking, no tax calculation. On a Shipment Job's Charges tab (Manager, Admin, Finance; Finance read-only, matching that role everywhere else) and, aggregated, on the Dashboard.

### Client funds ledger (signature)
- A per-job notebook, not accounting: `.ds-table.ds-ledger` inside a `.ds-panel`, with the existing stat-card row (Money in, Money spent, Left over) above it and a `.ds-bar-track` meter of spent versus received (`.ds-bar-fill--success` while covered, `--warning` when nearly used up, `--danger` when overspent). Rows are date ordered; the last column is the running balance. Amounts carry a sign and a named column (`.ds-ledger__in` success text, `.ds-ledger__neg` danger text for a negative balance), so color is never the only cue. A payment without a receipt shows a Warning pill "Receipt missing" in the proof cell.
- The settlement line and the funding-gap notice are plain `.ds-alert`s: Info or Success for the final position ("Refund due to client", "Balance to bill client", "Fully settled"), Warning for "Short on funds". The gap notice adds `.ds-alert--enter`; ledger rows ease in through `--i` stagger (30ms steps). Both use the motion tokens and switch off under `prefers-reduced-motion`.
- Plain words only in staff-facing headings ("Money in", "Money spent", "Left over"). Not a general ledger, AR, or tax engine; no payment or bank integration is implied. Reimbursable costs are pass-through; margin is service fees plus markup, never the pass-through costs themselves.
- Icons: `wallet`, `arrow-in`, `arrow-out`. Visible: Shipment patterns in `index.html`.

### Public client page (shipment tracking)
- `.ds-public` is the one place outside the login screen that renders without the app shell. A Midnight `.ds-public__hero` (a full-bleed brand moment, like login) carries the answer: brand row (logo on a white chip so its navy stays legible), the shipment ID, the status as a 32px headline, a status pill and the ETA, then a `.ds-route` (origin, destination, a filled line and a white marker at the shipment's progress, "via" port beneath). One centered column (`.ds-public__body`, 760px max) of `.ds-panel`s overlaps the hero's lower edge with the soft `--t1m-shadow-card` lift and eases in with a short stagger.
- The journey is a vertical `.ds-timeline`: done steps are solid navy with a check, the current step is ringed and gently pulses, an attention step (a hold) is Warning-tinted with an alert icon, upcoming steps stay quiet. Each step has one plain sentence. Everything animates through the motion tokens and stops under `prefers-reduced-motion`.
- Language is the customer's, not ours: seven plain steps (Booked, Preparing documents, On the water, Arrived at port, Customs clearance, Out for delivery, Delivered), never internal statuses. A hold shows as a Warning "Delayed" with one calm sentence, never the exception detail. Staff-only data (charges, funds, margin, tasks, audit entries) never appears here.
- Reached with a job, BL or container number in the mockup; a real build would use a signed, expiring link.

### Printable document (Billing Summary)
- A read-only, printable Finance handoff for a billing-ready job: `.ds-billing-summary__toolbar` (back link + Print/Export, both `.no-print`) above `.ds-billing-summary__doc` (a plain white document card — brand row, bill-to/shipment two-column block, charges table, quoted/margin totals, mock disclaimer). Lives inside the normal shell like every other page — a `@media print` block hides the sidebar, top bar, and anything `.no-print` and lets the document card fill the printed page, rather than routing to a separate stripped-down page.
- Never title this document, or any file derived from it, "Invoice" — call it "Billing Summary" everywhere (title, heading, filename) so the mockup never implies it produces real invoices. State plainly in the document body that it is a Finance handoff, not a client-facing invoice or a record of legal or financial standing.

### Drawer
- Right-side, up to 480px, floating shadow. Preferred over modals for record detail and quick edit.

### Action menu (avatar / kebab)
- Same floating panel as the select dropdown (`.ds-menu`: white, 1px Border, 12px radius, `--t1m-shadow-float`), holding plain actions instead of selectable options. An optional header (name + role, or a title) sits above a divider; actions are 36px rows with an icon, Navy Tint on hover/focus; a destructive action (Sign out is not destructive, but e.g. a future "Delete" would be) uses the Danger tint on hover. Anchor it to a trigger with `.ds-menu-trigger`; align right under a trailing element (the avatar) with `.ds-menu--right`. Opens/closes with the same 120ms fade + 4px slide as the select dropdown.

### File upload
- Replaces the native file input everywhere a file is attached (documents, POD, exception and charge evidence). A dashed-border drop zone (Surface Muted, Border Strong dashed) with an upload icon, a label, and a hint; hover and drag-over both switch to a solid Navy border, Navy Tint fill, navy text. Once a file is chosen the zone collapses to a solid-border row showing a file icon, the filename, and a small remove button — same element, two states (`data-filled="true"`), never a separate "selected file" line floating below an unstyled native control.

### Date-range picker
- A field-styled trigger button (matches `.ds-input` height/border) showing the current range, opening a floating panel (same `.ds-menu`-style surface) split into a presets column (Today, Last 7 days, Last 30 days, This month, All time) and a single-month calendar with prev/next navigation. Click a start day then an end day; the range between them highlights in Navy Tint, the two endpoints are solid Navy Wash 700 circles. Used wherever a report needs a date window (Audit Trail today). Add `.ds-datepicker--right` when the trigger sits near the right edge of its container (e.g. a page-head filter) so the panel opens leftward instead of overflowing the viewport. The presets column and calendar sit together inside a `.ds-datepicker__body` row — that wrapper is required, since the panel itself is a column (presets+cal row, then the footer row below).

### Sign in with Microsoft
- `.ds-msbtn`: the full-width branded button that replaced the email/password form on login. Its colors (`#fff` fill, `#8c8c8c` border, `#5e5e5e` text, `#f25022`/`#7fba00`/`#00a4ef`/`#ffb900` logo squares), Segoe UI font, and square corners are Microsoft's own brand requirements, not ours — this is the one place besides the Top1Movers logo itself where hardcoded, non-token colors are correct, because altering them would violate Microsoft's guidelines. Never restyle it to match `.ds-btn`.
- Clicking it opens the account chooser rather than posting a form, since a real Microsoft sign-in redirects to Microsoft and comes back with an identity — there's nothing for this app's own form to validate.

### Account chooser (mock SSO)
- A deactivated user's row is disabled (`.ds-acct-row:disabled`: Surface Muted, Ink 3, dimmed avatar, not-allowed cursor) and its role label reads "Role · Deactivated", so a deactivated account visibly cannot sign in.
- `.ds-acct-picker`: a centered modal standing in for the real Microsoft "Pick an account" step. Header carries a small Microsoft logo, "Pick an account", and the app name being signed into. Below it, one `.ds-acct-row` per account — a `.ds-avatar`, name, email, and (in this mockup only) a role label — plus a final "Use another account" row with a plain add-icon circle instead of an avatar.
- This is the direct answer to "hundreds of users would make a role dropdown unusable": real SSO account choosers only ever list the handful of accounts already known to the device, never an org's full directory, so this UI pattern already solves that problem — it isn't a workaround, it's what production Microsoft sign-in actually looks like.

### Avatar / profile photo
- `.ds-avatar` fills with a two-stop Navy gradient (varied per person from the existing Navy scale, never a new hardcoded hue) holding a plain `i-user` glyph, standing in for a real Microsoft Graph profile photo (`GET /me/photo/$value`, `User.Read` scope — genuinely available for most work accounts). This mockup never uses an actual photograph of a real person for a fictional persona; the illustrated placeholder is the honest stand-in. A real integration keeps the same fallback this component already implies: no Graph photo (404) → plain initials, exactly like Teams or Outlook. `.ds-avatar--sm` (24px) is for inline use next to a name, e.g. a table row.
- Mockup-only disclaimer belongs in the picker's footer (small, muted, centered) and in the login page's alert, not hidden in a tooltip — the whole point is that a reviewer never has to wonder whether this hits a real directory.

## Do's and Don'ts

### Do:
- **Do** use only `var(--t1m-*)` tokens for color, size, space, radius, and font.
- **Do** pair every status color with an icon and a word.
- **Do** keep one navy primary button per view and name the action ("Create quotation").
- **Do** build empty, loading, error, disabled, and focus states for every component.
- **Do** surface overdue tasks, missing documents, and exceptions in list rows and on Shipment 360.
- **Do** label all mock data as illustrative (IDs like TMW-2026-00412, "Sample Trading Co.").

### Don't:
- **Don't** fill a button, badge, banner, or nav item with Signal Red #E5383B, or use it as a side stripe.
- **Don't** hardcode hex values, px font sizes, or font names in components.
- **Don't** nest panels or put every group in a card; don't use colored side stripes on cards or rows.
- **Don't** use emoji or text glyphs as icons; add to `icons.svg` in the same 1.75-stroke style.
- **Don't** use gradient text, glassmorphism, or decorative shadows.
- **Don't** open a modal for what a drawer, inline edit, or page can do.
- **Don't** invent components: check `index.html` first, and if it's missing, add it to the system (tokens.css, components.css, index.html, this file) before using it.
