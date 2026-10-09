# Todo

Fully-done work is archived in `todo-done.md` — this file tracks open items only.

## Tagging

- [ ] Test decision models https://ollama.com/search?c=decision

## Card Images

- [ ] Implement image optimization and responsive loading for card images.
  - Display, backend extraction/sync, and inline rendering are done — remaining: `srcset`/`sizes`, WebP/AVIF variants, and intrinsic dimensions.

## Backend

- [x] Footnotes: backend extraction done (contiguous `\d+.\s` blocks parsed into `Book.footnotes`). Frontend rendering still needed — show a "Notas" section at the bottom of the book view and link `<sup>N</sup>` refs to anchor entries.

## Card Composer

- [ ] Add optional per-card notes in composed documents.
- [ ] Add citation-format presets and bibliography appendix generation.

## UI/UX & Bug Checklist

- [ ] **Graph view — 'return to repository' for the companion card** · Add a way to navigate back to the card repository from the companion card panel (`GraphPanel`) in the graph view — it currently only has "Ver tarjeta completa" and "Explorar desde aquí".
- [ ] Replace <p>Cargando tarjetas...</p> with a proper spinner.
- [ ] **CardItem — tooltip overflow clipping** · Tooltips in `CardItem.svelte` are clipped by the parent container's boundary. Needs a portal implementation to render tooltips at the body level.
- [ ] **Component doc route** · Create `/doc` route with isolated component examples (Tag variants, sizes, states) for faster front-end iteration. Evaluate after current feature branch.
- [ ] **Search bar** · The search bar parameters reset each time the bar is closed, the state should be preserved until the user explicitly resets it. It should be reset under specific conditions (e.g. when the user selects a tag from a card). Those conditions should be explored — currently it obfuscates the search UX.

## Graph network — entry / landing experience (revisit later)

- [ ] Revisit whether the graph needs a standalone landing / a "Red" nav entry, or should stay contextual (reached from a card), instead of today's random-card starter.
  - Current state: `/cards/graph` with no `origin` shows a "Elegir una tarjeta al azar" (random) starter + a link back to `/cards`; no nav link; the graph is a card's "explore relationships" view.
  - Random (and even N random suggestions) feels arbitrary when landing on 1 card among ~2,648 without context; a guided "wizard" (author → book → card, or tag → random) would largely duplicate the `/cards` search/filter.
  - Possible direction: surface a prominent "Explorar red" action on cards / card list (contextual entry, no landing), and/or thematic starting points based on hub cards (highest in-degree in `card-relations.json`).
  - Stop point reached: current random + repo fallback is good enough so users who land there don't feel stuck. Revisit the direction later.

## Content quality (future)

- [ ] **AI-assisted card cleanup** · Cards are hand-typed and accumulate small issues: misplaced formatting (`(**1994)**`), missing accents (`semiotca`), stray characters. Two-pass approach: (1) mechanical regex fixes for obvious tag repair (deterministic, no AI), (2) AI review pass that surfaces typos as diffs for human approval — not auto-apply. Key constraint: don't alter quotes or proper nouns; use the book title as context. Prototype the mechanical pass first as the safest win.

## Performance

- [x] ~~Investigate build time regression~~ · Solved on the Vercel-adapter branch: the 2,700+ prerendered card pages were emitting 2 routes each in the Build Output API, blowing past the 2,048 route limit and forcing a slow build. Set `prerender = false` on `/cards/[id]` so the catchall serverless function renders them on the fly. Build time went from ~4m30 to ~30s.

## Data layer (one day)

- [ ] **Move card data into SQLite / libSQL** · Cards are currently a ~5 MB `cards.json` + ~2.5 MB `card-relations.json`, inlined at build time into the catchall function bundle (now ~9.4 MB) so it can be read at runtime (process.cwd() is `/var/task/` in Vercel's Node runtime). Shipping SQLite instead would be smaller and faster to query per-card, and sidestep the whole "bundle the JSON" dance.
  - Prereq: a real DB schema (currently Turso/libSQL holds only `tag_reports`).
  - Once the DB is the source of truth, we could build a small **admin panel** to insert new cards, and do in-place edits/retagging from the browser — that's the actual prize, the storage format is secondary.
  - Note this is a tall order; the bundled-JSON approach works fine for now, so treat the DB as an enabler for the admin panel, not a performance fix.

## Frontend testing (when needed)

- [ ] Set up Vitest for the frontend. Priority targets: `html.ts` (sanitizeHtml, htmlToPdfmake, htmlToMarkdown) — pure regex/parser logic that's easy to regress. Skip component tests for now.
