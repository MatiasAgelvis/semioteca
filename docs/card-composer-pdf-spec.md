# Card Composer — Document Builder & PDF Export

Date: 2026-06-22
Status: Implementation-ready spec
Supersedes: `card-composer-design.md` (2026-04-28)

---

## 1. Goal

Let users select cards, organize them into a document, and export as PDF. One button click opens a print-ready page with the system print dialog — the user presses Enter to save as PDF.

---

## 2. Pipeline

```
Selected Cards ──→ Compose Markdown ──→ Render HTML (marked) ──→ Open print window → window.print()
                                          │
                                          └──→ Download .md (instant)
```

| Step | Technology | Rationale |
|------|-----------|-----------|
| Cards → Markdown | Plain string composition | No deps, portable intermediate format |
| Markdown → HTML | `marked` v18 | Already in `package.json` |
| HTML → PDF | `window.open()` + `window.print()` | Zero deps, native GPU rendering, <1s, correct typography/pagination |

### Why Not html2pdf.js

`html2pdf.js` screenshots the DOM to `<canvas>` via `html2canvas`, then embeds rasters into `jsPDF`. For multi-page text documents this is catastrophically slow:

| | `html2pdf.js` | `window.print()` |
|---|---|---|
| 50 cards | 25–100s | <1s render + print dialog |
| Memory | 50–200MB canvas allocations | Minimal (native engine) |
| Text quality | Rasterized, blurry at some zoom levels | Vector, crisp at any zoom |
| Pagination | Manual `page-break-*` guessing | Automatic, correct |
| Deps | +200KB | Zero |

The browser's native print engine is the right tool for this job.

---

## 3. Constraints

| Constraint | Value | Reason |
|-----------|-------|--------|
| **Max cards per document** | **50** | UX-friendly guardrail; keeps PDF page count manageable |
| **Max cards UX** | "Add to document" button disabled with tooltip when limit reached | |
| **Storage** | `localStorage` key `semioteca:composer:v1` | Persists across sessions, no backend |
| **Documents** | One active document (MVP) | Multiple named drafts out of scope |

---

## 4. Data Model

### 4.1 Composer Store

```ts
// frontend/src/lib/types/composer.ts

export interface ComposerItem {
  cardId: string;
  order: number;
}

export interface ComposerDocument {
  version: 1;
  title: string;
  subtitle?: string;
  compiler?: string;
  intro?: string;
  items: ComposerItem[];
}
```

- Store only `cardId` + `order`. Resolve full card data from `cards.json` at render/export time.
- `version` field allows future migration of persisted state.

### 4.2 Store Operations

```ts
// frontend/src/lib/stores/composer.ts exposes:

addCard(cardId: string)          // Append to end. No-op if already present or limit reached.
removeCard(cardId: string)       // Remove by id, renumber remaining.
moveCard(cardId: string, dir: 'up' | 'down')  // Swap with neighbor.
reorderCards(fromIndex: number, toIndex: number)  // Drag reorder.
updateMeta(patch: Partial<Pick<ComposerDocument, 'title' | 'subtitle' | 'compiler' | 'intro'>>)
clearDocument()                  // Reset to empty defaults.
isSelected(cardId: string): boolean
selectedCount: number
cardLimit: number                // 50 (constant)
isAtLimit: boolean
```

### 4.3 Markdown Composition

The markdown generator produces a document like:

```md
# {document.title}

{subtitle?}
{compiler?}

{intro?}

---

## 1. {author} — {book} ({year}), p. {page}

> **Tags:** {tag1}, {tag2}

{full card content}

![{caption}]({resolved image path})

---

## 2. ...
```

A utility function `buildDocumentMarkdown(doc: ComposerDocument, cardMap: Map<string, CardRecord>): string` handles this.

### 4.4 PDF Export (Print Window)

```ts
async function downloadPdf(markdown: string, docTitle: string) {
  const html = marked.parse(markdown);
  const printDoc = buildPrintDocument(html, docTitle);

  const win = window.open('', '_blank');
  if (!win) {
    // Popup blocked — show toast with instructions
    showToast('Permite ventanas emergentes para exportar PDF', 'error');
    return;
  }

  win.document.write(printDoc);
  win.document.close();

  // Wait for images to decode before printing
  await waitForImages(win);
  win.print();

  // Auto-close after print dialog is dismissed
  win.onafterprint = () => win.close();
}
```

`buildPrintDocument(html, title)` wraps the rendered HTML in a full document with:

- `<title>` set to the document title
- `@page` CSS rules: A4 size, 15mm margins
- `@media print` stylesheet: hide UI chrome, `page-break-before: always` on each `h2` (card section heading)
- Print-only counters for page numbers via `@page` pseudo-selectors
- Base typography: system font stack, comfortable line-height, max-width for readability

`waitForImages(win)` awaits all `<img>` elements in the print window to finish decoding before triggering `print()`, ensuring no blank image boxes in the output.

---

## 5. UI

### 5.1 Entry Points

1. **`/cards` page** — primary surface.
2. **`/cards/[id]` detail page** — "Add to document" button near the existing "Opciones" menu.
3. **Site header** — optional nav link to composer (future).

### 5.2 Cards Page Layout

```
┌────────────────────────────────────────────────────────┐
│  Header (existing)                                      │
├──────────────────────┬─────────────────────────────────┤
│  Left: Book sidebar   │  Card list                       │
│  (existing)           │  ┌────────────────────────────┐ │
│                       │  │ CardItem                    │ │
│                       │  │  [+ Añadir al documento]    │ │
│                       │  └────────────────────────────┘ │
│                       │  ┌────────────────────────────┐ │
│                       │  │ CardItem  ✓ En documento    │ │
│                       │  │  [✓ Añadido]               │ │
│                       │  └────────────────────────────┘ │
│                       │                                  │
├──────────────────────┼─────────────────────────────────┤
│  Footer (existing)    │                                  │
└──────────────────────┴─────────────────────────────────┘
```

### 5.3 Builder Tray (Floating Bottom Bar)

A sticky bar at the bottom of the viewport, visible when at least 1 card is selected:

```
┌────────────────────────────────────────────────────────┐
│  📄 3 de 50 tarjetas                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #1 Eco — El nombre de la rosa      [▲][▼][✕]    │  │
│  │ #2 Peirce — Collected Papers       [▲][▼][✕]    │  │
│  │ #3 Barthes — S/Z                   [▲][▼][✕]    │  │
│  └──────────────────────────────────────────────────┘  │
│  [🗑 Vaciar]            [Abrir compositor →] [🖨 PDF]  │
└────────────────────────────────────────────────────────┘
```

- Collapsed by default: shows count + "Abrir compositor" button.
- Expanded: shows ordered list with per-item move up/down/remove.
- "PDF" button is a quick-export shortcut — opens print window directly (uses default title if none set).
- At 50 cards, "Añadir" buttons everywhere become disabled with tooltip "Límite de 50 tarjetas alcanzado".

### 5.4 Composer Page (`/cards/compose`)

Dedicated page for metadata editing, full reorder, and final export:

```
┌────────────────────────────────────────────────────────┐
│  ← Volver a tarjetas                                    │
│                                                         │
│  Título del documento    [___________________________]  │
│  Subtítulo               [___________________________]  │
│  Compilador              [___________________________]  │
│  Nota introductoria      [___________________________]  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #  │ Tarjeta                     │ Acciones      │  │
│  │ 1  │ Eco — El nombre de la rosa  │ [▲][▼][✕]    │  │
│  │ 2  │ Peirce — Collected Papers   │ [▲][▼][✕]    │  │
│  │ 3  │ Barthes — S/Z               │ [▲][▼][✕]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [🗑 Vaciar]                         [🖨 Exportar PDF]   │
│                                     [📄 Descargar MD]   │
└────────────────────────────────────────────────────────┘
```

### 5.5 Card Item Changes

Add to `CardItem.svelte`:

- **"Añadir al documento" button** — secondary style, visible when card is not selected. Replaced by a checkmark badge when already added.
- Clicking a selected card's badge removes it (toggle behavior).
- Button disabled with tooltip when at limit.

### 5.6 Card Detail Page (`/cards/[id]`)

Add an "Añadir al documento" / "Quitar del documento" button near the existing header actions.

---

## 6. Dependencies

**No new dependencies.** `marked` v18 is already in `package.json` for Markdown → HTML rendering. PDF export uses only browser-native APIs (`window.open`, `window.print`).

---

## 7. Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/types/composer.ts` | `ComposerItem`, `ComposerDocument` types |
| `frontend/src/lib/stores/composer.ts` | Svelte writable store + localStorage persistence |
| `frontend/src/lib/utils/composer-markdown.ts` | `buildDocumentMarkdown()` |
| `frontend/src/lib/utils/composer-pdf.ts` | `downloadPdf()`, `downloadMarkdown()`, `buildPrintDocument()` |
| `frontend/src/lib/components/ComposerTray.svelte` | Floating bottom bar on `/cards` |
| `frontend/src/routes/cards/compose/+page.svelte` | Composer editor page |
| `frontend/src/routes/cards/compose/+page.server.ts` | Data loader (cards.json) |

### Modified Files

| File | Change |
|------|--------|
| `frontend/src/lib/components/CardItem.svelte` | "Añadir al documento" button + selected state |
| `frontend/src/routes/cards/+page.svelte` | Include `ComposerTray`, pass composer state to card items |
| `frontend/src/routes/cards/[id]/+page.svelte` | Add/remove button in header |

---

## 8. Edge Cases & Error Handling

| Case | Behavior |
|------|----------|
| **Card removed from dataset** (stale id in composer) | Show placeholder row in composer with warning badge; skip in export |
| **Corrupted localStorage** | Catch parse errors, reset to empty document, show toast |
| **Limit reached** | Disable add buttons with tooltip; show badge in tray |
| **Empty document export** | Disable PDF/MD buttons, show hint |
| **Popup blocked** | Show toast: "Permite ventanas emergentes para exportar PDF"; user retries after allowing |
| **Image load failure** | Show broken-image placeholder in print window; log warning |
| **Mobile viewport** | Tray collapses to a compact bar; composer page stacks vertically |

---

## 9. Accessibility

- All add/remove/reorder actions keyboard-operable.
- `aria-live` region on tray for count changes: "3 tarjetas en el documento".
- Focus management: after remove, focus moves to next item or tray header.
- PDF button announces purpose clearly; print window opens with focus on content.

---

## 10. Implementation Order

| Step | Task | Prereqs |
|------|------|---------|
| 1 | Create `composer.ts` types + store + localStorage | — |
| 2 | Create `composer-markdown.ts` utility | 1 |
| 3 | Create `composer-pdf.ts` utility (print window + MD download) | 2 |
| 4 | Add add/remove buttons to `CardItem.svelte` | 1 |
| 5 | Add `ComposerTray.svelte` to `/cards` page | 1, 4 |
| 6 | Build `/cards/compose` editor page | 1, 3 |
| 7 | Add add/remove button to card detail page | 1 |
| 8 | QA: Chrome, Safari, Firefox; popup blocker scenarios; real images; limit behavior |
