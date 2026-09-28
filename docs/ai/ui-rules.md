# UI rules for AI agents

Applies to any AI agent (Claude Code, Codex, Cursor, Copilot) building or changing UI in this repo.

## The rule

**Every UI component, screen, and style must follow the Top1Movers design system. Read it before writing UI. Do not invent visual values.**

## Before you write any UI

1. Read `/DESIGN.md` (rules, component specs, do's and don'ts).
2. Read `/packages/design-system/tokens.css` (the only source of color, size, space, radius, shadow, font, and motion values).
3. Look in `/packages/design-system/index.html` and `components.css` for an existing component or pattern. Reuse it.
4. Read `/PRODUCT.md` when copy, data, or scope is involved.

## Hard rules

- Use `var(--t1m-*)` tokens for every visual value. No raw hex, no arbitrary px sizes, no ad hoc shadows.
- Fonts are declared only in `tokens.css` (`--t1m-font-*`). Components reference the variables, never a font name. Where a font comes from (bundled file, Google Fonts, CDN) is a tokens.css decision and is open.
- Icons come from `/packages/design-system/icons.svg`. To add one, match the existing style (24 grid, 1.75 stroke, round, currentColor). No emoji or text glyphs as icons.
- Brand red `--t1m-brand-red` is for identity marks only (logo, 3px rules, current-location marker). Never a button, badge, or banner fill.
- Status is always color + icon + word.
- One primary (navy) button per view.
- Ship all states: hover, focus-visible, disabled, loading, empty, error.
- **Scaffold, not spinner.** Content that loads (tables, lists, cards, stats, detail panels, dropdown options) shows a skeleton scaffold (`ds-skeleton`) in the exact shape and size of the final content. Never a circular spinner for content or pages. The one permitted spinner is the small one inside a button while its action runs (`ds-btn--loading`, with the label changed to "Saving…"); uploads use `ds-progress`. Mark containers `aria-busy`, announce with `role="status"`, and never use a skeleton for an empty or error state.
- Mock data must look mock: IDs like `TMW-2026-00412`, names like "Sample Trading Co.". Never invent real customers, prices, or claims.
- Accessibility floor: text contrast 4.5:1, keyboard reachable, visible focus, 44px touch targets on mobile.

## Components: how to build new ones

- Expose **component tokens**: local custom properties (for example `--card-bg`) that default to global `--t1m-*` tokens. Variants and states change the local properties, never raw values.
- Size components from their **container** (container queries), not only the viewport.
- Compose from slots (`__header`, `__body`, `__footer`), keep one primary action per component, and use a real semantic element (`article`, `button`, `a`), never a clickable `div`.
- Ship every state: rest, hover, focus-visible, pressed, selected, disabled, loading (scaffold, see the rule above), empty, error.
- **Cards** are for discrete objects (a shipment job, a task, a document). Never nest cards, never use a card as page structure, and never fill a page with identical icon-heading-text cards.

## If the design system doesn't cover what you need

Don't improvise inside the component. Add the token, style, and example to the design system first, in this order:

1. `packages/design-system/tokens.css` (new value)
2. `packages/design-system/components.css` (new `ds-*` style)
3. `packages/design-system/index.html` (visible example)
4. `/DESIGN.md` (rule or component note)

Then use it. If the change alters an existing look (not just adds), stop and ask the user.

## Where things live

| What | Path |
|---|---|
| Agent-facing design spec | `/DESIGN.md` |
| Tokens (source of truth) | `/packages/design-system/tokens.css` |
| Reference component CSS | `/packages/design-system/components.css` |
| Visual style guide (humans) | `/packages/design-system/index.html` |
| Icons | `/packages/design-system/icons.svg` |
| Client logo | `/packages/design-system/assets/top1movers-logo.png` |
| Product truth | `/PRODUCT.md` |
