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

| Component      | Responsibility                                                                           |
| -------------- | ---------------------------------------------------------------------------------------- |
| `+page.svelte` | Load data, parse `?origin=`, manage depth/focus state, wire props                        |
| `GraphToolbar` | Depth slider (1/2/3), legend toggle, "← Volver" link, origin card name                   |
| `GraphCanvas`  | D3-force simulation, SVG rendering, pan/zoom, click-to-refocus, hover detection          |
| `GraphLegend`  | Explains node color (by author/book), node size (connection count), edge opacity (score) |
| `GraphTooltip` | Shows `Author — Book (Year) · p. X` on hover                                             |

---

## Graph behavior

### Depth slider

A segmented control: `1 · 2 · 3`

| Depth | Nodes (approx) | UX                                                       |
| ----- | -------------- | -------------------------------------------------------- |
| 1     | ~10            | Familiar: the sheet, visualized. Origin at center.       |
| 2     | ~30–60         | Sweet spot. Clusters emerge, cross-book bridges visible. |
| 3     | ~80–150        | Busy but explorable with pan/zoom. Fade weaker edges.    |

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

| Property           | Encodes                                            | Rationale                                                           |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| **Node size**      | Connection count (degree)                          | Hub cards pop visually — high-degree nodes are conceptually central |
| **Node color**     | Group by author or book (toggleable)               | Surfaces clusters and bridges between books/authors                 |
| **Node opacity**   | 1.0 for origin, 0.85 for others                    | Origin stands out without being gaudy                               |
| **Edge thickness** | Score (0.5px–2px)                                  | Stronger connections draw the eye                                   |
| **Edge opacity**   | Score (0.15–0.4)                                   | Weak connections recede, strong ones dominate                       |
| **Origin node**    | Filled, larger, bolder border, labeled prominently | User always knows where they are                                    |

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
  fetch('/content/cards.json').then((r) => r.json()),
  fetch('/content/card-relations.json').then((r) => r.json()),
]);
```

- Browser cache: if user navigates from `/cards`, both files are already cached (the list page fetches them)
- `cards.json` provides metadata for node labels and grouping
- `card-relations.json` provides the edge list

Build-time prerendering is NOT used for this page — it's a client-side interactive tool.

---

## Data model

### In-memory graph types

```ts
// lib/types/graph.ts

export interface GraphNode {
  id: string;
  author: string;
  book: string;
  year: string;
  page: string | null;
  degree: number; // total connections in the loaded subgraph
  isOrigin: boolean;
  // Layout (populated by D3)
  x: number;
  y: number;
  fx: number | null; // fixed position for origin node
  fy: number | null;
}

export interface GraphLink {
  source: string; // node ID
  target: string; // node ID
  score: number; // 0–1
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
```

### URL state

The page uses a SvelteKit `$page` store to sync `origin` and `depth` with the URL:

```
/cards/graph?origin=putnam-1994-las-mil-caras-del-realismo-3&depth=2
```

- `origin` → always a card ID, determines the root of the BFS
- `depth` → 1, 2, or 3 (defaults to 1 when changing origin, user's last choice otherwise)
- Both params are optional; missing `origin` shows a prompt to select a card

---

## Graph construction (BFS)

The graph is built client-side from the two JSON files via breadth-first traversal:

```ts
function buildGraph(
  originId: string,
  depth: number,
  relations: Record<string, CardRelationEntry[]>,
  cardMap: Map<string, CardRecord>,
): GraphData {
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [{ id: originId, level: 0 }];
  visited.add(originId);

  const links: GraphLink[] = [];

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const entries = relations[id];
    if (!entries?.length || level >= depth) continue;

    for (const entry of entries) {
      links.push({ source: id, target: entry.id, score: entry.score });
      // Link exists both ways; only traverse if not yet visited
      if (!visited.has(entry.id)) {
        visited.add(entry.id);
        queue.push({ id: entry.id, level: level + 1 });
      }
    }
  }

  // Build nodes from visited set
  const nodes: GraphNode[] = Array.from(visited).map((id) => {
    const card = cardMap.get(id);
    return {
      id,
      author: card?.author ?? '',
      book: card?.book ?? '',
      year: card?.year ?? '',
      page: card?.page ?? null,
      degree: 0, // computed below
      isOrigin: id === originId,
      x: 0,
      y: 0,
      fx: id === originId ? 0 : null, // pin origin to center
      fy: id === originId ? 0 : null,
    };
  });

  // Compute degree (only within the loaded subgraph, not the full dataset)
  for (const link of links) {
    const source = nodes.find((n) => n.id === link.source);
    const target = nodes.find((n) => n.id === link.target);
    if (source) source.degree++;
    if (target) target.degree++;
  }

  return { nodes, links };
}
```

**Key decisions**:

- Origin node is pinned (`fx/fy`) to the SVG center so it doesn't drift during simulation
- Degree is computed from the _loaded subgraph_, not the full `card-relations.json` — this makes hub detection relative to what's visible
- BFS respects `depth`: links at `depth` are included as edges but their targets don't spawn further traversal

---

## D3 force simulation

### Configuration

```ts
import { forceSimulation, forceLink, forceManyBody, forceCollide } from 'd3-force';

function createSimulation(nodes: GraphNode[], links: GraphLink[]) {
  return forceSimulation(nodes)
    .force(
      'link',
      forceLink(links)
        .id((d: any) => d.id)
        .distance((l: any) => 100 + (1 - l.score) * 200) // 100–300px based on score
        .strength((l: any) => 0.2 + l.score * 0.5), // 0.2–0.7
    )
    .force('charge', forceManyBody().strength(-300))
    .force(
      'collide',
      forceCollide().radius((d: any) => nodeRadius(d.degree) + 4), // prevent overlap
    )
    .alphaDecay(0.02) // slow cool-down for stable layout
    .velocityDecay(0.3); // damped movement
}
```

### Force rationale

| Force            | Value                           | Why                                                            |
| ---------------- | ------------------------------- | -------------------------------------------------------------- |
| `link.distance`  | 100–300 (inverse of score)      | Stronger relations pull nodes closer                           |
| `link.strength`  | 0.2–0.7 (proportional to score) | Strong edges resist being stretched                            |
| `charge`         | -300                            | Repulsion keeps nodes from overlapping; tuned for 10–150 nodes |
| `collide.radius` | `nodeRadius(degree) + 4`        | Prevents circle overlap, scales with node size                 |
| `alphaDecay`     | 0.02                            | Slower decay lets the layout settle gradually                  |
| `velocityDecay`  | 0.3                             | Dampens oscillations for a calmer graph                        |

### Node radius function

```ts
function nodeRadius(degree: number): number {
  return 6 + Math.min(degree * 3, 18); // climbs from 6 to 24
}
```

---

## Svelte-D3 integration pattern

The graph page uses the **Svelte-owns-DOM, D3-owns-physics** pattern:

1. D3 `forceSimulation` runs as a side effect, calling `.on('tick')` on each frame
2. The tick callback updates `$state` variables for node positions (`x`, `y`)
3. Svelte renders SVG circles and lines reactively from those state variables
4. D3 `zoom` behavior is attached to the SVG via `$effect` using `d3-selection`

```ts
// In GraphCanvas.svelte (conceptual)
let nodes = $state<GraphNode[]>([]);
let links = $state<GraphLink[]>([]);
let svgEl: SVGSVGElement;

$effect(() => {
  const sim = forceSimulation(nodes)
    .force(
      'link',
      forceLink(links).id((d) => d.id),
    )
    // ... other forces
    .on('tick', () => {
      // Mutate in place to trigger reactivity
      nodes = nodes;
    });

  return () => sim.stop();
});

$effect(() => {
  if (!svgEl) return;
  const zoom = d3Zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', (e) => {
      // update transform state
    });
  select(svgEl).call(zoom);
  return () => {
    select(svgEl).on('.zoom', null);
  };
});
```

**Critical note**: D3's force simulation mutates node objects in place (adds `x`, `y`, `vx`, `vy`). In Svelte 5 runes mode, we trigger reactivity after each tick by reassigning `nodes = nodes`. The origin node is pinned with `fx: 0, fy: 0` so it stays centered.

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

## Build guide

### File creation order (dependency chain)

Each step produces files that later steps depend on. Ordered so you can build and test incrementally.

```
1. types         lib/types/graph.ts
2. dep block     package.json (npm install)
3. data util     lib/utils/graph.ts
4. page shell    routes/cards/graph/+page.svelte    (renders loading/empty states)
5. GraphCanvas   lib/components/graph/GraphCanvas.svelte
6. GraphToolbar  lib/components/graph/GraphToolbar.svelte
7. GraphTooltip  lib/components/graph/GraphTooltip.svelte
8. GraphLegend   lib/components/graph/GraphLegend.svelte
9. entry points  RelatedCardsSheet.svelte, [id]/+page.svelte
10. polish        transitions, responsive, edge cases
```

---

### Step 1 — Types (`lib/types/graph.ts`)

Create the file with `GraphNode`, `GraphLink`, and `GraphData` interfaces from the [Data model](#data-model) section above.

Also add `GraphDepth` type:

```ts
export type GraphDepth = 1 | 2 | 3;
```

---

### Step 2 — Install dependencies

```bash
cd frontend
npm i d3-force d3-selection d3-zoom
npm i -D @types/d3-force @types/d3-selection @types/d3-zoom
```

---

### Step 3 — Data utility (`lib/utils/graph.ts`)

Export the `buildGraph` function from the [Graph construction](#graph-construction-bfs) section above.

Also export helpers:

```ts
/** Builds a lookup map: card ID → CardRecord */
export function buildCardMap(dataset: CardsDataset): Map<string, CardRecord> {
  const map = new Map<string, CardRecord>();
  for (const book of dataset.books) {
    for (const card of book.cards) {
      map.set(card.id, card);
    }
  }
  return map;
}

/** Returns author-color scale entries for legend rendering */
export function buildAuthorColors(nodes: GraphNode[]): Map<string, string> {
  const authors = [...new Set(nodes.map((n) => n.author))].sort();
  const colors = new Map<string, string>();
  const palette = [
    '#6366f1',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#84cc16',
    '#3b82f6',
  ];
  authors.forEach((a, i) => colors.set(a, palette[i % palette.length]));
  return colors;
}

/** Computes layout metadata for a node: radius, color, opacity */
export function nodeStyle(node: GraphNode, authorColors: Map<string, string>) {
  return {
    r: 6 + Math.min(node.degree * 3, 18),
    fill: authorColors.get(node.author) ?? '#888',
    opacity: node.isOrigin ? 1.0 : 0.85,
    stroke: node.isOrigin ? '#fff' : 'transparent',
    strokeWidth: node.isOrigin ? 3 : 0,
  };
}

/** Maps edge score to visual properties */
export function edgeStyle(score: number) {
  return {
    strokeWidth: 0.5 + score * 1.5, // 0.5–2.0
    opacity: 0.15 + score * 0.25, // 0.15–0.40
  };
}
```

---

### Step 4 — Page shell (`routes/cards/graph/+page.svelte`)

**What it does**:

- Parses `origin` and `depth` from `$page.url.searchParams`
- Fetches `cards.json` and `card-relations.json` on mount
- Calls `buildGraph(origin, depth, relations, cardMap)` to produce `GraphData`
- Renders toolbar and canvas, passes data down
- Handles refocus (update URL → graph rebuilds)

**State variables**:

```ts
let loading = $state(true);
let error = $state<string | null>(null);
let graphData = $state<GraphData>({ nodes: [], links: [] });
let authorColors = $state<Map<string, string>>(new Map());
let legendOpen = $state(false);
let hoveredNode = $state<GraphNode | null>(null);
let tooltipPos = $state({ x: 0, y: 0 });
```

**Structure**:

```svelte
<script lang="ts">
  // imports, state, data loading, buildGraph, refocus handler
</script>

{#if loading}
  <LoadingSpinner />
{:else if error}
  <ErrorBanner message={error} />
{:else if graphData.nodes.length === 0}
  <EmptyState message="No hay relaciones para esta tarjeta." />
{:else}
  <GraphToolbar {origin} {depth} {legendOpen} {onDepthChange} {onLegendToggle} />
  <div class="relative flex-1">
    <GraphCanvas {graphData} {authorColors} {onRefocus} {onHover} />
    {#if hoveredNode && tooltipPos}
      <GraphTooltip node={hoveredNode} position={tooltipPos} />
    {/if}
  </div>
  {#if legendOpen}
    <GraphLegend {authorColors} onclose={() => (legendOpen = false)} />
  {/if}
{/if}
```

**Refocus handler**:

```ts
function handleRefocus(cardId: string) {
  const params = new URLSearchParams($page.url.searchParams);
  params.set('origin', cardId);
  params.set('depth', '1'); // reset to depth 1 on refocus
  goto(`/cards/graph?${params.toString()}`, { replaceState: false });
}
```

---

### Step 5 — GraphCanvas (`lib/components/graph/GraphCanvas.svelte`)

**Props**:

```ts
let {
  graphData,
  authorColors,
  onrefocus,
  onhover,
}: {
  graphData: GraphData;
  authorColors: Map<string, string>;
  onrefocus: (cardId: string) => void;
  onhover: (node: GraphNode | null, pos?: { x: number; y: number }) => void;
} = $props();
```

**Implementation outline**:

1. **`$effect`** — create/update `forceSimulation` when `graphData.nodes` or `graphData.links` change. Pin origin node. Cleanup old simulation with `sim.stop()`.
2. **SVG rendering** — `{#each graphData.links}` renders `<line>`, `{#each graphData.nodes}` renders `<circle>` + `<text>`. Styles come from `nodeStyle()` / `edgeStyle()`. Use `shape-rendering="geometricPrecision"` on the SVG.
3. **Zoom** — `$effect` binds `d3.zoom()` to the SVG element. Transform is applied to a `<g transform="...">` wrapper. Float the SVG (not the toolbar) so zoom is bounded.
4. **Hover** — `onmouseenter`/`onmouseleave` on `<circle>` elements emit to page shell for tooltip positioning. Include a 300ms debounce.
5. **Click** — `onclick` on `<circle>` calls `onrefocus(node.id)`, except for the origin node (no-op).
6. **Double-click** — reset zoom transform to identity and center view.

**SVG container**:

```svelte
<svg
  bind:this={svgEl}
  class="h-full w-full"
  viewBox="-500 -500 1000 1000"
  preserveAspectRatio="xMidYMid meet"
>
  <g transform={zoomTransform}>
    <!-- edges -->
    {#each graphData.links as link}
      {@const style = edgeStyle(link.score)}
      {@const source = graphData.nodes.find((n) => n.id === link.source)}
      {@const target = graphData.nodes.find((n) => n.id === link.target)}
      {#if source && target}
        <line
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke="currentColor"
          stroke-width={style.strokeWidth}
          opacity={style.opacity}
        />
      {/if}
    {/each}

    <!-- nodes -->
    {#each graphData.nodes as node}
      {@const style = nodeStyle(node, authorColors)}
      <g
        class="cursor-pointer"
        role="button"
        tabindex="0"
        onclick={() => !node.isOrigin && onrefocus(node.id)}
        onmouseenter={(e) => onhover(node, { x: e.clientX, y: e.clientY })}
        onmouseleave={() => onhover(null)}
      >
        <circle
          cx={node.x}
          cy={node.y}
          r={style.r}
          fill={style.fill}
          opacity={style.opacity}
          stroke={style.stroke}
          stroke-width={style.strokeWidth}
        />
        {#if node.isOrigin}
          <text
            x={node.x}
            y={node.y - style.r - 8}
            text-anchor="middle"
            class="fill-base-content text-xs"
          >
            {node.author} — {node.book}
          </text>
        {/if}
      </g>
    {/each}
  </g>
</svg>
```

---

### Step 6 — GraphToolbar (`lib/components/graph/GraphToolbar.svelte`)

**Props**:

```ts
let {
  origin,
  depth,
  legendOpen,
  onDepthChange,
  onLegendToggle,
}: {
  origin: string;
  depth: number;
  legendOpen: boolean;
  onDepthChange: (d: GraphDepth) => void;
  onLegendToggle: () => void;
} = $props();
```

**Structure**:

```
┌──────────────────────────────────────────────────────────────┐
│ ← Volver al repositorio    [1] [2] [3]    ◎ Leyenda          │
│                            Profundidad                        │
└──────────────────────────────────────────────────────────────┘
```

- "← Volver" links to `/cards/{origin}` (the detail page for the current origin card)
- Depth is a segmented button group with daisyUI `btn-group` + `join` classes; active segment is `btn-active`
- Legend toggle is a `btn btn-ghost` with a small dot showing author color grouping

---

### Step 7 — GraphTooltip (`lib/components/graph/GraphTooltip.svelte`)

**Props**: `node: GraphNode`, `position: { x: number; y: number }`

**Behavior**:

- Absolutely positioned via `style="left: {pos.x + 12}px; top: {pos.y + 12}px"`
- Shows: `Author — Book (Year) · p. X`
- Styled as a small card: `bg-base-100 border border-base-300 rounded-lg p-2 text-sm shadow-md pointer-events-none`
- `pointer-events-none` so the tooltip doesn't block hover detection on underlying nodes

---

### Step 8 — GraphLegend (`lib/components/graph/GraphLegend.svelte`)

**Props**: `authorColors: Map<string, string>`, `onclose: () => void`

**Structure**:

- A floating panel (right side or bottom of SVG, via `absolute right-4 top-4`)
- Lists each author with a small colored circle + author name
- Shows size legend: small circle (6px) = "Few connections" → large circle (24px) = "Many connections"
- Close button (✕) in the corner

---

### Step 9 — Entry points

#### A. `RelatedCardsSheet.svelte` changes

Add a `currentCardId` prop:

```ts
let { ..., currentCardId }: { ..., currentCardId: string } = $props();
```

Import `goto` and add a button at the bottom of the scrollable body (before the empty state):

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<!-- Bottom of scrollable body, before the empty state -->
{#if currentCardId}
  <div class="mt-4 border-t border-base-200 pt-3">
    <button
      class="btn btn-ghost btn-sm w-full"
      onclick={() => {
        onclose();
        goto(`/cards/graph?origin=${currentCardId}`);
      }}
    >
      📊 Explorar conexiones en grafo → ({relations.length} tarjetas)
    </button>
  </div>
{/if}
```

Uses a `<button>` (not `<a>`) to cleanly close the sheet and navigate — avoids entanglement with the `onselect` callback used by the list page.

**Callers updated**:

- `[id]/+page.svelte` — pass `currentCardId={data.card.id}`
- `+page.svelte` (list view) — pass `currentCardId={cardId}` (the card that opened the sheet)

#### B. Card detail page (`[id]/+page.svelte`)

Add a subtle icon link next to the `RelatedCardsBar`:

```svelte
<div class="mb-5 flex items-start justify-between gap-4">
  <a class="btn btn-outline w-fit shrink-0" href="/cards">← Volver al repositorio</a>
  <div class="flex items-center gap-2">
    <RelatedCardsBar count={data.relations.length} onopen={() => (sheetOpen = true)} />
    {#if data.relations.length > 0}
      <a
        href="/cards/graph?origin={data.card.id}"
        class="btn btn-ghost btn-sm"
        title="Explorar en grafo"
      >
        🔗
      </a>
    {/if}
  </div>
</div>
```

---

### Step 10 — Polish & edge cases

| Concern              | How to handle                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Loading state**    | Full-page centered spinner while fetching JSON; skeleton on graph rebuild                                                                                          |
| **Empty state**      | If `origin` has no relations: show message "Esta tarjeta no tiene relaciones." with a link back to the card detail                                                 |
| **Invalid origin**   | If `origin` is not found in `cards.json`: show error with link back to `/cards`                                                                                    |
| **Missing origin**   | If no `origin` param: show search input to select a card (future), or link back to `/cards`                                                                        |
| **Depth transition** | Animate node opacity from 0→1 over 300ms via CSS transition on `opacity`; keep old nodes at 0 for one tick so layout doesn't jump                                  |
| **Simulation stuck** | If `alpha < 0.01` and no movement in 200ms, stop the simulation and let nodes settle                                                                               |
| **Mobile**           | Toolbar stacks vertically below the graph; graph takes full height minus toolbar; touch drag works via d3-zoom                                                     |
| **Keyboard**         | Tab through nodes, Enter to refocus; Escape closes legend                                                                                                          |
| **Performance**      | For depth 3 (>100 nodes): use `will-change: transform` on SVG group, limit force iterations to avoid jank                                                          |
| **404 page**         | Since this page is not prerendered, SvelteKit's `adapter-static` will 404 on direct URL access in production — set `export const prerender = false;` in `+page.ts` |

For the static adapter, add a `+page.ts` alongside `+page.svelte`:

```ts
// routes/cards/graph/+page.ts
export const prerender = false;
```

This tells the static adapter to skip this route during build and serve it as a client-side fallback.
