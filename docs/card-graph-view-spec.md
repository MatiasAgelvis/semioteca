# Card Graph View — Spec

## Goal

Add a dedicated force-directed graph page for exploring card relationships visually. Enable researchers to browse clusters, identify hub cards, and traverse connections beyond the flat "Related Cards" list.

---

## Context

`card-relations.json` is already synced to `frontend/static/content/` (~2.4 MB, keyed by card ID). Each card has up to 10 related cards with scores. `cards.json` holds the full dataset with metadata.

Both files are static and already fetched client-side by the existing `/cards` list page. The graph page will fetch the same files — browser cache makes this instant when coming from `/cards`.

**No new backend work, no API, no database.**

---

## Route

`/cards/graph?origin={cardId}`

- Single dynamic page — no prerendering overhead (not 300+ routes)
- `?origin=` provides the starting card to center the graph around
- Without `?origin=`: show global graph, prompt user to search/select a card

---

## Entry points

### Entry 1: From the Related Cards sheet

Add a link at the bottom of `RelatedCardsSheet.svelte`:

```
📊 Explorar conexiones en grafo →  {{count}} tarjetas
```

Clicking it navigates to `/cards/graph?origin={currentCardId}`. The sheet closes before navigation (handled by our existing `onselect` or `goto` pattern).

### Entry 2: From the card detail page

Add a subtle icon/link near the "X tarjetas relacionadas" button in `[id]/+page.svelte`:

```
[ 4 tarjetas relacionadas ] [ 🔗 ]
```

This gives users who land directly on a card (via URL) access to the graph without opening the sheet first.

### Entry 3 (future): Global graph

A nav item `/cards/graph` without origin — shows the full network or a search input to pick a starting card.

---

## Component tree

```
routes/cards/graph/+page.svelte          (page shell)
├── GraphToolbar.svelte                   (top bar: back link, depth, legend toggle)
├── GraphCanvas.svelte                    (force-directed SVG, main interaction area)
│   ├── <svg> nodes (circles + labels)
│   └── <svg> edges (lines)
├── GraphLegend.svelte                    (color/size explanation, shown on toggle)
└── GraphTooltip.svelte                   (hover card: author, book, year, page)
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| `+page.svelte` | Load data, parse `?origin=`, manage depth/focus state, wire props |
| `GraphToolbar` | Depth slider (1/2/3), legend toggle, "← Volver" link, origin card name |
| `GraphCanvas` | D3-force simulation, SVG rendering, pan/zoom, click-to-refocus, hover detection |
| `GraphLegend` | Explains node color (by author/book), node size (connection count), edge opacity (score) |
| `GraphTooltip` | Shows `Author — Book (Year) · p. X` on hover |

---

## Graph behavior

### Depth slider

A segmented control: `1 · 2 · 3`

| Depth | Nodes (approx) | UX |
|---|---|---|
| 1 | ~10 | Familiar: the sheet, visualized. Origin at center. |
| 2 | ~30–60 | Sweet spot. Clusters emerge, cross-book bridges visible. |
| 3 | ~80–150 | Busy but explorable with pan/zoom. Fade weaker edges. |

The graph rebuilds when depth changes via a CSS transition or layout animation to avoid jarring jumps.

### Refocus

- Click a node → that card becomes the new origin at depth 1
- URL updates: `?origin={newCardId}`
- Browser back button restores previous origin + depth
- Origin node is visually distinct (larger, bolder border, filled)

### Pan & zoom

- Scroll to zoom, drag to pan (standard D3 zoom behavior)
- Double-click resets view to fit the graph

### Tooltip

- Hovering a node shows a small floating tooltip with: `Author — Book (Year) · p. X`
- 300ms delay to avoid flickering during fast mouse movement

---

## Visual encoding

| Property | Encodes | Rationale |
|---|---|---|
| **Node size** | Connection count (degree) | Hub cards pop visually — high-degree nodes are conceptually central |
| **Node color** | Group by author or book (toggleable) | Surfaces clusters and bridges between books/authors |
| **Node opacity** | 1.0 for origin, 0.85 for others | Origin stands out without being gaudy |
| **Edge thickness** | Score (0.5px–2px) | Stronger connections draw the eye |
| **Edge opacity** | Score (0.15–0.4) | Weak connections recede, strong ones dominate |
| **Origin node** | Filled, larger, bolder border, labeled prominently | User always knows where they are |

---

## UX flows

### Flow A: From card detail → graph → card detail

```
Card detail page
  → click [🔗] or "Related Cards" bar → sheet → "Explorar en grafo"
  → lands on /cards/graph?origin=abc123 at depth 1
  → explores, pans, zooms, clicks a node (refocuses to def456)
  → url updates to ?origin=def456
  → clicks "← Volver" → goes to /cards/def456 (the current origin card detail)
```

### Flow B: From list view → graph → list

```
Cards list page
  → click "Related Cards" on a card → sheet → "Explorar en grafo"
  → lands on /cards/graph?origin=abc123
  → explores, clicks node (refocus)
  → clicks "← Volver" → goes to /cards/{current origin} (card detail)
```

The "← Volver" link always points to the current origin card's detail page, not the previous page. This is simpler and more predictable than tracking the previous route.

---

## Data loading strategy

Both `card-relations.json` and `cards.json` are loaded client-side via `fetch()`:

```ts
const [cardsData, relationsData] = await Promise.all([
  fetch('/content/cards.json').then(r => r.json()),
  fetch('/content/card-relations.json').then(r => r.json()),
]);
```

- Browser cache: if user navigates from `/cards`, both files are already cached (the list page fetches them)
- `cards.json` provides metadata for node labels and grouping
- `card-relations.json` provides the edge list

Build-time prerendering is NOT used for this page — it's a client-side interactive tool.

---

## Dependencies

- **d3-force** — force-directed layout simulation
- **d3-selection** — DOM manipulation for zoom/pan behavior
- **d3-zoom** — pan and zoom interaction

No full D3 bundle. These three modules total ~40 KB gzipped.

```bash
npm i d3-force d3-selection d3-zoom
npm i -D @types/d3-force @types/d3-selection @types/d3-zoom
```

---

## Implementation steps

### Step 1 — Dependencies
- Install d3-force, d3-selection, d3-zoom and their types

### Step 2 — Page shell
- Create `routes/cards/graph/+page.svelte` with basic layout
- Parse `?origin=` from URL
- Fetch `cards.json` and `card-relations.json` client-side
- Build graph data structure (nodes + links) up to selected depth

### Step 3 — GraphCanvas
- Create `lib/components/graph/GraphCanvas.svelte`
- Initialize D3 force simulation in `$effect`
- Render nodes (circles) and edges (lines) as Svelte-reactive SVG
- Add pan/zoom with `d3-zoom`
- Node click → refocus, node hover → tooltip emit

### Step 4 — Toolbar
- Create `lib/components/graph/GraphToolbar.svelte`
- Depth slider (1/2/3 segmented control)
- Legend toggle
- "← Volver" link to `/cards/{currentOrigin}`

### Step 5 — Tooltip
- Create `lib/components/graph/GraphTooltip.svelte`
- Positioned near cursor on hover
- Shows author, book, year, page

### Step 6 — Legend
- Create `lib/components/graph/GraphLegend.svelte`
- Explains color coding (author/book) and size encoding

### Step 7 — Entry points
- Add "Explorar en grafo" link to `RelatedCardsSheet.svelte`
- Pass current card ID down to the sheet for the link
- Add graph icon link to `[id]/+page.svelte` near related cards button

### Step 8 — Polish
- CSS transitions on depth changes
- Loading state while fetching data
- Empty state when no relations exist
- Responsive layout (vertical toolbar on mobile)
