# Card Composer and PDF Export - Design Document

Date: 2026-04-28  
Status: Draft proposal

## 1) Product goal

Let users build a custom document from selected cards, control the order, and export it as a PDF.

Core user flow:
1. Browse/search cards.
2. Add cards to a composition.
3. Reorder cards in a table/list.
4. Optionally edit document metadata (title, subtitle, notes).
5. Export to PDF.

## 2) Scope

### In scope (MVP)

- Create one local composition at a time.
- Add/remove cards from cards page and card detail page.
- Reorder cards with drag and drop and move up/down controls.
- Show composition as a structured table with key metadata.
- Export a clean PDF using browser print pipeline.
- Persist composition in local storage.

### Out of scope (MVP)

- Multi-user accounts and cloud sync.
- Real-time collaboration.
- Rich WYSIWYG editing.
- Citation format presets (APA/MLA/Chicago).
- Server-stored document history.

## 3) UX proposal

### 3.1 Entry points

- Add a new route: `/cards/compose`
- Add "Add to document" action in card item and card detail UI.
- Add a sticky "Composition tray" summary in cards page header:
  - Number of selected cards.
  - Quick button: "Open Composer".

### 3.2 Composer screen

Main sections:
- Document header form:
  - Title (required)
  - Subtitle (optional)
  - Author/Compiler name (optional)
  - Intro note (optional)
- Card table/list (ordered):
  - Position
  - Card preview (truncated)
  - Source (author, book, page)
  - Actions (remove, move, jump to original card)
- Right or bottom actions:
  - Export PDF
  - Clear all
  - Save snapshot (future)

### 3.3 Ordering interactions

- Drag handle for pointer users.
- Keyboard-friendly controls:
  - Move up
  - Move down
- Optional sort shortcuts:
  - By current order (default)
  - By source author/book/page

### 3.4 Export behavior

MVP export strategy:
- Open a print-friendly composition view (`/cards/compose/print` or print mode flag).
- Use print CSS (`@media print`) and call `window.print()`.
- User selects "Save as PDF" from browser dialog.

Why this first:
- Works with static hosting.
- No server PDF renderer required.
- Fast to ship and easy to maintain.

## 4) Technical architecture

### 4.1 Frontend modules

Suggested new files:
- `frontend/src/lib/stores/cardComposer.ts`
- `frontend/src/lib/types/composer.ts`
- `frontend/src/lib/components/ComposerTray.svelte`
- `frontend/src/lib/components/ComposerTable.svelte`
- `frontend/src/routes/cards/compose/+page.svelte`
- `frontend/src/routes/cards/compose/print/+page.svelte`

### 4.2 Data model

```ts
export interface ComposerItem {
  cardId: string;
  order: number;
  addedAt: string; // ISO
  note?: string;
}

export interface ComposerDocument {
  version: 1;
  id: string;
  title: string;
  subtitle?: string;
  compiler?: string;
  intro?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  items: ComposerItem[];
}
```

Notes:
- Store only card ids + lightweight item metadata.
- Resolve full card content from `cards.json` at render/export time.
- Keep `version` for future migrations.

### 4.3 State management

- Use Svelte store with local persistence.
- Storage key: `semioteca:composer:v1`
- Operations:
  - `addCard(cardId)`
  - `removeCard(cardId)`
  - `moveCard(cardId, direction | newIndex)`
  - `updateDocMeta(patch)`
  - `clearDocument()`

### 4.4 URL and navigation

- Keep current cards browsing behavior unchanged.
- Add composer route link in site header (optional) and cards page.
- Optional future deep-link:
  - `?compose=<compressed-state>` for shareable draft links.

## 5) Export design details

### 5.1 Print layout

Print template order:
1. Cover block (title, subtitle, compiler, date)
2. Optional intro
3. Table of contents (auto from card order)
4. Card sections

Each card section:
- Heading: author - book - page
- Body: card text
- Images (if available), scaled for print
- Optional user note under card

Print CSS requirements:
- `@page` size A4 and Letter fallback guidance.
- Avoid orphan/widow lines where practical.
- Use `break-before` / `break-inside` to avoid ugly splits.
- Ensure contrast for grayscale printers.

### 5.2 Metadata and filename

Suggested filename pattern:
- `semioteca-{slugified-title}-{yyyy-mm-dd}.pdf`

Include export timestamp in footer.

### 5.3 Future server-rendered PDF (Phase 2)

If higher-fidelity pagination is needed:
- Add a server endpoint (Vercel function) that renders HTML to PDF (Playwright/Chromium).
- Return a downloadable binary PDF.
- Keep print-view HTML shared with client print flow to avoid duplication.

## 6) Performance and constraints

- Typical composition size target (MVP): up to 150 cards.
- Use virtualized list only if composer editing feels slow at high counts.
- Defer image decoding in editor view; fully load in print view.

## 7) Accessibility

- All add/remove/reorder actions reachable by keyboard.
- ARIA live region for actions ("Card moved to position 4").
- Focus management after reorder/remove.
- Clear labels for export and destructive actions.

## 8) Error handling

- Missing card id in dataset:
  - Keep placeholder row and warning badge.
- Invalid persisted state:
  - Reset with migration guard and non-blocking toast.
- Empty composition export:
  - Disable export button and show hint.

## 9) Security and content safety

- Render card text as plain text (or sanitized HTML only if required).
- Escape all user-provided notes in print template.
- No executable user HTML in exported documents.

## 10) Analytics (optional)

Track:
- Cards added to composer.
- Export initiated/completed.
- Average cards per export.
- Abandon points in composer flow.

## 11) Rollout plan

### Phase 1 - MVP (client-only)

- Composer store + add/remove/reorder.
- `/cards/compose` editor page.
- Print-friendly page + browser PDF export.
- Local persistence.

Acceptance criteria:
- User can create composition from cards.
- User can reorder cards and see updated numbering.
- PDF export works in major desktop browsers.

### Phase 2 - Quality and scale

- Better print typography and page-break tuning.
- Optional per-card notes.
- Optional snapshot save/load (multiple local documents).

### Phase 3 - Advanced

- Server-rendered PDF for deterministic output.
- Shareable links or account-based saved compositions.
- Citation formatting templates.

## 12) Open questions

1. Should composition support multiple documents immediately, or only one active document first?
2. Do you want card full text always, or an option to include only excerpts?
3. Should images be optional in exports (toggle include/exclude)?
4. Do we need a citation appendix generated automatically?
5. Is mobile authoring a first-class requirement for MVP, or desktop-first?

## 13) Recommended implementation order (next PRs)

1. Add composer store, types, and unit-tested operations.
2. Add "Add to document" controls in card list/detail.
3. Build `/cards/compose` with table reorder and metadata form.
4. Add print route and print stylesheet; wire Export button.
5. QA on Chrome/Safari/Firefox and tune page breaks.
