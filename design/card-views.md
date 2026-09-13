# Card View Specifications

Cards are the core of the project. Each view serves a distinct role.

A "card view" is any surface where the user can **read the content of a card**.

---

## Preview (transient/contextual)

_Goal_: Help user discover, find, or navigate to a card

_Show_: Author, book, page badge, tags (optional), content preview (optional)

_Don't show_: Year, full content, images

_Priority_: Scannability (truncated text, badges)

_Instances_: SearchResultItem, RelatedCardsSheet, GraphTooltip, ComposePreview

---

## Extended (contextual, richer)

_Goal_: Show card in context with actions

_Show_: Author, book, page, tags, content, actions (explore, open full)

_Priority_: Contextual, actionable

_Instances_: GraphPanel sidepane

---

## Detail (canonical/primary)

_Goal_: Display complete card for reading/composing

_Show_: Everything — author, book, year, page, full content, images, tags

_Priority_: Completeness, interactivity (expand, copy, add to composer)

_Instances_: CardItem (book view list), Card detail page (`/cards/[id]`)

---

## Card View Inventory

There are **7 surfaces** where card content can be read:

| #   | Surface             | Component                  | Spec     | Content shown             |
| --- | ------------------- | -------------------------- | -------- | ------------------------- |
| 1   | Books view          | `CardItem.svelte`          | Detail   | Full (expandable)         |
| 2   | Single card view    | `[id]/+page.svelte`        | Detail   | Full                      |
| 3   | Search preview      | `SearchResultItem.svelte`  | Preview  | Excerpt (90 chars)        |
| 4   | Related cards sheet | `RelatedCardsSheet.svelte` | Preview  | Content preview           |
| 5   | Graph popup         | `GraphTooltip.svelte`      | Preview  | Content preview (3 lines) |
| 6   | Graph sidepane      | `GraphPanel.svelte`        | Extended | Full                      |
| 7   | Compose preview     | `compose/+page.svelte`     | Preview  | Excerpt (350 chars)       |

**Not card views** (navigation/access points):

- `TocItem.svelte` / `TocItemFull.svelte` — TOC links to cards
- `ComposerTray.svelte` — document composer card list
- `RelatedCardsBar.svelte` — button to open related cards sheet

---

## Navigation Paradigms

Cards can be navigated in two fundamentally different ways, each serving a distinct user intent:

### Flat (popup/pane)

_Goal_: Browse related cards as a list

_Focus_: Individual cards — their content, metadata, and tags

_User mindset_: "Show me what's related to this card"

_Entry_: "Ver tarjetas relacionadas" button on card detail or graph sidepane

_Exit_: "Explorar en red" to dive deeper into connections

_Characteristics_: Quick, low commitment, immediate context. The popup is a preview — users scan a handful of related cards without losing their place.

_Instances_: RelatedCardsSheet

---

### Network (graph)

_Goal_: Explore how cards connect to each other

_Focus_: Relationships — paths, clusters, and patterns between cards

_User mindset_: "Show me how these ideas are connected"

_Entry_: From popup, card detail page, or card list (CardItem)

_Constraint_: Needs a seed card as origin — the graph is contextual, not standalone

_Characteristics_: Deeper, higher commitment, broader context. The graph is the map — users navigate structure, not just content.

_Instances_: GraphView (`/cards/graph`)

---

### Design implications

- **Flat first, graph on demand**: Most users start with flat browsing; the graph is an opt-in deeper exploration
- **Don't force the graph**: Entry points should feel natural, not pushy
- **Seed matters**: The graph always needs an origin card — it's a focused view, not a global overview
- **Complementary, not competing**: Flat and network navigation serve different intents; both should be accessible from the same contexts

---

## Federated Card Component (future)

All 7 surfaces could benefit from a unified card component with shared base styles and configurable options (content depth, metadata visibility, actions). This would:

- Ensure visual consistency across all surfaces
- Reduce code duplication
- Make style changes propagate automatically
- Simplify the transition between Preview → Extended → Detail
