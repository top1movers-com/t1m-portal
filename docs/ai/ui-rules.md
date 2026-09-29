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
- Mock data must look mock: IDs like `TMW-2026-00412`, names like "Sample Trading Co.". Never invent real customers, prices, or claims.
- Accessibility floor: text contrast 4.5:1, keyboard reachable, visible focus, 44px touch targets on mobile.

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
| Mockup sources (edit these) | `/apps/mockup/src/*.js`, built by `node apps/mockup/build.mjs` into `apps/mockup/index.html` (generated; never edit it directly) |
| Product truth | `/PRODUCT.md` |
