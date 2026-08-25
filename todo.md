# Todo

Fully-done work is archived in `todo-done.md` — this file tracks open items only.

## Card Images

- [ ] Implement image optimization and responsive loading for card images.
  - Display, backend extraction/sync, and inline rendering are done — remaining: `srcset`/`sizes`, WebP/AVIF variants, and intrinsic dimensions.

## Card Composer

Exporter MVP shipped: compose, reorder, metadata, Markdown + PDF export, with A4 print layout and per-card page breaks. See `todo-done.md` for the shipped scope.

- [ ] Add optional per-card notes in composed documents.
- [ ] Add local snapshots (multiple saved compositions).
- [ ] Evaluate server-rendered PDF for deterministic pagination.
- [ ] Add shareable composition links or account-backed saved documents.
- [ ] Add citation-format presets and bibliography appendix generation.

Cards from the same file are being tagged as different because of small name discrepancies,
probably the best avenue is to extract `Metadata` at the file level once and assing it to all
cards in the lot, maybe even hand curate as we do for the regex patterns to ensure consistent author names, source titles, and tag sets. Examples:

- Eco 1992, Eco 1994... should all be tagged as "Eco", same book different edition.
- Ted Honderich appears as "Honderich", "Ted Honderich", even the same book will be split at the persitence and front layers if the author name isn't consistent.

## UI/UX & Bug Checklist

- [ ] **Graph view — 'return to repository' for the companion card** · Add a way to navigate back to the card repository from the companion card panel (`GraphPanel`) in the graph view — it currently only has "Ver tarjeta completa" and "Explorar desde aquí".
- [ ] **Horizontal scroll on narrow viewports (mobile)** · Some cards can render wider than the viewport, causing sideways scrolling. Verify with `document.documentElement.scrollWidth > innerWidth` at ~320–375px. Images are likely NOT the cause — `CardImage` is `object-contain` inside a bounded, `overflow-hidden` figure. More likely: unbreakable tokens in `whitespace-pre-wrap` card content (needs `break-words`/`overflow-wrap:anywhere`), and the `card-actions flex-nowrap` bars (tags + Red/Añadir) forcing one non-wrapping row on very narrow screens.

## Themes (2026-08-20)

- [ ] Test new DaisyUI themes — currently using the defaults (light/dark); evaluate `emerald` (light) and `forest` (dark).
  - [ ] Pick a light + dark pair and enable them.
  - [ ] Craft custom themes with similar palettes and homogeneous styles across components after settling on base themes.

## Graph network — entry / landing experience (revisit later)

- [ ] Revisit whether the graph needs a standalone landing / a "Red" nav entry, or should stay contextual (reached from a card), instead of today's random-card starter.
  - Current state: `/cards/graph` with no `origin` shows a "Elegir una tarjeta al azar" (random) starter + a link back to `/cards`; no nav link; the graph is a card's "explore relationships" view.
  - Random (and even N random suggestions) feels arbitrary when landing on 1 card among ~2,648 without context; a guided "wizard" (author → book → card, or tag → random) would largely duplicate the `/cards` search/filter.
  - Possible direction: surface a prominent "Explorar red" action on cards / card list (contextual entry, no landing), and/or thematic starting points based on hub cards (highest in-degree in `card-relations.json`).
  - Stop point reached: current random + repo fallback is good enough so users who land there don't feel stuck. Revisit the direction later.
