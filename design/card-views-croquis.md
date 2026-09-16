# Card Views — Current State Croquis

ASCII layout sketches of every surface where card content appears.
Generated from live code to serve as a baseline for unification work.

---

## 1. CardItem — Books View (collapsed)

```
┌─────────────────────────────────────────────────────┐
│ Author — Book →                  [N coinc.] [p. 42] │
│ preview text preview text preview text preview te…   │
│ [tag] [tag] [tag]                [Red] [Añadir] [♡] │
│              ▼ Mostrar contenido                     │
└─────────────────────────────────────────────────────┘
```

**Header**: author — book (truncate, flex-1) → button | match badge + page badge (right)
**Body**: compactHtml or search-highlighted excerpt (350 chars, no images)
**Actions**: tags (left) | Red / Añadir / fav (right)

---

## 2. CardItem — Books View (expanded)

```
┌─────────────────────────────────────────────────────┐
│ Author — Book →                  [N coinc.] [p. 42] │
│                                                     │
│ Full card text with styled formatting. This is      │
│ the complete content of the card, rendered with     │
│ @html so italics and bold show through.             │
│                                                     │
│ ┌───────────────────────────┐                       │
│ │        [image]            │                       │
│ └───────────────────────────┘                       │
│                                                     │
│ More text after the image...                        │
│                                                     │
│ Copiar cita · Copiar texto                          │
│                                                     │
│ [tag] [tag] [tag]                [Red] [Añadir] [♡] │
│              ▲ Ocultar contenido                    │
└─────────────────────────────────────────────────────┘
```

**Header**: same as collapsed
**Body**: text parts (@html) + image parts (CardImage)
**Footer**: copy citation/text links → tags + actions bar
**Toggle**: "Ocultar contenido" / "Mostrar contenido"

---

## 3. Card Detail — `/cards/[id]`

```
┌──────────────────────────────────────────────────────────┐
│ ← Volver al repositorio                                  │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Author — Book (Year)               [p. 42]           │ │
│ │                                                      │ │
│ │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │ Full card text with styled formatting. This is   │ │ │
│ │ │ the complete content rendered with @html.         │ │ │
│ │ │                                                  │ │ │
│ │ │ ┌───────────────────────────┐                    │ │ │
│ │ │ │        [image]            │                    │ │ │
│ │ │ └───────────────────────────┘                    │ │ │
│ │ │                                                  │ │ │
│ │ │ More text...                                     │ │ │
│ │ │                                                  │ │ │
│ │ │ Copiar cita · Copiar texto                       │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ [tag] [tag] [tag]            [Red] [Añadir] [♡] [⋯] │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Header**: author — book (Year) + page badge (no → button)
**Body**: bordered container, text + images (@html)
**Actions**: tags (left) | Red / Añadir / fav / menu (right)
**No toggle**: content always visible

---

## 4. SearchResultItem — Search Dialog

```
┌──────────────────────────────────────────────────────┐
│ Author — Book                       [p. 42]           │
│ excerpt text excerpt text excerpt text excerpt te…    │
└──────────────────────────────────────────────────────┘
```

**Header**: author — book (flex, no truncate on line) + page badge
**Body**: 90-char excerpt with search highlighting
**No images**, no tags, no actions
**Note**: author + book on same line but wrap (no single-line trunc)

---

## 5. GraphTooltip — Graph Hover

```
┌──────────────────────────┐
│ Author — Book             │
│ Year · p. 42              │
│ preview text preview te… │
└──────────────────────────┘
```

**Line 1**: author — book (bold)
**Line 2**: year · p. page (xs, opacity-60)
**Line 3**: content preview (xs, opacity-70, line-clamp-3)
**No images**, no tags, no actions
**Fixed position**, pointer-events-none

---

## 6. GraphPanel — Graph Sidepane

```
┌───────────────────────────────┐
│ Book Title              [X]   │
│ Author (Year) · p. 42         │
│ [tag] [tag]                   │
│                               │
│ ┌───────────────────────────┐ │
│ │ Full card text rendered   │ │
│ │ with @html formatting.    │ │
│ │                           │ │
│ │ Images if present.        │ │
│ └───────────────────────────┘ │
│                               │
│ [Explorar desde aquí] [Añadir]│
└───────────────────────────────┘
```

**Header**: book title (bold) + close button (right)
**Meta**: author (Year) · p. page (xs, opacity-60)
**Tags**: below meta (if present)
**Body**: bordered container, full text (@html)
**Footer**: "Explorar desde aquí" (outline) + "Añadir" button

---

## 7. RelatedCardsSheet — Related Cards Dialog

```
┌──────────────────────────────────────────────┐
│ Tarjetas relacionadas                   [X]  │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Author — Book              [p. 42]        │ │
│ │ [tag] [tag]                              │ │
│ │ preview text preview text preview te…    │ │
│ ├──────────────────────────────────────────┤ │
│ │ Author — Book              [p. 42]        │ │
│ │ [tag] [tag]                              │ │
│ │ preview text preview text preview te…    │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Each row**: author — book (bold) + page badge (right)
**Tags**: below title (if present, static variant)
**Preview**: 160-char contentPreview (xs, opacity-60, line-clamp-2)
**No images**, no expand

---

## 8. Composer Preview — Compose Page

```
┌──────────────────────────────────────────┐
│ ① Author — Book (Year), p. 42            │
│ preview text preview text preview te…    │
│                                          │
│ ② Author — Book (Year), p. 91            │
│ preview text preview text preview te…    │
└──────────────────────────────────────────┘
```

**Row**: index + author — book (Year), p. page
**Preview**: 350-char plain text excerpt (no images, no formatting)
**Expandable**: toggle shows the same preview indented with border-left

---

## Cross-cutting observations

| Element       | CardItem              | Detail                 | Search            | Tooltip              | Panel                | Related           | Compose                    |
| ------------- | --------------------- | ---------------------- | ----------------- | -------------------- | -------------------- | ----------------- | -------------------------- |
| Author format | `Author — Book`       | `Author — Book (Year)` | `Author — Book`   | `Author — Book`      | `Author (Year) · p.` | `Author — Book`   | `Author — Book (Year), p.` |
| Page badge    | `p. {page}` right     | `p. {page}` right      | `p. {page}` right | `· p. {page}` inline | inline in meta       | `p. {page}` right | inline in heading          |
| Content       | @html compact or full | @html full             | plain highlight   | plain preview        | @html full           | plain preview     | plain text                 |
| Images        | expanded only         | always                 | never             | never                | full                 | never             | never                      |
| Tags          | ✓                     | ✓                      | ✗                 | ✗                    | ✓                    | ✓                 | ✗                          |
| Actions       | Red, Añadir, fav      | Red, Añadir, fav, ⋯    | ✗                 | ✗                    | Explorar, Añadir     | ✗                 | ✗                          |
| Copy links    | expanded              | ✓                      | ✗                 | ✗                    | ✗                    | ✗                 | ✗                          |
