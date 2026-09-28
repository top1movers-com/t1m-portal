---
name: Top1Movers Operations Portal
description: Dense, calm logistics operations UI in Top1Movers navy, with brand red kept for identity marks.
colors:
  brand-red: "#ff0000"
  midnight: "#02033b"
  navy-deep: "#0d0f55"
  harbour-navy: "#191970"
  navy-hover: "#2c2f95"
  navy-wash: "#e4e7f7"
  navy-tint: "#f0f2fb"
  canvas: "#f5f8fc"
  surface: "#ffffff"
  surface-muted: "#edf1f7"
  border: "#dce3ee"
  border-strong: "#8492aa"
  ink: "#14163a"
  ink-2: "#4a5170"
  ink-3: "#5f6788"
  danger: "#b42318"
  danger-bg: "#fdecea"
  warning: "#9a4a05"
  warning-bg: "#fef3e2"
  success: "#17794a"
  success-bg: "#e6f4ec"
  info: "#1d5fc4"
  info-bg: "#e8f0fc"
typography:
  title:
    fontFamily: "League Spartan, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "League Spartan, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
  panel-title:
    fontFamily: "League Spartan, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  table:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
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
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    height: "32px"
  table-row:
    height: "40px"
  sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    width: "240px"
  nav-item-current:
    backgroundColor: "{colors.harbour-navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "36px"
---

# Design System: Top1Movers Operations Portal

Canonical files: `packages/design-system/tokens.css` (values), `components.css` (reference `ds-*` styles), `index.html` (visual guide), `icons.svg`. This file is the agent-facing summary. If it disagrees with `tokens.css`, `tokens.css` wins; fix this file.

## Overview

**Creative North Star: "The Dispatch Desk"**

A dispatcher's desk at 9 a.m.: everything in reach, nothing decorative, the urgent item visible without hunting. The portal borrows Top1Movers' identity (their deep navy, their League Spartan headlines, their red mark) and puts it to work in a dense, calm, table-first interface that people read for hours.

Surfaces are flat and outlined. Structure comes from borders, tint, and consistent row rhythm, not shadow. Navy carries action; status colors carry meaning and are always backed by an icon and a word. The look is deliberately quiet so overdue tasks, missing documents, and exceptions are the loudest things on any screen.

**Key Characteristics:**
- Job-centric: the Shipment 360 view is the hub; every module links back to a job.
- Two densities from one component set: 36px desktop, 44px touch.
- Quiet chrome: a white, bordered sidebar; the navy fill is spent on the current nav item, primary buttons, and links.
- Light theme only in Phase 1 (daytime offices, lit warehouse floors).
- Brand red is an identity mark, not a control color.

## Colors

Restrained palette: navy plus navy-tinted neutrals, one set of four status colors, red held back for identity.

### Primary
- **Harbour Navy** (#191970): every primary button, link, heading, selected tab text, and focus ring. Hover uses **Navy Hover** (#2C2F95), pressed uses **Navy Deep** (#0D0F55).
- **Midnight** (#02033B): reserved for the login field and other full-bleed brand moments. Not used in the app shell.
- **Navy Wash** (#E4E7F7) / **Navy Tint** (#F0F2FB): selected row and row/ghost-button hover.

### Brand accent
- **Signal Red** (#FF0000): the logo, the 3px rule atop the sidebar, and the active-tab underline. Never a fill, never a side stripe, never text under 24px (white on it is 4:1).

### Neutral
- **Canvas** (#F5F8FC) page background; **Surface** (#FFFFFF) panels, tables, inputs; **Surface Muted** (#EDF1F7) table header and disabled fields.
- **Border** (#DCE3EE) dividers; **Border Strong** (#8492AA) input outlines.
- **Ink** (#14163A) text; **Ink 2** (#4A5170) secondary; **Ink 3** (#5F6788) placeholder and meta, still 4.5:1 on canvas.

### Status
- **Danger** #B42318 (bg #FDECEA): overdue, rejected, destructive. **Warning** #9A4A05 (bg #FEF3E2): due soon, missing. **Success** #17794A (bg #E6F4EC): delivered, approved. **Info** #1D5FC4 (bg #E8F0FC): in progress, neutral notices.

### Named Rules
**The Navy Works, Red Signs Rule.** Actions are navy. Red #FF0000 only ever marks identity or current location. Trouble is Danger #B42318, always with an icon.
**The Never Color Alone Rule.** A status is a color, an icon, and a word together.

## Typography

**Display Font:** League Spartan 600/700 (bundled; source swappable in tokens.css)
**Body Font:** Helvetica Neue / Helvetica / Arial
**Data Font:** system monospace, for IDs, container and BL numbers only

**Character:** the client's own pairing. League Spartan's geometric headlines give the brand voice; plain Helvetica keeps dense tables neutral and fast to read. Numbers are tabular everywhere.

### Hierarchy
- **Title** (700, 24px, 1.2): page title, one per screen.
- **Headline** (600, 18px, 1.2): section headings.
- **Panel title** (600, 16px, 1.2): panel and drawer headings.
- **Body** (400, 14px, 1.5): default; measure max 70ch for prose.
- **Table** (400, 13px, 1.5): dense cells.
- **Label** (700, 12px, +0.04em, uppercase): table headers, stat labels, field groups.
- **Data** (mono, 0.92em): Job IDs, container numbers, BL numbers.

### Named Rules
**The Tokens Own The Font Rule.** Font families are declared once as `--t1m-font-*` in tokens.css. Components never name a font. The source (bundled file, Google Fonts, CDN) can change there without touching components.

## Layout

Fixed app shell: 240px white sidebar with a 1px right border, 56px top bar, content capped at 1440px with 24px gutters (16px under 640px). At 960px and below the sidebar collapses to a 64px icon rail; under 640px it becomes a bottom bar and controls switch to the 44px touch height. Spacing is a 4px base scale (4, 8, 12, 16, 20, 24, 32, 40, 48): tight inside a group, 24 to 48 between groups, more space above a heading than below it. Tables scroll horizontally inside their panel rather than shrinking type. Prefer one panel per topic over nested containers.

## Elevation & Depth

Flat and outlined. Panels have a 1px border (#DCE3EE) and no shadow. Only elements that float over the page (menus, drawers, toasts) use `--t1m-shadow-float` (`0 2px 6px rgba(2,3,59,.08), 0 8px 24px rgba(2,3,59,.12)`). Keyboard focus is a 2px navy ring offset by 2px of surface (`--t1m-focus-ring`).

### Named Rules
**The Flat-Until-Floating Rule.** If it doesn't overlay other content, it has no shadow.

## Shapes

Soft, modern radii: 8px (`--t1m-radius-sm`) for controls and nav items, 12px (`--t1m-radius-md`) for panels, menus, and alerts, 16px (`--t1m-radius-lg`) for drawers and dialogs (the edge-anchored drawer rounds its leading corners only). Status pills, nav count chips, avatars, and milestone dots are fully round. This is a deliberate step softer than the client marketing site, chosen for a friendlier, contemporary app feel. Borders are 1px; the only thicker lines are the 3px brand rule and the 3px active-tab underline.

## Components

### Buttons
- **Shape:** 8px radius, 36px tall (30px small, 44px touch), 16px horizontal padding, 600 weight, sentence-case action label.
- **Primary:** Harbour Navy fill, white text. One per view.
- **Secondary:** white with Border Strong outline, navy text. **Ghost:** transparent, navy text. **Danger:** Danger fill, white text; destructive actions only.
- **States:** hover shifts fill (120ms, `--t1m-ease`), focus shows the navy ring, disabled uses Surface Muted + Ink 3, loading hides the label behind a spinner.

### Inputs / Fields
- 36px tall, white, 1px Border Strong, 8px radius. Hover darkens border to navy; focus adds the navy ring. Invalid: Danger border plus an icon-led error line beneath naming the problem and fix. Labels sit above, 13px/600.

### Status pill
- 22px tall, fully round (pill), 12px/700 text with a 12px icon. Info = in progress, Success = done, Warning = needs attention soon, Danger = overdue or rejected, Brand = billing ready, neutral = not started.

### Tables
- Sticky 32px uppercase header on Surface Muted; 40px rows (32px compact, 48px on phones); 1px row dividers; hover Navy Tint; selected Navy Wash. Numbers right-aligned. The whole row opens the record. Overdue dates are Danger + bold.

### Navigation
- White sidebar (1px right border, 3px Signal Red rule across the top), 36px items, Ink 2 text at 600 weight. Group labels are 12px caps in Ink 3. Hover is Navy Tint with navy text. The current item is a solid Harbour Navy fill with white text (no side stripe); its count chip turns translucent white. Only an actionable count (for example My tasks) gets a navy chip; other counts are quiet grey. At 960px and below the sidebar is a 64px icon rail: labels are visually hidden but stay in the accessibility tree, and every link must carry a title tooltip. Under 640px it becomes a bottom bar with 44px targets.

### Table power tools
- Sortable headers are buttons inside `th` with `aria-sort` and a chevron; a checkbox column feeds a bulk bar (Navy Wash, count + actions) above the table; the pager carries a page-size select; `/` focuses search (shown as a `kbd` hint). Under 640px, `ds-table--stack` turns rows into labeled cards.

### Tabs
- 40px, 600 weight, Ink 2; selected is navy with a 3px Signal Red underline.

### Alerts
- Tinted status background, matching-hue border at 25%, icon + bold title + one sentence naming problem and recovery. Inline; a modal only when the user must decide before continuing.

### Milestone track (signature)
- Horizontal stepper for a shipment job. Done = solid navy dot and line, current = ringed navy dot, overdue = Danger-outlined dot on Danger Bg with a Danger label, upcoming = hollow. Date beneath each step.

### Document checklist row (signature)
- 52px row: file icon, name plus version/meta line, status pill, one row action (View, Upload, Replace). Rejected rows state the reason in the meta line.

### Drawer
- Right-side, up to 480px, floating shadow. Preferred over modals for record detail and quick edit.

## Do's and Don'ts

### Do:
- **Do** use only `var(--t1m-*)` tokens for color, size, space, radius, and font.
- **Do** pair every status color with an icon and a word.
- **Do** keep one navy primary button per view and name the action ("Create quotation").
- **Do** build empty, loading, error, disabled, and focus states for every component.
- **Do** surface overdue tasks, missing documents, and exceptions in list rows and on Shipment 360.
- **Do** label all mock data as illustrative (IDs like TMW-2026-00412, "Sample Trading Co.").

### Don't:
- **Don't** fill a button, badge, banner, or nav item with Signal Red #FF0000, or use it as a side stripe.
- **Don't** hardcode hex values, px font sizes, or font names in components.
- **Don't** nest panels or put every group in a card; don't use colored side stripes on cards or rows.
- **Don't** use emoji or text glyphs as icons; add to `icons.svg` in the same 1.75-stroke style.
- **Don't** use gradient text, glassmorphism, or decorative shadows.
- **Don't** open a modal for what a drawer, inline edit, or page can do.
- **Don't** invent components: check `index.html` first, and if it's missing, add it to the system (tokens.css, components.css, index.html, this file) before using it.
