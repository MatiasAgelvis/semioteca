# Related Cards — Frontend Spec

## Context

`card-relations.json` is already synced to `frontend/static/content/` (2.4 MB, keyed by card ID). Each card has up to 10 related cards with hybrid scores. The backend pipeline is complete; this spec covers consuming that data in the frontend.

---

## Architecture

All data loading happens **at build time** (SSG). No runtime server, no API calls. Same pattern already used by `readCardsDataset()` in `$lib/server/content.ts`.

```
card-relations.json            (static, synced from backend)
        |
        v
readCardRelations()            [new] server util — parse JSON
        |
        v
buildCardRelations(cardId)     [new] server util — resolve metadata
        |
        v
+page.server.ts load()         [modify] — return relations alongside card
        |
        v
+page.svelte                   [modify] — render RelatedCards section
```

---

## Data types

```ts
// content.ts — additions

/** Raw relation: just the ID and score. */
export interface CardRelationEntry {
  id: string;
  score: number;
}

/** Full relation: resolved with display metadata. */
export interface RelatedCard {
  id: string;
  title: string; // book title (same as CardRecord.book)
  author: string;
  book: string;
  year: string;
  page: string | null;
  score: number;
}
```

---

## Server-side changes

### `$lib/server/content.ts` — two new exports

```ts
import path from 'node:path';

const RELATIONS_PATH = path.join(CONTENT_ROOT, 'card-relations.json');

/**
 * Returns the raw relations map: { cardId → [{id, score}, ...] }.
 */
export async function readCardRelations(): Promise<Record<string, CardRelationEntry[]>> {
  if (!(await exists(RELATIONS_PATH))) return {};
  const raw = await readFile(RELATIONS_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Resolves related cards for a given card ID.
 * Loads both datasets (cards + relations), stitches metadata.
 */
export async function buildRelatedCards(cardId: string): Promise<RelatedCard[]> {
  const relations = await readCardRelations();
  const entries = relations[cardId];
  if (!entries?.length) return [];

  const dataset = await readCardsDataset();
  const cardMap = new Map(dataset.books.flatMap((book) => book.cards).map((c) => [c.id, c]));

  return entries.map((entry) => {
    const card = cardMap.get(entry.id);
    return {
      id: entry.id,
      title: card?.book ?? entry.id,
      author: card?.author ?? '',
      book: card?.book ?? '',
      year: card?.year ?? '',
      page: card?.page ?? null,
      score: entry.score,
    };
  });
}
```

### `+page.server.ts` — load relations in card detail

```diff
- export async function load({ params }) {
-   const dataset = await readCardsDataset();
+ export async function load({ params }) {
+   const [dataset, relations] = await Promise.all([
+     readCardsDataset(),
+     buildRelatedCards(params.id),
+   ]);
    const card = dataset.books.flatMap(...).find(...);
    ...
-   return { card };
+   return { card, relations };
  }
```

---

## UI: Bottom bar → slide-up sheet

A sticky bottom bar teases the feature. Tapping/clicking opens a centered slide-up panel showing all 10 related cards. This keeps the main article clean and signals secondary hierarchy without hiding the feature entirely.

### States

```
STATE 1: Closed (sticky bar)                    STATE 2: Open (slide-up sheet)
╭────────────────────────────────────╮          ╭────────────────────────────────────╮
│  Card content                       │          │  Card content (dimmed/darkened)     │
│  ...                                │          │  ...                                │
│                                     │          │                                     │
│  ┌──────────────────────────────┐  │          │  ┌──────────────────────────────┐  │
│  │ 🔗 10 tarjetas relacionadas  │  │          │  │ ← Tarjetas relacionadas   ✕  │  │
│  └──────────────────────────────┘  │          │  │                              │  │
╰────────────────────────────────────╯          │  │ Author — Book title   93%   │  │
                                                 │  │ Author (Year) · p.42       │  │
                                                 │  │                            │  │
                                                 │  │ Author — Book title   87%   │  │
                                                 │  │ Author (Year) · p.15       │  │
                                                 │  │                            │  │
                                                 │  │ ...  (scrollable)          │  │
                                                 │  └──────────────────────────────┘  │
                                                 ╰────────────────────────────────────╯
```

### Sticky bar (closed state)

- `position: sticky; bottom: 0` — glued to the viewport bottom
- Full-width bar: `bg-base-100 border-t border-base-200`
- Contents: icon + "{N} tarjetas relacionadas" link button
- `cursor: pointer` on entire bar
- **Hidden entirely** when relations count is 0
- Subtle entrance: fades in as the user scrolls past the article

### Sheet (open state)

- Centered modal on desktop (`max-w-2xl mx-auto`, rounded top corners)
- Full-width on mobile
- Slides up from the bottom with `transition`
- Semi-transparent backdrop dims the article behind it
- Header row: "← Tarjetas relacionadas" title + "✕" close button
- Scrollable body with the 10-card list
- Each row: click navigates to `/cards/{id}` (same tab), then sheet closes
- Close on: ✕ button, backdrop click, or Escape key

### Each row

- **Header line**: `{author} — {book title}` in bold
- **Meta line**: `{author} ({year}) · p.{page} · {score %}` in muted/small text
- Click navigates to `/cards/{id}` (same tab)
- Styled with existing `card` / `border-base-200` / `rounded-2xl` patterns
- `score` displayed as percentage (× 100, rounded to nearest integer), as muted inline text
- Sort by score descending (data already sorted, but sort defensively)

### Behavior

| Event                   | Action                                 |
| ----------------------- | -------------------------------------- |
| Click sticky bar        | Open sheet, animate slide-up           |
| Click relation row      | Navigate to `/cards/{id}`, close sheet |
| Click backdrop          | Close sheet                            |
| Click ✕ button          | Close sheet                            |
| Press Escape            | Close sheet                            |
| Relations count = 0     | Hide sticky bar entirely               |
| Build-time data missing | Hide sticky bar entirely               |

### States

| State            | UI                                       |
| ---------------- | ---------------------------------------- |
| **Normal**       | Sticky bar visible, sheet closed         |
| **Open**         | Sheet visible, backdrop active           |
| **Empty**        | Sticky bar hidden                        |
| **Missing file** | Sticky bar hidden (graceful degradation) |

### Edge cases

- Cards that link to invalid/dangling IDs: skip silently (`cardMap.get()` returns undefined → filter)
- Self-references: already excluded by the backend, but filter defensively

---

## Implementation steps

### Step 1 — Types

- Add `CardRelationEntry` and `RelatedCard` to `content.ts`

### Step 2 — Server functions

- Add `readCardRelations()` and `buildRelatedCards()` to `content.ts`

### Step 3 — Page loader

- Update `+page.server.ts` to load relations alongside card

### Step 4 — UI components

- Create `RelatedCardsBar.svelte` — sticky bottom bar (closed state)
  - Props: `{count: number}`, event `onopen`
  - Hidden when count === 0
- Create `RelatedCardsSheet.svelte` — slide-up sheet (open state)
  - Props: `{relations: RelatedCard[], show: boolean}`, event `onclose`
  - Handles backdrop click, Escape key, ✕ button
  - Renders the 10-card vertical list
- Wire both into `+page.svelte`

### Step 5 — Verify

- Build + browse a few cards with relations
- Spot-check cross-book vs intra-book quality
- Verify no runtime errors

---

## Design decisions

| Decision           | Choice                        | Rationale                                                     |
| ------------------ | ----------------------------- | ------------------------------------------------------------- |
| Presentation       | Bottom bar → slide-up sheet   | Secondary hierarchy, non-intrusive, desktop-first (75% users) |
| Trigger visibility | Sticky bar, hidden when empty | Discoverable but not in-your-face                             |
| List vs grid       | Vertical list                 | Card titles are long (academic books), grid wraps awkwardly   |
| Score format       | Percentage (`93%`)            | More intuitive than raw 0.73                                  |
| Page display       | `p. {page}`                   | Matches existing badge pattern                                |
| Navigation         | Same tab                      | Detail → detail feels like browsing, not opening tabs         |
| Sort order         | Descending by score           | Data already sorted, defensive sort                           |
| Max displayed      | All 10                        | Compact list — no truncation needed                           |
| Missing relations  | Hide bar entirely             | Graceful degradation, no dead UI                              |
