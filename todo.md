- [x] Design and build the landing page with hero section, feature links, and navigation.
- [x] Create a CV page with resume content and a PDF download/viewer link.
- [x] Add a blog listing page plus post view support for existing blog content.
- [x] Add a docs/PDF page to list and serve PDF resources.
- [x] Build the card repository page:
  - load `cards.json`
  - support search, filtering, and card detail views
  - add a table of contents / book grouping navigation
- [x] Implement client-side search indexing for cards, titles, and metadata.
- [x] Add shared layout components: header, footer, and page sections.
- [x] Create a minimal style system using Skeleton and Tailwind.
- [x] Wire the frontend to static assets and generated JSON output.
- [x] Ensure the frontend deploys as a static site and can be built from the root.
- [x] Prototype automated tag generation / cross-card reference discovery from `cards.json` using an LLM or semantic vectorizer.
  - [x] Review `paraphrase-multilingual-MiniLM-L12-v2` and `embedding-gemma` for card classification by topic and as a search axis.
- [x] Card Images
  - [x] Add support for card images in `cards.json` and display them in the UI.
  - [x] Extract images from source documents via backend and sync to static assets.
  - [x] Render images inline in expand-in-place card view and on the `/cards/[id]` detail page.
  - [ ] Implement image optimization and responsive loading for card images.
- [x] Card Metadata
  - [x] Add support for additional metadata fields in `cards.json` (e.g., tags, categories, related cards).
  - [x] Implement filtering and sorting of cards based on metadata in the UI.
- [x] Card Detail View
  - [x] Create a detailed view for each card that displays all relevant information and metadata.
  - [x] Add expand-in-place "Ver detalle" in `CardItem` with images and highlighted text.
  - [x] Add navigation from the card listing to the card detail view (opens in new tab).
  - [x] Restore scroll position / return-to-card after navigating back from detail page.
- [x] Search Functionality
  - [x] Implement a search bar that allows users to search for cards by title, content, and metadata.
  - [x] Add support for advanced search features (author chips, match mode, field toggles).
  - [x] Highlight search terms in the search results for better visibility.
  - [x] Improve result ranking with coverage bonus and per-field score caps.
  - [x] Add 200ms debounce on search input to reduce lag.
  - [x] Full Results Mode — "Ver todos" expands popup results into main card list.
  - [x] Focus handoff to selected card after closing search popup.
  - [x] Search bar on `/cards/[id]` navigates back to `/cards` before opening popup.

## Style audit (2026-04-28)

- [x] **#1 — Dual design system** · Home, blog, docs, and CV pages still use Skeleton UI tokens (`variant-filled-primary`, `bg-surface-50/85`, `text-surface-900`, etc.) while cards + shared components use DaisyUI. Dark mode won't work correctly on the Skeleton pages until migrated.
- [x] **#2 — Home page `<title>`** · Currently reads "Semioteca Frontend" instead of "Semioteca".
- [x] **#3 — Home page buttons** · `btn variant-filled-primary` / `btn variant-outline-surface` are unmigrated Skeleton classes; should become `btn btn-primary` / `btn btn-outline`.
- [x] **#4 — Blog `prose` link colour** · Uses `prose-a:text-primary-700` (Skeleton token), may clash with DaisyUI primary in dark mode.
- [x] **#5 — Footer dark mode** · `bg-base-200` / `text-base-content` are DaisyUI CSS variables that update automatically in dark mode — no manual `dark:` overrides needed. Header's `dark:` classes are only for the custom translucent blur effect, not a correctness requirement.
- [x] **#6 — Card ID visible to users** · Removed the raw `{card.id}` span from `CardItem` footer.
- [x] **#7 — Blog post has no back-navigation** · Added "← Volver al blog" button above the article on `/blog/[slug]`.
- [x] **#8 — `scroll-mt-28` fixed offset** · Cards use a fixed 7 rem scroll offset but the header height changes dynamically; may under/overshoot.
- [x] **#9 — Inconsistent border-radius scale** · Docs rows use `rounded-xl`, cards/blog use `rounded-2xl` / `rounded-[1.75rem]` / `rounded-[2rem]` — no consistent scale.
- [x] **#10 — Heading hierarchy** · `PageSection` emits `<h2>` but the cards page has no wrapping `<h1>`; blog post and home page have their own ad-hoc `<h1>` outside the component.

## Card Composer (2026-04-28)

- [x] MVP: Let users compose a custom document from selected cards.
  - [x] Add a composer store with local persistence (`semioteca:composer:v1`).
  - [x] Add "Add to document" action in card list and card detail views.
  - [x] Build `/cards/compose` page with ordered card table/list and remove actions.
  - [x] Support reorder via move up/down controls.
  - [x] Add document metadata fields (title required, subtitle/compiler/intro optional).
  - [x] Add export flow — Markdown and PDF download.
- [ ] Phase 2: Improve export quality and scale.
  - [ ] Tune print CSS (A4/Letter, page-break controls, readable grayscale output).
  - [ ] Add optional per-card notes in composed documents.
  - [ ] Add local snapshots (multiple saved compositions).
- [ ] Phase 3: Advanced capabilities.
  - [ ] Evaluate server-rendered PDF for deterministic pagination.
  - [ ] Add shareable composition links or account-backed saved documents.
  - [ ] Add citation-format presets and bibliography appendix generation.

Cards from the same file are being tagged as different because of small name discrepancies,
probably the best avenue is to extract `Metadata` at the file level once and assing it to all
cards in the lot, maybe even hand curate as we do for the regex patterns to ensure consistent author names, source titles, and tag sets. Examples:

- Eco 1992, Eco 1994... should all be tagged as "Eco", same book different edition.
- Ted Honderich appears as "Honderich", "Ted Honderich", even the same book will be split at the persitence and front layers if the author name isn't consistent.

## UI/UX & Bug Checklist

- [x] **TOC hidden behind navbar on mobile** · Fixed — mobile drawer now has header-height padding.
- [x] **TOC doesn't update after search** · Fixed — TOC now reflects filtered results in full results mode; BookSidebar hidden during search.
- [ ] **Lyons 1997 extraction has a weird postfix escaping the regex match** · All or most cards start with `Semántica lingüística. Una introducción. Barcelona: Paidós.` — the file-level regex seems to be matching a trailing postfix for each card; needs investigation/fix in the extraction logic.
- [ ] **Graph view — 'return to repository' for the companion card** · Investigate adding a way to navigate back to the card repository from the companion card node in the graph view.

## Graph network — entry / landing experience (revisit later)

- [ ] Revisit whether the graph needs a standalone landing / a "Red" nav entry, or should stay contextual (reached from a card), instead of today's random-card starter.
  - Current state: `/cards/graph` with no `origin` shows a "Elegir una tarjeta al azar" (random) starter + a link back to `/cards`; no nav link; the graph is a card's "explore relationships" view.
  - Random (and even N random suggestions) feels arbitrary when landing on 1 card among ~2,648 without context; a guided "wizard" (author → book → card, or tag → random) would largely duplicate the `/cards` search/filter.
  - Possible direction: surface a prominent "Explorar red" action on cards / card list (contextual entry, no landing), and/or thematic starting points based on hub cards (highest in-degree in `card-relations.json`).
  - Stop point reached: current random + repo fallback is good enough so users who land there don't feel stuck. Revisit the direction later.

## Shareable search URLs

- [x] Sync search state (query, tags, authors, match mode) to URL on committed search (Enter / "Ver todos").
  - [x] On page load with URL params, enter full results mode pre-populated.
  - [x] Consider Esc vs Enter UX: popup for browsing, Enter commits to full results.

## Onboarding / First-use guidance

- [ ] Design an onboarding experience for new visitors.
  - What to teach: what cards are, search/filter, graph view, composer.
  - Options to evaluate:
    - **Tooltips/popovers** on key elements (DaisyUI tooltips) — low effort, easy to miss.
    - **Overlay walkthrough** (step-by-step spotlight) — more engaging, more code.
    - **Dedicated help page** — simple but requires user to navigate to it.
    - **Empty-state messaging** — already partially done in the search dialog.
  - Decide on approach and implement.
