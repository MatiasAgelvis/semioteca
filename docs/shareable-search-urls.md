# Shareable Search URLs — Implementation Plan

**Status**: Draft  
**Branch**: `feat/shareable-search-urls`  
**Date**: 2026-07-15

---

## 1. Overview

### Problem

Search state lives entirely in Svelte stores and a modal dialog. Users cannot:

- Share a search result via URL
- Bookmark a search
- Use browser back/forward to revisit searches

### Goal

Sync committed search state (query, tags, authors, match mode) to URL query parameters. Restore it on page load. Browsing in the modal is ephemeral; only "Enter" or "Ver todos" touches the URL.

---

## 2. Current Architecture

```
Stores (writable)           Local $state
─────────────────           ────────────
cardsSearchQuery ──debounce──▶ searchTerms
cardsSearchDialogOpen        fullResultsMode
cardsSearchInitialTags       selectedBook
                             selectedAuthors
                             selectedTags
                             matchMode
                             searchFields
```

- Dialog edits go through stores (ephemeral)
- "Ver todos" sets `fullResultsMode = true`
- No URL involvement at any point

### Key files

| File | Role |
|------|------|
| `frontend/src/routes/cards/+page.svelte` | Main page: all search logic, dialog, card list |
| `frontend/src/lib/stores/cardsSearch.ts` | Writable stores for query, dialog state |
| `frontend/src/lib/utils/search.ts` | `tokenizeQuery()` |
| `frontend/src/lib/utils/cardsSearch.ts` | `getRankedSearchResults()` |

### Constraints

- SvelteKit static adapter — no SSR of query params, but client-side `$page.url.searchParams` works
- No existing `goto` or `$page` usage anywhere in the project
- No `+page.ts` loader — data fetched client-side from static JSON

---

## 3. URL Scheme

```
/cards?q=<query>&tags=<t1>,<t2>&authors=<a1>,<a2>&mode=<all|any>
```

### Rules

- Only params with values appear (no empty params)
- Multi-value params: comma-separated
- All values `encodeURIComponent`-encoded
- `mode` defaults to `all` — omitted unless `any`

### Examples

| Scenario | URL |
|----------|-----|
| Text search | `/cards?q=filosof%C3%ADa+de+la+mente` |
| Text + one tag | `/cards?q=conciencia&tags=fenomenolog%C3%ADa` |
| Tags + authors, any match | `/cards?tags=epistemolog%C3%ADa&authors=Searle&mode=any` |
| No search (book view) | `/cards` |

---

## 4. State Flow

### Page Load

```
URL has params?
├── No  → normal book view (selectedBook = first book)
└── Yes → parse params
          ├── fullResultsMode = true
          ├── populate selectedAuthors, selectedTags
          ├── set matchMode
          ├── set cardsSearchQuery (for dialog pre-population)
          └── dialog stays closed
```

### User Interactions

```
1. Opens dialog (/ or Ctrl+K)
   └── Dialog reads from cardsSearchQuery → shows current query if any

2. Types in dialog
   └── Updates cardsSearchQuery (debounced 200ms)
   └── URL unchanged (ephemeral browsing)

3. Clicks "Ver todos" OR presses Enter
   └── openFullResultsMode()
       ├── Build URL from current state
       ├── goto(url, { replaceState: true, noScroll: true })
       ├── fullResultsMode = true
       ├── close dialog
       └── scroll to top

4. Clicks "×" on full results bar
   └── closeFullResultsMode()
       ├── goto('/cards', { replaceState: true })
       ├── fullResultsMode = false
       └── return to book view

5. Modifies advanced filters (authors/tags/mode) in dialog
   └── Updates local $state
   └── URL unchanged until "Ver todos"

6. Closes dialog with Esc / backdrop
   └── Dialog closes, query preserved in store
   └── URL unchanged
   └── If in fullResultsMode → stays in it

7. Browser back button
   └── replaceState → no history entries for searches
   └── Back returns to whatever page was before /cards
```

### Store ↔ URL Mapping

```
cardsSearchQuery   ◀── read on load from ?q=
                   ──▶ NEVER written to URL (dialog is ephemeral)

selectedAuthors    ◀── read on load from ?authors=
                   ──▶ written on "Ver todos" commit

selectedTags       ◀── read on load from ?tags=
                   ──▶ written on "Ver todos" commit

matchMode          ◀── read on load from ?mode=
                   ──▶ written on "Ver todos" commit
```

---

## 5. Implementation Steps

### Step 1: Create `searchUrl.ts` utility

Location: `frontend/src/lib/utils/searchUrl.ts`

```ts
export interface SearchUrlParams {
  q: string;
  tags: string[];
  authors: string[];
  mode: 'all' | 'any';
}

/** Parse URL searchParams into typed search state */
export function parseSearchUrl(sp: URLSearchParams): Partial<SearchUrlParams> {
  const result: Partial<SearchUrlParams> = {};
  const q = sp.get('q');
  if (q) result.q = q;
  const tags = sp.get('tags');
  if (tags) result.tags = tags.split(',').map(decodeURIComponent).filter(Boolean);
  const authors = sp.get('authors');
  if (authors) result.authors = authors.split(',').map(decodeURIComponent).filter(Boolean);
  const mode = sp.get('mode');
  if (mode === 'any' || mode === 'all') result.mode = mode;
  return result;
}

/** Build URLSearchParams from search state */
export function buildSearchParams(params: SearchUrlParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.tags.length > 0) sp.set('tags', params.tags.map(encodeURIComponent).join(','));
  if (params.authors.length > 0) sp.set('authors', params.authors.map(encodeURIComponent).join(','));
  if (params.mode === 'any') sp.set('mode', 'any');
  return sp;
}
```

### Step 2: Modify `+page.svelte` — URL read on mount

```ts
import { goto } from '$app/navigation';
import { parseSearchUrl, buildSearchParams } from '$lib/utils/searchUrl';

let initializedFromUrl = $state(false);

// Inside onMount, before data fetch:
const urlParams = parseSearchUrl(new URL(window.location.href).searchParams);
const hasUrlParams = Object.keys(urlParams).length > 0;
if (hasUrlParams) {
  if (urlParams.q) $cardsSearchQuery = urlParams.q;
  if (urlParams.tags) selectedTags = new Set(urlParams.tags);
  if (urlParams.authors) selectedAuthors = new Set(urlParams.authors);
  if (urlParams.mode) matchMode = urlParams.mode;
}

// Inside the data fetch callback, after cards are loaded:
if (hasUrlParams) {
  fullResultsMode = true;
  initializedFromUrl = true;
}
```

Note: We use `onMount` + `window.location.href` instead of `$effect` + `$page.url` to avoid re-triggering every time `$page.url` changes (which happens on our own `goto` calls). The `$page` store import is not needed.

### Step 3: Modify `openFullResultsMode()` — write URL

```ts
async function openFullResultsMode() {
  if (!hasSearchCriteria) return;

  fullResultsMode = true;
  closeSearchDialog();
  mobileDrawerOpen = false;

  // Build and push URL
  const params = buildSearchParams({
    q: $cardsSearchQuery,
    tags: Array.from(selectedTags),
    authors: Array.from(selectedAuthors),
    mode: matchMode,
  });
  const qs = params.toString();
  const url = qs ? `/cards?${qs}` : '/cards';
  await goto(url, { replaceState: true, noScroll: true, keepFocus: true });

  await tick();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

Setting `fullResultsMode = true` before `goto` prevents a visual flash of the book view before the results switch over.

### Step 4: Modify `closeFullResultsMode()` — clear URL

```ts
function closeFullResultsMode() {
  fullResultsMode = false;
  goto('/cards', { replaceState: true, noScroll: true, keepFocus: true });
}
```

### Step 5: Edge case — handle mount effect running once

We use `initializedFromUrl` as a tracking flag (not strictly needed for behavior, but useful for any future debugging). The key decision: we read URL params synchronously at the START of `onMount` so state is pre-populated before data arrives. When data is ready, we set `fullResultsMode = true`. This avoids any reactivity race with `$page.url` changes from `goto`.

### Step 6: Clean up search state on dialog close (Esc)

When the user closes the dialog without committing, the dialog's advanced filter state (tags, authors) stays. This is fine — it's the same as today. The URL doesn't change.

---

## 6. Edge Cases

### Handled by design

| Case | Behavior |
|------|----------|
| Empty URL params | Normal book view |
| Garbage query string | Search returns zero results (same as typing nonsense) |
| Special chars | `encodeURIComponent` handles them |
| `replaceState` | No history pollution from searches |
| `noScroll` + `keepFocus` | No visual jitter on URL update |
| Dialog open on load with URL params | Dialog stays closed (full results IS the committed view) |

### Need explicit handling

| Case | Handling |
|------|----------|
| URL params but no results match | Full results shows "No hay coincidencias" (existing behavior) |
| User in book view → opens shared URL with params | Loads into full results. "×" returns to book view (clears URL) |
| Manual URL edit in address bar | Triggers page navigation → same as page load flow |
| Browser refresh | State restored from URL |
| Commas in author/tag names | None observed in current data. Use comma separator for v1 |
| `searchFields` checkboxes | NOT in URL for v1 — ephemeral dialog state, defaults to all-on |

---

## 7. What's NOT in scope (v1)

- **`searchFields` in URL** — checkboxes for content/authorBook/page/tags. Always default to all-on. Could add later as `&fields=content,authorBook`.
- **Book pre-selection in URL** — `?book=Eco+1994`. Separate feature, not part of search sharing.
- **History stack navigation** — We use `replaceState`. Adding `pushState` for back-button search history is a separate UX decision.
- **Server-side rendering of search results** — We're on static adapter. URL params are purely client-side.
- **Search field content area sync** — The `searchFields` checkboxes in the dialog don't sync to URL. If we add them later, they'd use a similar pattern.

---

## 8. Testing Checklist

- [ ] Visit `/cards` → normal book view (no URL params)
- [ ] Open dialog, type query, press Enter → URL updates to `?q=...`, full results shown
- [ ] Open dialog, select tags/authors, click "Ver todos" → URL has `?tags=...&authors=...`
- [ ] In full results, click "×" → URL returns to `/cards`, back to book view
- [ ] Copy URL from full results, open in new tab → same search restored
- [ ] Refresh page while in full results → search state preserved
- [ ] Open dialog while in full results → dialog pre-populated with current query
- [ ] Close dialog with Esc → URL unchanged, full results still shown
- [ ] Browser back button after search → returns to previous page (not previous search)
- [ ] No URL params on page → `?q=` etc. never appear
- [ ] Special chars in query (accents, ñ, ¿) → properly encoded/decoded
- [ ] Mode `any` → `&mode=any` in URL; mode `all` → omitted
- [ ] Empty tag/author set → no `&tags=` or `&authors=` in URL

---

## 9. Files Changed

| File | Change |
|------|--------|
| `frontend/src/lib/utils/searchUrl.ts` | **New** — URL parse/build utilities |
| `frontend/src/routes/cards/+page.svelte` | **Modified** — Add URL sync in onMount, write URL in openFullResultsMode, clear in closeFullResultsMode, Enter handler on search input |
| `docs/shareable-search-urls.md` | **New** — This document |

No store changes needed. No API changes.

---

## 10. Known Limitations (v1)

### `searchFields` not in URL

The toggles for content/authorBook/page/tags are not synced to the URL. If someone shares a URL filtered to only "tags", the recipient will get all fields enabled by default. Minor — these toggles are niche, and adding `&fields=content,tags` later would be straightforward.

### Comma separator for multi-value params

Tags and authors are comma-separated. If any tag or author name contains a literal comma, parsing would break. Current data has none — address if it comes up.

### No back-button search history

Uses `replaceState`, so there's no history entry per search. "Back" goes to the previous page, not the previous query. Intentional — keeps history clean — but means you can't navigate between past searches.

### Book position not remembered on close

Exiting full results (×) resets to the first book, not the book the user was viewing before searching. Pre-existing behavior, carried forward.

### Dialog/URL desync

The dialog is ephemeral — typing/selecting filters never writes to the URL. If a user builds a query in the dialog, closes it with Esc, and shares the current URL, the URL reflects only the last committed search, not what was in the dialog.
