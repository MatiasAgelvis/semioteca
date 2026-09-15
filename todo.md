# Todo

Fully-done work is archived in `todo-done.md` — this file tracks open items only.

## Card Images

- [ ] Implement image optimization and responsive loading for card images.
  - Display, backend extraction/sync, and inline rendering are done — remaining: `srcset`/`sizes`, WebP/AVIF variants, and intrinsic dimensions.

## Backend

- [x] **Text formatting loss** · Backend is losing text formatting (italics, etc.) during extraction. Investigate and preserve rich text formatting in card content.
- [ ] Footnotes, apparently there are superindeces in the text that link to a footnote section at the end of the file. See [Avramindes] final card for an example.

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
- [x] **Card list — move 'open card' button near the title** · Done. Moved `→` button from far-right (next to page badge) to right after the book title in `CardItem`, matching the `GraphPanel` pattern. Reads as "open this card" now, better grouped with card identity.
- [x] **Horizontal scroll on narrow viewports (mobile)** · Investigated: cannot reproduce below ~300px, which is narrower than any real device. Images shrink properly via `object-contain` + bounded container. Not a real issue — closing.
- [ ] **CardItem — tooltip overflow clipping** · Tooltips in `CardItem.svelte` are clipped by the parent container's boundary. Needs a portal implementation to render tooltips at the body level.
- [ ] **SearchDialog not available outside /cards** · Tag clicks on the card detail page (`/cards/[id]`) call `openCardsSearch` but no `SearchDialog` is mounted there, so nothing happens. Similarly, the search bar auto-navigates to the book view. Fix: mount `SearchDialog` in the root layout so it's available globally, and ensure tag clicks from any page open it without forcing navigation.
- [x] **Long page numbers in TOC** · Edge case: page numbers like “p. 5 y ss del capítulo Cerebros en una cubeta” [Strawson — Análisis y metafísica] are extremely long. Currently truncated with ellipsis, but may need special handling (abbreviated format, tooltip with full text, or data normalization).
- [ ] **Component doc route** · Create `/doc` route with isolated component examples (Tag variants, sizes, states) for faster front-end iteration. Evaluate after current feature branch.
- [ ] **Unified card content presentation** · Card content is rendered in 8+ surfaces (`CardItem`, card detail, `GraphPanel`, `GraphTooltip`, `RelatedCardsSheet`, `SearchResultItem`, PDF export, Markdown export) with inconsistent formatting handling. Now that content carries HTML formatting tags, formalize a single content-rendering pipeline: one function that takes raw card content and a `mode` (preview/expanded/pdf/markdown) and returns the right output. Covers text truncation, image handling, formatting conversion, and excerpt generation. See also the "Federated Card Component" spec in `design/card-views.md`.
- [ ] **Toast notifications** · Toasts are overlapping, instead of making a vertical stack they overlap in the z-index. is this is a bug in the DaisyUI library? or is there a way to fix it? - Currently it's a single toast shared by all notifications, that explains the behaviour.
- [ ] **Explore in network button** If one relations pane is scrolled and that button gets out of view it will remain until its scrolled to again in the same or another pane. can hide the network entrypoint, a user might not realize that the pane is halfway scrolled and miss the button.
- [ ] **Book View** · When switching book views the scroll position is preserved, so users land in an arbitrary position in the newly selected book, ideally scroll should be reset to the top of the book or preserved by book, not globally to the view.
- [ ] **Search bar** · The search bar parameters reset each time the bar is closed, the state should be preserved until the user explicitly resets it, it should be reset under specific conditions (e.g. when the user selects a tag from a card), those conditions should be explored, currently it obfuscates the search UX.
- [ ] [vite-plugin-svelte] src/lib/components/card/CardActions.svelte:49:4 Using `<slot>` to render parent content is deprecated. Use `{@render ...}` tags instead
      https://svelte.dev/e/slot_element_deprecated

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

## Performance

- [ ] **Investigate build time regression** · Vercel build times jumped from ~2m30 to ~4m30 between the Aug 25 and Aug 28 deploys. Check what changed in that window — likely candidates: dependency updates, new prerender routes, or SvelteKit config changes.
