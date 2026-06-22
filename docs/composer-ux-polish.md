# Composer — UX Polish

Date: 2026-06-22

Issues found during initial testing. Fix order is prioritized by impact.

---

## 1. Card border shift when selected

**Problem:** `border-l-4 border-l-success` adds 4px to the left edge only when selected. Content shifts right by 4px, other cards below move.

**Fix:** Reserve the space always. Use `border-l-4 border-l-transparent` as the default, swap to `border-l-success` on selection.

```
class={`card bg-base-100 border transition-colors border-l-4
  ${inDocument ? 'border-l-success' : 'border-l-transparent'}
  ${focused ? 'border-primary shadow-sm' : 'border-base-300'}`}
```

---

## 2. Single card view — buttons overflow at top

**Problem:** `[+ Añadir] [Relacionadas] [Explorar]` + `[← Volver]` all sit in one row. On narrow viewports, buttons wrap or overflow.

**Fix A (recommended):** Move the add/remove button below the metadata, before the content area. It's an action on the card, not a navigation element — it belongs near the content, not the header.

```
[← Volver al repositorio]           [Relacionadas] [Explorar]

Book Title (h1)
Author (Year) — p. X                 [✓ Añadido / + Añadir]

Card content...
```

**Fix B:** Keep in header but allow wrapping. Less ideal — the button competes visually with navigation.

---

## 3. Single card view — no composer feedback

**Problem:** User clicks "Añadir", button changes to "✓ Añadido", but there's no indication of how many cards are in the document or where to find them. The tray lives on `/cards`, invisible here.

**Fix:** Add a small inline composer status link when at least 1 card is in the document. Placed near the add button.

```
Book Title (h1)
Author (Year) — p. X    [✓ Añadido]  [📋 3 tarjetas en documento →]
```

"3 tarjetas en documento" links to `/cards/compose`. Only visible when `$selectedCount > 0`. Uses `$selectedCount` from the store.

---

## 4. Card list — three-button group layout

**Problem:** On the CardItem in the list view, the actions row is: tags on the left, [Añadir] [Opciones] [Ver detalle] on the right. Three buttons in a tight space, wraps on smaller cards.

**Fix:** Move the "Añadir" button to the card header row (next to the page badge), away from the actions cluster. The header row already has space.

```
Author — Book             [imgs] [p.42] [+ Añadir]

Content preview...

[tags] [relations]              [Opciones] [Ver detalle]
```

This is a one-line change in the header row `<div>`.

---

## Implementation order

| # | Issue | File | Effort |
|---|-------|------|--------|
| 1 | Border shift | `CardItem.svelte` | 1 line |
| 2 | Detail view button overflow | `[id]/+page.svelte` | ~15 lines |
| 3 | Composer status on detail | `[id]/+page.svelte` | ~10 lines |
| 4 | Card list button layout | `CardItem.svelte` | ~5 lines |
