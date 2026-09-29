# Top1Movers Operations Portal (monorepo)

Stakeholder mockup for a logistics ERP, proposal stage, mock data only. Product context: `PRODUCT.md`.

## UI work: follow the design system (mandatory)

Before writing or changing any UI, read `docs/ai/ui-rules.md`, then `DESIGN.md` and `packages/design-system/tokens.css`. Use only design-system tokens and components; no hardcoded colors, sizes, or fonts. If something is missing, add it to the design system first, as described in `docs/ai/ui-rules.md`.

## Layout

- `packages/design-system/`: tokens, component CSS, icons, fonts, logo, HTML style guide
- `docs/ai/`: rules and documents written for AI agents
- `docs/testing/`: UAT test plan (scenario-based test cases for every role)
- `apps/`: applications (React + Vite frontend goes here)
- `apps/mockup/`: the stakeholder mockup. Edit `apps/mockup/src/*.js` (and the design system), then run `node apps/mockup/build.mjs`; `apps/mockup/index.html` is generated, never edit it directly.
- `docs/demo/`: scenario manual. Regenerate with `python docs/demo/manual/build_manual.py` after mockup changes (screenshots come from the live build).
