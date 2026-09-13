# Todo

Fully-done work is archived in `todo-done.md` — this file tracks open items only.

## Card Images

- [ ] Implement image optimization and responsive loading for card images.
  - Display, backend extraction/sync, and inline rendering are done — remaining: `srcset`/`sizes`, WebP/AVIF variants, and intrinsic dimensions.

## Backend

- [x] **Text formatting loss** · Backend is losing text formatting (italics, etc.) during extraction. Investigate and preserve rich text formatting in card content.

## Card Composer

Exporter MVP shipped: compose, reorder, metadata, Markdown + PDF export, with A4 print layout and per-card page breaks. See `todo-done.md` for the shipped scope.

- [ ] Add optional per-card notes in composed documents.
- [ ] Add citation-format presets and bibliography appendix generation.

Cards from the same file are being tagged as different because of small name discrepancies,
probably the best avenue is to extract `Metadata` at the file level once and assing it to all
cards in the lot, maybe even hand curate as we do for the regex patterns to ensure consistent author names, source titles, and tag sets. Examples:

- Eco 1992, Eco 1994... should all be tagged as "Eco", same book different edition.
- Ted Honderich appears as "Honderich", "Ted Honderich", even the same book will be split at the persitence and front layers if the author name isn't consistent.

## UI/UX & Bug Checklist

- [x] **Extract tag component** · Tags are rendered in 3+ places with inconsistent styles: `CardItem` (`badge-outline` buttons), search dialog (rounded pills + rectangular filter chips), `GraphPanel` (`badge-soft` spans). Extract into a single `<Tag>` component with props for variant (interactive/static, outline/soft/primary), shape (pill/rectangle), and size. Covers display tags, filter toggles, and active filter chips.

- [ ] **Graph view — 'return to repository' for the companion card** · Add a way to navigate back to the card repository from the companion card panel (`GraphPanel`) in the graph view — it currently only has "Ver tarjeta completa" and "Explorar desde aquí".
- [ ] **Card list — move 'open card' button near the title** · In `CardItem`, the `→` button sits at the far right edge next to the page badge. Move it next to the title/author line (same pattern as `GraphPanel`) so it reads as "open this card" rather than a disconnected action. More discoverable and better grouped with the card identity.
- [ ] **Horizontal scroll on narrow viewports (mobile)** · Some cards can render wider than the viewport, causing sideways scrolling. Verify with `document.documentElement.scrollWidth > innerWidth` at ~320–375px. Images are likely NOT the cause — `CardImage` is `object-contain` inside a bounded, `overflow-hidden` figure. More likely: unbreakable tokens in `whitespace-pre-wrap` card content (needs `break-words`/`overflow-wrap:anywhere`), and the `card-actions flex-nowrap` bars (tags + Red/Añadir) forcing one non-wrapping row on very narrow screens.
- [ ] **CardItem — tooltip overflow clipping** · Tooltips in `CardItem.svelte` are clipped by the parent container's boundary. Needs a portal implementation to render tooltips at the body level.
- [x] **Long page numbers in TOC** · Edge case: page numbers like “p. 5 y ss del capítulo Cerebros en una cubeta” [Strawson — Análisis y metafísica] are extremely long. Currently truncated with ellipsis, but may need special handling (abbreviated format, tooltip with full text, or data normalization).
- [ ] **Component doc route** · Create `/doc` route with isolated component examples (Tag variants, sizes, states) for faster front-end iteration. Evaluate after current feature branch.
- [ ] **Unified card content presentation** · Card content is rendered in 8+ surfaces (`CardItem`, card detail, `GraphPanel`, `GraphTooltip`, `RelatedCardsSheet`, `SearchResultItem`, PDF export, Markdown export) with inconsistent formatting handling. Now that content carries HTML formatting tags, formalize a single content-rendering pipeline: one function that takes raw card content and a `mode` (preview/expanded/pdf/markdown) and returns the right output. Covers text truncation, image handling, formatting conversion, and excerpt generation. See also the "Federated Card Component" spec in `design/card-views.md`.

## Themes (2026-08-20)

- [x] Test new DaisyUI themes — currently using the defaults (light/dark); evaluate `emerald` (light) and `forest` (dark).
  - [x] Pick a light + dark pair and enable them.
  - [x] Craft custom themes with similar palettes and homogeneous styles across components after settling on base themes.

## Graph network — entry / landing experience (revisit later)

- [ ] Revisit whether the graph needs a standalone landing / a "Red" nav entry, or should stay contextual (reached from a card), instead of today's random-card starter.
  - Current state: `/cards/graph` with no `origin` shows a "Elegir una tarjeta al azar" (random) starter + a link back to `/cards`; no nav link; the graph is a card's "explore relationships" view.
  - Random (and even N random suggestions) feels arbitrary when landing on 1 card among ~2,648 without context; a guided "wizard" (author → book → card, or tag → random) would largely duplicate the `/cards` search/filter.
  - Possible direction: surface a prominent "Explorar red" action on cards / card list (contextual entry, no landing), and/or thematic starting points based on hub cards (highest in-degree in `card-relations.json`).
  - Stop point reached: current random + repo fallback is good enough so users who land there don't feel stuck. Revisit the direction later.

## Content quality (future)

- [ ] **AI-assisted card cleanup** · Cards are hand-typed and accumulate small issues: misplaced formatting (`(**1994)**`), missing accents (`semiotca`), stray characters. Two-pass approach: (1) mechanical regex fixes for obvious tag repair (deterministic, no AI), (2) AI review pass that surfaces typos as diffs for human approval — not auto-apply. Key constraint: don't alter quotes or proper nouns; use the book title as context. Prototype the mechanical pass first as the safest win.
