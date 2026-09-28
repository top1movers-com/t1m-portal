---
target: design system (white sidebar)
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-09-28T13-32-11Z
slug: packages-design-system-index-html
---
Method: dual-agent (A: design review, B: detector + browser evidence), plus independent finish review.

Target: packages/design-system (Top1Movers Operations Portal design system), after the sidebar was changed from navy to white with a right border.

Score: 26/36 applicable (72%, Good). Heuristic 10 n/a (design system page). Weakest: Flexibility and Efficiency (1).

Design specificity: milestone track, document checklist, domain copy and mock data are product-specific; the shell, pills, panels and tabs are category-standard.

Priority issues (status after fixes):
- [P1] Active nav state too weak on white (about 1.2:1 wash). Fixed: solid navy fill, white text; only the actionable count is navy; rail and bottom bar show a dot.
- [P1] No power-user table tooling. Fixed: sortable headers, checkbox column, bulk bar, page size, "/" search hint, row click affordance.
- [P2] Phone table clipped. Fixed: ds-table--stack labeled cards; bulk bar hidden on phone.
- [P2] DESIGN.md drift (Midnight sidebar, red nav marker). Fixed and re-verified by the documenter.
- [P3] Guide page hard to scan. Fixed: active-section highlight.

Detector: em-dash-overuse advisory (rewritten; residual count is CSS custom property names). Other overlay hits were false positives or intentional (transparent loading label, 3px brand top rule).

Finish review: PASS_WITH_ISSUES. Fixed: tab focus clipping, rail specimen width, border-strong contrast (1.6:1 to 3.1:1), phone bulk bar, bottom bar specimen, hardcoded hex, drawer specimen.

Rejected suggestion: red left marker on active nav item (colored side stripe, banned by craft floor).
