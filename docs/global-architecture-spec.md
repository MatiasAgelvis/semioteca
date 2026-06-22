# Semioteca — Global Architecture Spec

## Overview

Semioteca is a static site for cataloguing and exploring textual citations extracted from source documents about semantics, pragmatics, linguistics, semiotics, and philosophy of language. It functions as a didactic research tool for students and thesis advisors.

**Stack**: SvelteKit 5 (with runes mode) + Tailwind CSS 4 + daisyUI 5  
**Adapter**: `@sveltejs/adapter-static` — fully prerendered static output  
**Backend**: Python scripts that process ODT/DOCX files into structured JSON  
**Deployment**: Vercel (via adapter-static + 404.html fallback for SPA routing)

---

## Route tree

```
/                               Home — stats overview, recent blog posts
├── blog/                       Blog — list of posts
│   └── [slug]/                 Single blog post (rendered from markdown)
├── cards/                      Card repository — grouped by book, full-text search
│   ├── [id]/                   Single card detail view
│   └── graph/                  Interactive graph explorer (client-side only)
├── contact/                    Contact form (submits to staticforms.dev)
├── cv/                         Academic CV with PDF resources
└── docs/                       Document library (hidden by feature flag)
```

### Route details

| Route | Prerendered | Data source | View type |
|---|---|---|---|
| `/` | yes | `cards.json`, `blog/*.md` | Static (build-time) |
| `/blog` | yes | `static/content/blog/*.md` | Static (build-time) |
| `/blog/[slug]` | yes | `static/content/blog/[slug].md` | Static (build-time) |
| `/cards` | yes | `static/content/cards.json` | Static (build-time) |
| `/cards/[id]` | yes | `static/content/cards.json`, `card-relations.json` | Static (build-time) |
| `/cards/graph` | no | `cards.json`, `card-relations.json` (client-side fetch) | Client-side |
| `/contact` | yes | — (client-side form submission) | Static |
| `/cv` | yes | `static/content/cv/*.pdf` | Static (build-time) |
| `/docs` | yes | `static/content/cv/*.pdf` (shared with cv/) | Static (build-time) |

The graph page (`/cards/graph`) is the only route that is **not** prerendered — it uses `export const prerender = false` and fetches data client-side. All other routes build their full page set at build time.

---

## Data files

### Static content directory (`frontend/static/content/`)

All JSON and media files are synced from the `backend/` directory via `npm run content:sync` (see [Content pipeline](#content-pipeline)).

```
static/content/
├── cards.json              Card dataset — all books, cards, tags, images
├── card-relations.json     Pre-computed related-card scores (keyed by card ID)
├── card-tags.json          Tag taxonomy definitions
├── cards_images/           Extracted images referenced by card entries
├── blog/                   Markdown blog posts
│   └── *.md
└── cv/                     PDF academic resources
```

### cards.json shape

```json
{
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "book": "Book Title",
      "year": "2020",
      "cards": [
        {
          "id": "author-2020-title-42",
          "title": "Book Title",
          "author": "Author Name",
          "book": "Book Title",
          "year": "2020",
          "page": "45",
          "raw_marker": "p. 45",
          "content": "Card text with optional [[IMAGE:1]] placeholders...",
          "source_path": "author-2020-title.odt",
          "source_format": "odt",
          "images": [
            {
              "path": "cards_images/author-2020-title/img_1.png",
              "filename": "img_1.png",
              "internal_path": null,
              "caption": null,
              "placeholder_id": 1,
              "alt_text": null
            }
          ],
          "tags": ["tag-slug-1", "tag-slug-2"]
        }
      ]
    }
  ]
}
```

### card-relations.json shape

```json
{
  "card-id-1": [
    { "id": "card-id-2", "score": 0.87 },
    { "id": "card-id-3", "score": 0.74 }
  ]
}
```

Each entry contains the top 10 related cards per card, sorted by descending score (0–1 hybrid similarity score).

### card-tags.json shape

```json
[
  { "name": "tag-slug", "description": "Human-readable description" }
]
```

---

## Component tree

### Layout (`routes/+layout.svelte`)

```
SiteHeader
├── Nav links:
│   ├── / (Inicio)
│   ├── /cards (Tarjetas)
│   ├── /blog (Blog)
│   ├── /contact (Contacto)
│   └── /cv, /docs (if feature-flagged on)
└── Theme toggle (light/dark)

<main>
  {@render children()}   ← page content

SiteFooter
GlobalToast
```

### Shared components (`lib/components/`)

| Component | Used in | Purpose |
|---|---|---|
| `SiteHeader` | layout | Navigation, theme toggle |
| `SiteFooter` | layout | Footer with links and credits |
| `GlobalToast` | layout | Temporary notification messages |
| `PageSection` | home, blog, cv, docs | Section wrapper with title + description |
| `BlogPostCard` | home, blog | Blog post preview card |
| `RelatedCardsBar` | `[id]/+page.svelte` | Bottom bar showing related card count |
| `RelatedCardsSheet` | `[id]/+page.svelte`, `cards/+page.svelte` | Modal listing related cards |
| `CardItem` | `cards/+page.svelte` | Single card row in the list view |
| `BookSidebar` | `cards/+page.svelte` | Sidebar with book grouping |
| `CardsToc` | `cards/+page.svelte` | Table of contents across cards |
| `SearchResultItem` | `cards/+page.svelte` | Search result row in the search dialog |

### Graph components (`lib/components/graph/`)

| Component | Purpose |
|---|---|
| `GraphCanvas.svelte` | D3 force-directed SVG with simulation, zoom/pan, hover/click |
| `GraphToolbar.svelte` | Depth slider (1/2/3), legend toggle, back link |
| `GraphTooltip.svelte` | Floating hover card with author/book/year/page |
| `GraphLegend.svelte` | Author color + connection size scale |

### Stores (`lib/stores/`)

| Store | Purpose |
|---|---|
| `cardsSearch` | Shared search state (query, dialog open, initial tags) — used to coordinate search from blog to cards |

---

## View-by-view behavior

### Home (`/`)

- Shows total card/books counts from `cards.json`
- Shows 3 most recent blog posts
- Hero section with site description

### Blog index (`/blog`)

- Grid of all blog posts, sorted chronologically
- Each card shows title, excerpt, date
- Post metadata extracted from markdown frontmatter

### Blog post (`/blog/[slug]`)

- Full rendered HTML from markdown
- Uses `marked` for markdown→HTML conversion at build time
- Prerendered: each post gets its own HTML file

### Cards repository (`/cards`)

The most complex view. Features:

- **Book grouping**: Cards grouped by author/year/book into collapsible book sections
- **Full-text search**: Client-side search across card content, author/book, page, and tags
- **Advanced filters**: Author and tag multi-select with AND/ANY match mode, per-field toggles
- **Search results**: Separate search modal with ranked results using TF-IDF scoring
- **Related Cards**: Each card item has a related-card button that opens a modal
- **Graph entry**: RelatedCardsSheet has an "Explorar conexiones en grafo" button

### Card detail (`/cards/[id]`)

- Full card content with embedded images
- `RelatedCardsBar` with count + graph icon
- `RelatedCardsSheet` with related card list + graph entry

### Card graph explorer (`/cards/graph`)

- **Not prerendered** — client-side only
- Loads `cards.json` + `card-relations.json` via `fetch()`
- BFS graph construction up to depth 3
- D3 force-directed layout, computed synchronously
- CSS-transition-based node settling animation
- Hover tooltips, click-to-navigate, pan/zoom
- Author color legend with connection size scale

### Contact (`/contact`)

- Client-side form submission to staticforms.dev
- No server component — form sends directly to external API

### CV (`/cv`) and Docs (`/docs`)

- Feature-flagged (currently both off)
- List PDF resources from `static/content/cv/`
- CV additionally has an academic profile section

---

## Content pipeline

### Workflow

```
ODT/DOCX source files
        ↓
[generate_cards_json.py]   → outputs: cards.json + cards_images/
        ↓
[tag_cards.py]             → tags cards via NLI or embedding model
        ↓
[generate_card_relations.py] → outputs: card-relations.json
        ↓
[sync-content.mjs]         → copies everything to frontend/static/content/
        ↓
[npm run frontend:build]   → SvelteKit prerenders all routes using static files
        ↓
Vercel deploy
```

### npm scripts (from root `package.json`)

| Script | Description |
|---|---|
| `npm run content:generate` | Run card extraction from source documents |
| `npm run content:relations` | Compute related-card scores |
| `npm run content:sync` | Copy backend outputs to frontend static dir |
| `npm run content:prepare` | All three above in sequence |
| `npm run frontend:dev` | Start SvelteKit dev server |
| `npm run frontend:build` | Production build |
| `npm run build` | Frontend build only (content assumed ready) |

### Server data loading (`lib/server/content.ts`)

All server-side loaders are **build-time only** (adapter-static prerendering). They read directly from `static/content/` using Node `fs`:

- `readCardsDataset()` — parses `cards.json`
- `readCardRelations()` — parses `card-relations.json`
- `buildRelatedCards(cardId)` — merges relation entries with card metadata
- `listBlogPosts()` — reads markdown files from `static/content/blog/`
- `getBlogPostBySlug(slug)` — reads + renders a single blog post
- `listPdfResources()` — reads PDF metadata from `static/content/cv/`

The graph page loads these same files client-side via `fetch()` since it cannot be prerendered.

---

## Feature flags

Defined in `lib/config/features.ts`:

```ts
export const SHOW_DOCS = false;  // Toggles /docs route visibility
export const SHOW_CV = false;    // Toggles /cv route visibility
```

These flags control both the route loader output and the nav link visibility in `SiteHeader`.

---

## Build and deployment

### Build process

1. Content is generated and synced (see [Content pipeline](#content-pipeline))
2. `npm run frontend:build` runs `vite build` via SvelteKit
3. All prerendered routes become static HTML files
4. Non-prerendered routes (`/cards/graph`) use the SPA fallback (`404.html` via `adapter-static`)

### Vercel config

```
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Combined with the `adapter-static` fallback option, this ensures client-side routes work on direct URL access.

### Routing strategy

Since the site is fully prerendered with `adapter-static`:

- **Prerendered pages** are served as flat HTML files (e.g., `/cards/author-2020-title-42.html`)
- **The graph page** (`/cards/graph`) is not prerendered — Vercel's rewrite rule sends all non-matched requests to the SPA shell
- SvelteKit's client-side router handles graph navigation once the JS loads
