# Todo

Fully-done work is archived in `todo-done.md` — this file tracks open items only.

## Card Images

- [ ] Implement image optimization and responsive loading for card images.
  - Display, backend extraction/sync, and inline rendering are done — remaining: `srcset`/`sizes`, WebP/AVIF variants, and intrinsic dimensions.

## Backend

- [ ] Footnotes, apparently there are superindeces in the text that link to a footnote section at the end of the file. See [Avramindes] final card for an example.

## Card Composer

- [ ] Add optional per-card notes in composed documents.
- [ ] Add citation-format presets and bibliography appendix generation.

## UI/UX & Bug Checklist

- [ ] **Graph view — 'return to repository' for the companion card** · Add a way to navigate back to the card repository from the companion card panel (`GraphPanel`) in the graph view — it currently only has "Ver tarjeta completa" and "Explorar desde aquí".
- [ ] **CardItem — tooltip overflow clipping** · Tooltips in `CardItem.svelte` are clipped by the parent container's boundary. Needs a portal implementation to render tooltips at the body level.
- [ ] **Component doc route** · Create `/doc` route with isolated component examples (Tag variants, sizes, states) for faster front-end iteration. Evaluate after current feature branch.
- [ ] **Search bar** · The search bar parameters reset each time the bar is closed, the state should be preserved until the user explicitly resets it. It should be reset under specific conditions (e.g. when the user selects a tag from a card). Those conditions should be explored — currently it obfuscates the search UX.
- [ ] Migrate `<slot>` usage to `{@render ...}` tags — Svelte deprecation warning in `CardActions.svelte:49:4`.

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
