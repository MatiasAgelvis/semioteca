# Plan: Card content normalization — every card carries only its distinct data

TL;DR — Card `content` currently embeds repeated book-level metadata (the page header / bibliographic citation, “the divider”), which inflates the tagger, skews related-card linking, and clutters readers. The rule: a card is `<page, text>` and nothing more; `author`, `book`, `year`, and edition live at the book level and are rendered by the site. We detect the divider from the data (not per-source config), strip it from every card **including the first card's preamble**, and use its per-card count as a split-health signal.

**Decisions**

- North-star rule: **card = page + text**. Drop all repeated book-level metadata from card content.
- The divider is **detected, not configured** — fingerprint: _repetition_ + _boundary band_ + _source-metadata anchor_.
- The first/last ~5% of a card are an **anchor-tolerance band**, not an exact `match(0)` / `match(-1)` (which break on a stray space or punctuation).
- Section headings at the boundary are fringe: kept when after the divider, accepted as collateral when inside it.
- A card with an unexpected divider count is a **split anomaly** to surface, not hide.

---

## Background / Problem

Sources are hand-made textual index cards (a deck of cards collapsed into a single text file). Each card in the source carries a traditional bibliographic page header that repeats on every page, e.g.:

- `AVRAMIDES, Anita (2019). Percepción, fiabilidad y otras mentes. En Knowing Otre Minds. Avramidez y Mattew Parrot Editors. United Kingdom; Oxford University Press.`
- `McGILCHRIST, Iain (2024). El cerebro dividido. Kairós.`
- `Fundations of Cognitive Gammar, V.1 : Theoretical Prerequisites, Stanford (Cal.) Stanford University Press.`
- `FONTANILLE, Jacques (2008). Soma y sema. Figuras semióticas del cuerpo. Lima: U. de Lima.*`

When flattened and split, this header leaks into card content. That repeat is pure noise — “like double wrapping a chocolate” — and it has concrete downstream costs:

- **Tagger**: the repeated citation text is fed to the tagger and inflates scores (a likely contributor to `Intención` over-firing).
- **Linker**: `card-relations` is computed on content, so two cards from the same book score artificially high from sharing the header.
- **Reader**: every card displays the same citation line.

All of that data already exists once on the book; embedding it in every card adds no information.

---

## Principles

1. **A card carries only its distinct data**: `page` and `text`. Everything identical across a book's cards — author, book, year, edition — is book-level metadata, provided by the config and rendered by the site. (The site already plans to show author/book/year/edition at the book level; that is the “easy fix” on the frontend, out of scope for the backend cleaning described here.)
2. **The divider is noise to strip, but also a signal.** Each divider marks a page boundary. A card holding _two_ dividers means a page marker was missed and two pages were fused — a split error we want to detect, not silently clean.

---

## What “the divider” is

A page-header / bibliographic citation that repeats at the top of each page and lands in card content at a boundary. Two forms:

- **Page-number only** (e.g. some sources have no citation, just `P. NN`): that is the _split marker_ itself, already captured as `page`, never part of `content`. → No divider; source is already clean.
- **A few lines of formatted citation text** (author › title › publisher): the actual divider we detect and strip.

The divider is **not uniform** across files: case, punctuation, spelling, and line-wrapping vary (e.g. “Gammar”, `United Kingdom;` vs `UK:`, `Avramidez` vs `Anita Avramidez`). Detection must be tolerant.

---

## Detection — the fingerprint

Detect the divider per source from the data, bootstrapped by the metadata we already have in `SourceDocumentConfig`:

> **repetition** (how often) · **boundary band** (where it anchors) · **source-metadata anchor** (what it is)

1. **Repetition.** The divider is the _same_ fragment appearing in most cards of the source. A one-off in-body mention of the book title does not repeat, so repetition is the primary discriminator between “divider” and “legitimate content.”
2. **Boundary band.** The divider sits at the card edge. Use the **first and last ~5%** of each card as candidate _anchor positions_ for a match — not as fixed match targets. This avoids the brittle `if match(0)` / `if match(-1)` behavior where a leading space or trailing punctuation breaks the match.
   - Leading: the divider's _start_ falls within the first ~5%; scan forward from points in that band.
   - Trailing: the divider's _end_ falls within the last ~5%; scan that band for a match reaching the card tail.
3. **Source-metadata anchor.** The divider carries the source's own `author` / `title` / `book` / publisher, so candidates can be anchored to (and validated against) the known metadata rather than “any repeated string.”

---

## Stripping

- The process order is **detect → count → strip**.
- Detect the divider in the raw (pre-preamble) text so the first card's preamble is covered, not just the trail between markers.
- **Strip the full divider**, even if it extends beyond the 5% band (a full citation can exceed 5% of a short card); only its _start_ needs to be inside the band.
- After stripping, the card should reduce to its distinct `<page, text>`.
- Cards that strip to **empty** (a page that carried only the running header, e.g. a leftover placeholder) are **dropped from the output**. (Decision from validation: these are author-left placeholders, not content.)
- A card is **not dropped** if it carries an **image** — a figure-only card with no body text is valid and must be kept.
- Divider matching is **containment-based, not whole-line similarity**: a boundary line counts as the divider when the detected key is contained in it (substring) or most of its tokens are present (≥0.7). This makes one key cover all its variants even when a citation line carries extra text. (Validated: eliminated the `Davidson`/`Strawson`/`Putnam` residue caused by longer divider variants the old similarity metric rejected.)

---

## Split-health signal

Before stripping, count dividers per card against the expectation implied by the split:

- healthy middle card: divider appears once (the next page's header);
- first card: divider appears in the preamble _and_ trails the first card — needs explicit handling, not a blind “occurrence == 1” check;
- last card: none.

A card with more dividers than expected = a missed page marker = a split anomaly. Report it (alongside the existing card-length anomaly detection in `backend/anomalies.py`) rather than silently stripping and hiding the evidence.

_Implemented as `detect_split_anomalies` in `divider_detection.py` (flags cards whose content still contains an unconsumed page marker), reported by `generate_cards_json.py` alongside the length anomalies._

---

## Affected sources & scope — full survey

A survey of all 25 configured sources (scanning the first/last boundary line of every card for a repeated, bibliographic-looking fragment) shows that **every source** carries a divider in its card content. This is corpus-wide, not the six hand-checked.

| Source                   | Position        | Divider form           | Freq    |
| ------------------------ | --------------- | ---------------------- | ------- |
| Avranmides 2019          | trailing        | full citation          | 26/41   |
| Cuenca y Hilferty 1999   | trailing        | full citation          | 24/33   |
| Davidson 1990            | leading         | title                  | 131/301 |
| Eco 1992                 | leading         | title + pub            | 21/43   |
| Fabbri 2000              | trailing        | full citation          | 9/42 ⚠  |
| Fontanille 2008          | trailing        | full citation          | 46/47   |
| Greimas, Fontanille 1994 | trailing        | full citation          | 50/89   |
| Honderich 2001           | leading         | title + pub            | 74/80   |
| Langacker 1987           | leading         | full citation          | 90/90   |
| Leech 1997               | trailing        | full citation          | 104/199 |
| Levinson 1989            | leading         | title + pub (short)    | 235/244 |
| Levinson 2004            | leading         | title + subtitle       | 111/125 |
| Lyons 1997               | leading         | title (subtitle + pub) | 232/263 |
| McGilchrist 2024         | trailing        | full citation          | 21/22   |
| Moeschler y Reboul 2000  | leading         | title                  | 85/141  |
| Morente 1983             | leading         | citation               | 18/25   |
| Putnam 1988              | leading         | title + pub            | 180/187 |
| Putnam 1990              | leading         | title (short)          | 154/161 |
| Putnam 1994              | leading         | title + pub            | 48/48   |
| Putnam 1999              | trailing        | full citation          | 43/45   |
| Putnam 2001              | leading         | title + pub            | 157/159 |
| Rorty 1990               | leading         | title + pub            | 29/29   |
| Rorty 1991               | leading         | title + pub            | 41/49   |
| Strawson 1997            | leading         | title                  | 125/148 |
| Warnock 1989             | first card only | citation               | 1/37 ⚠  |

**Key findings**

- **All 25 sources are affected.** Per-source hand-config would mean ~25 patterns; the general detection is the only realistic path. (This resolves the earlier open scope item — the survey is done.)
- **Position is mixed (~16 leading / ~8 trailing / 1 special)** and not determined by any single rule — the boundary band must be position-agnostic.
- **Divider form ranges** — full citation → title + publisher → title only (e.g. `Representación y realidad.`, `Pragmática. Barcelona: Teide.`). No source is page-number-only.
- **Frequency is usually high** (often ≥80%, sometimes 100%), so repetition is a strong signal — but a divider can be **short**, so length must not gate detection.
- **Edge cases:**
  - **Warnock 1989** — the citation appears only in the _first card_ (preamble), not across cards; its running headers vary (section titles). Repetition alone won't catch it → needs preamble-specific handling anchored on the source metadata.
  - **Fabbri 2000** — citation appears in only ~21% of cards; confirm whether the header is partial/varied or genuinely sparse.

---

## Relationship to current code

This is a **build vs. reuse** decision, not a full rewrite. The survey confirms all 25 sources carry a divider, so the per-source hand-config is not salvageable at scale — but the surrounding pipeline is sound and stays.

**What survives (reused as-is):**

- The full split machinery — `split_text_into_cards`, `build_cards_for_source`, preamble handling. Splitting is correct; only the divider handling is naive.
- The data model and per-source metadata (`SourceDocumentConfig`, `Card`, `Book`, `split_pattern`).
- The strip **primitives** — "remove a leading divider block," "truncate at a trailing divider block." V2 still applies these; only _where the pattern comes from_ changes (configured → detected from the data).

**What is replaced (the "V2" — a small, focused module, not a rewrite of the project):**

- The `leading_header_pattern` / `trailing_header_pattern` fields and the config-driven strip in `generate_cards_json.py`.
- Replaced by a data-driven detection layer: discover the divider from repetition + boundary band + source-metadata anchor, then count-and-strip.

The three currently-configured sources (Avramides, McGilchrist, Lyons) become validation/regression cases for V2.

---

## Current system vs. proposed — why it fails, and how we fix it

### Current behavior

- `generate_cards_json.py` splits each source on a per-source `split_pattern` (`PAGE_DOT_PATTERN`, `PARENTHESIS_YEAR_PAGE_PATTERN`, …).
- The preamble (text before the first page marker) is prepended to card 1.
- A recent stopgap strips a hand-configured header: `leading_header_pattern` (prefix match) and `trailing_header_pattern` (truncate at the last occurrence) on `SourceDocumentConfig`, applied to three sources (Avramides, McGilchrist, Lyons).

### Why it sometimes fails

1. **Per-source, hand-configured.** Each source's divider must be registered by hand. Only 3 of 6+ affected sources are covered; the rest still leak the divider into card content.
2. **Fragile exact matching.** The stopgap uses literal regexes; a typo (`Gammar`), a punctuation variant (`United Kingdom;` vs `UK:`), or a wrapped line breaks it. (Already hit: Lyons' `Paidós.` vs `Paidós` required `\.?`.)
3. **Exact-boundary anchoring.** Leading requires the divider at `^\s*`, trailing at the last occurrence — so a stray space or punctuation defeats the match (the `match(0)` / `match(-1)` problem).
4. **First card / preamble is weak.** The preamble divider (Warnock, Fontanille) isn't robustly handled; it leaks into card 1.
5. **No repetition check.** It can't distinguish a divider from a legitimate in-body mention of the book's own title.
6. **No split-health signal.** It silently removes the header, hiding "two dividers = missed page marker" merges.
7. **Doesn't fix downstream.** Uncovered sources still feed polluted content to the tagger and linker.

### How the proposed design improves

| Failure                  | Improvement                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Per-source config        | Detect the divider from the data (repetition + metadata anchor) — works for all sources, no hand-registration |
| Fragile exact matching   | Fuzzy/tolerant matching anchored to the source's own metadata                                                 |
| Exact-boundary anchoring | 5% boundary band as an anchor-tolerance zone, not `match(0)`/`match(-1)`                                      |
| First card / preamble    | Detect on raw (pre-preamble) text so card 1 is covered                                                        |
| No repetition check      | Repetition across cards is the discriminator vs. legitimate content                                           |
| No split-health signal   | Count dividers per card → surface split anomalies (missed page markers)                                       |
| Downstream pollution     | Clean `{page, text}` content → accurate tagger and linker                                                     |

---

## V2 plan — first ideas

Target: a data-driven divider-detection step in `generate_cards_json.py` (or a small module it calls), replacing the per-source patterns with detection from the data. It operates **per source**, bootstrapped by the metadata we already have.

**Approach (per source):**

1. **Normalize for matching.** Build a comparison key: lowercase, strip diacritics, collapse whitespace, ignore punctuation. This lets variant dividers (`Gammar` / `Grammar`, `United Kingdom;` / `UK:`) cluster together — tolerance for hand-made errors.
2. **Extract boundary bands.** Take each card's leading and trailing boundary windows (first/last ~5% of characters, or the first/last few text blocks) as candidate anchor regions.
3. **Anchor on source metadata.** A candidate divider is a boundary fragment that contains a fuzzy match of the source's `title` / `author` / `book`. This is what separates the divider from an arbitrary repeated line.
4. **Cluster repeated fragments.** Group near-identical boundary fragments across cards (via the normalized key). A cluster that (a) matches the metadata anchor and (b) covers a high fraction of cards (≥50%, typically ≥80%) is the divider. Repetition is the discriminator against legitimate content and one-off mentions.
5. **Position falls out of the data.** Whether the divider anchors at the start or the end is determined by which boundary band it lands in — no explicit leading/trailing field.
6. **Count before stripping (split-health).** Count divider occurrences per card; a card with more than expected = a missed page marker → report as an anomaly (fold into `anomalies.py`) rather than hide it.
7. **Strip.** Remove the full divider block from each card (leading: cut at the divider end; trailing: truncate at its start), even if it extends beyond the 5% band.
8. **Preamble special case.** Card 1's preamble holds the first divider (plus optionally a section heading). Strip it there too — and for sources where the divider only appears in the preamble (Warnock), use the metadata-anchor path alone even though it does not repeat.

**Proposed validation path (de-risk the V2):**

- **Phase 1 — report only**: run detection as a report-only tool across the corpus; confirm it identifies the same 25 dividers the survey found (precision check). ✅ done
- **Phase 2 — strip, compare**: enable stripping behind a flag; confirm parity against the hand-checked cases (Avramides, McGilchrist, Lyons). ✅ done — also drops empty cards while keeping figure-only cards
- **Phase 3 — split-health**: count page markers that leak into card content and report them as split anomalies. ✅ done — zero found across the corpus; implemented as `detect_split_anomalies` in `divider_detection.py`, reported by `generate_cards_json.py`

Leaves for the open questions: exact repetition threshold, the fuzzy-matching mechanism (normalized-key vs. n-gram similarity), and how aggressive the preamble strip should be.

---

## Non-goals

- Removing the `author`/`book`/`year`/`edition` fields from each card in `cards.json` — that is a separate, easy frontend/model change (the site renders book metadata); documented here only as the reason the repeated _content_ is redundant.
- Distinguishing or preserving “article title” as meaningful content. The citation block (including the article title, e.g. Avramides' “Percepción, fiabilidad y otras mentes”) is a divider; it is repeated across this book's cards.

---

## Edge cases

- The first card / preamble (Warnock, Fontanille) — the divider appears at the very start; must be detected there too.
- Section headings in the fringe (`Capítulo 6`, `Dretske Account`, `Teorías del significado y clases de significado`) — keep when after the divider, tolerate as collateral when inside.
- In-body mentions of the book's own title — excluded by the repetition + boundary-band fingerprint.
- Short cards, where a divider may exceed the 5% band — strip the full block regardless.
- Non-uniform dividers (typos, wrapped lines, punctuation) — handled by fuzzy, band-anchored matching.

---

## Open questions

1. ✅ Survey scope — **done**: all 25 sources carry a divider (see “Affected sources & scope”).
2. Repetition threshold — `MIN_COVERAGE = 0.5`; Fabbri’s sparse divider (~21%) is intentionally left below threshold (out of scope by decision).
3. ✅ Fuzzy tolerance — **resolved**: containment-based matching (key substring / token overlap ≥ 0.7), not n-gram similarity. Handles longer variants and typos (`Gammar`, `United Kingdom;`/`UK:`).
4. ✅ Where detection lives — `divider_detection.py`, called from `generate_cards_json.py`; split-health reported alongside the length anomalies.

**Outstanding — separate workstream:** the `Intención` tagger over-firing persists (~79% of cards) even with divider-stripped content **and** the refined `Intención` description in `card-tags.json`. This is a model-level bias in `Recognai/zeroshot_selectra_medium`, not an extraction problem, and is tracked separately.
