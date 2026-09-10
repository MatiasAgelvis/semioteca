# Card View Specifications

Cards are the core of the project. Each view serves a distinct role:

## Preview (transient/contextual)

_Goal_: Help user discover, find, or navigate to a card

_Show_: Author, book, page badge, tags (optional), content preview (optional)

_Don't show_: Year, full content, images

_Priority_: Scannability (truncated text, badges)

_Instances_: RelatedCardsSheet, SearchResultItem, TocItem, TocItemFull, ComposerTray

---

## Extended (contextual, richer)

_Goal_: Show card in context with actions

_Show_: Author, book, page, tags, actions (explore, open full)

_Priority_: Contextual, actionable

_Instances_: GraphPanel sidepane

---

## Detail (canonical/primary)

_Goal_: Display complete card for reading/composing

_Show_: Everything — author, book, year, page, full content, images, tags

_Priority_: Completeness, interactivity (expand, copy, add to composer)

_Instances_: CardItem (book view list), Card detail page (`/cards/[id]`)
