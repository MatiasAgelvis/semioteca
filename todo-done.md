# Done — archive

Completed work, moved out of `todo.md` to keep it short. Items here are finished; see `todo.md` for open work.

## Core site

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

## Card Images (display pipeline — image optimization still open in `todo.md`)

- [x] Add support for card images in `cards.json` and display them in the UI.
- [x] Extract images from source documents via backend and sync to static assets.
- [x] Render images inline in expand-in-place card view and on the `/cards/[id]` detail page.

## Card Metadata

- [x] Add support for additional metadata fields in `cards.json` (e.g., tags, categories, related cards).
- [x] Implement filtering and sorting of cards based on metadata in the UI.

## Card Detail View

- [x] Create a detailed view for each card that displays all relevant information and metadata.
- [x] Add expand-in-place "Ver detalle" in `CardItem` with images and highlighted text.
- [x] Add navigation from the card listing to the card detail view (opens in new tab).
- [x] Restore scroll position / return-to-card after navigating back from detail page.

## Search Functionality

- [x] Implement a search bar that allows users to search for cards by title, content, and metadata.
- [x] Add support for advanced search features (author chips, match mode, field toggles).
- [x] Highlight search terms in the search results for better visibility.
- [x] Improve result ranking with coverage bonus and per-field score caps.
- [x] Add 200ms debounce on search input to reduce lag.
- [x] Full Results Mode — "Ver todos" expands popup results into main card list.
- [x] Focus handoff to selected card after closing search popup.
- [x] Search bar on `/cards/[id]` navigates back to `/cards` before opening popup.

## Style audit (2026-04-28)

- [x] **#1 — Dual design system** · Home, blog, docs, and CV pages migrated from Skeleton UI tokens to DaisyUI; dark mode now correct on all pages.
- [x] **#2 — Home page `<title>`** · Now reads "Semioteca".
- [x] **#3 — Home page buttons** · Now `btn btn-primary` / `btn btn-outline`.
- [x] **#4 — Blog `prose` link colour** · Unified with DaisyUI primary.
- [x] **#5 — Footer dark mode** · Uses DaisyUI variables; updates automatically, no manual `dark:` overrides needed.
- [x] **#6 — Card ID visible to users** · Removed the raw `{card.id}` span from `CardItem` footer.
- [x] **#7 — Blog post has no back-navigation** · Added "← Volver al blog" on `/blog/[slug]`.
- [x] **#8 — `scroll-mt-28` fixed offset** · Now uses `var(--header-height)`.
- [x] **#9 — Inconsistent border-radius scale** · Unified across docs/cards/blog.
- [x] **#10 — Heading hierarchy** · Cards page now has a wrapping `<h1>`.

## Card Composer MVP (2026-04-28)

- [x] Composer store with local persistence (`semioteca:composer:v1`).
- [x] "Add to document" action in card list and card detail views.
- [x] `/cards/compose` page with ordered card table/list and remove actions.
- [x] Reorder via move up/down controls.
- [x] Document metadata fields (title required, subtitle/compiler/intro optional).
- [x] Export flow — Markdown and PDF download.
- [x] Print output tuning (A4/Letter, per-card page breaks, readable styles) via pdfmake.

## Shareable search URLs

- [x] Sync search state (query, tags, authors, match mode) to URL on committed search (Enter / "Ver todos").
- [x] On page load with URL params, enter full results mode pre-populated.
- [x] Consider Esc vs Enter UX: popup for browsing, Enter commits to full results.

## Onboarding / First-use guidance

- [x] Design an onboarding experience for new visitors (approach decided and implemented).

## UI/UX fixes

- [x] TOC hidden behind navbar on mobile — mobile drawer now has header-height padding.
- [x] TOC doesn't update after search — now reflects filtered results in full results mode; BookSidebar hidden during search.
- [x] Lyons 1997 extraction weird postfix — fixed in the extraction logic.
