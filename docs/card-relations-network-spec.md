# Card Relationship Network

## Goal

Generate semantic relationship data between cards and inject it into the static build pipeline, enabling a "Related cards" feature on the frontend.

---

## Current state

| What                            | Where                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| Card data                       | `backend/cards.json` — 2,556 cards, 23 books, 17 authors, 8 tags                     |
| Model for tagging (active)      | `Recognai/zeroshot_selectra_medium` (NLI zero-shot, in `nli_tagger.py`)              |
| Model for embedding (disabled)  | `ibm-granite/granite-embedding-311m-multilingual-r2` (in `embedding_tagger.py`)      |
| Model prototyped for similarity | `paraphrase-multilingual-MiniLM-L12-v2` (from todo.md)                               |
| Content sync                    | `scripts/sync-content.mjs` copies `cards.json` → `frontend/static/content/`          |
| Build pipeline                  | `npm run content:generate` → `cards.json`, then `npm run content:sync` → static site |

---

## Target output

Add a `relatedCards` field to each card in `cards.json`:

```jsonc
// Before
{ "id": "...", "title": "...", "content": "...", "tags": [...] }

// After
{
  "id": "...",
  "title": "...",
  "content": "...",
  "tags": [...],
  "relatedCards": [
    { "id": "putnam-1994-las-mil-caras-del-realismo-3", "score": 0.87 },
    { "id": "rorty-1991-contigencencia-ironia-y-solidaridad-7", "score": 0.74 }
  ]
}
```

- Top **10** related cards per card
- Sorted by descending relevance score
- Score normalized 0–1
- Related cards stored in a **separate file** (`backend/card-relations.json`) — cleaner separation, makes iteration easier

---

## Algorithm

A hybrid scoring function combining multiple signals:

```
score(A, B) = α × sim_embedding + β × sim_tags + γ × sim_author + δ × sim_book
```

| Signal                   | Weight   | Rationale                                           |
| ------------------------ | -------- | --------------------------------------------------- |
| **Embedding similarity** | α = 0.70 | Core semantic overlap (content-based)               |
| **Tag overlap**          | β = 0.15 | Shared categorical domain                           |
| **Same author**          | γ = 0.10 | Intellectual lineage / style                        |
| **Same book**            | δ = 0.05 | Already explicit in grouping, reinforces clustering |

**Exclusions**: Cards from the same book are not excluded from results, but the same-book signal is deliberately low-weighted so the top results are still semantically driven.

### Embedding model

→ **`paraphrase-multilingual-MiniLM-L12-v2`** (384-dim, already prototyped)

- Multilingual, Spanish-friendly
- Small footprint (~118 MB)
- Fast inference on CPU (2,556 cards → ~30s on a modern Mac)
- Uses `sentence-transformers` (already in `requirements.txt`)

### Computational optimization

2,556 cards → 3.2M pairwise comparisons. Instead of full N²:

1. Compute embeddings once → 2,556 × 384 matrix
2. For each card, use `sklearn.metrics.pairwise.cosine_similarity` against the full matrix
3. Filter top-10 per card

This is ~3.2M dot products — roughly 5 seconds on CPU.

---

## Integration

A new Python script: `backend/generate_card_relations.py`

```mermaid
flowchart LR
    A[cards.json] --> B[generate_card_relations.py]
    B --> C[sentence-transformers\n→ embeddings]
    C --> D[cosine_similarity\n+ tag/author/book boosts]
    D --> E[top-10 per card]
    E --> F[card-relations.json]
```

Hooks into the existing pipeline:

```sh
npm run content:generate   # regenerate cards.json (existing)
npm run content:relations  # NEW: compute relatedCards → card-relations.json
npm run content:sync       # copy to frontend (existing)
npm run content:prepare    # generate + relations + sync (updated)
```

Updates to `package.json`:

```jsonc
{
  "scripts": {
    "content:relations": "cd backend && sh ../scripts/venv-python.sh generate_card_relations.py",
    "content:prepare": "npm run content:generate && npm run content:relations && npm run content:sync",
  },
}
```

The sync script (`sync-content.mjs`) will need a small update to also copy `card-relations.json` to the frontend static directory.

---

## Implementation steps

### Step 1: Embedding + raw similarity

- Create `generate_card_relations.py`
- Load `cards.json` via `Library.from_dict()`
- Embed all card contents using `paraphrase-multilingual-MiniLM-L12-v2`
- Compute pairwise cosine similarity
- Write top-10 per card to `card-relations.json` (no boosts yet)

### Step 2: Hybrid scoring

- Add tag Jaccard similarity
- Add binary author / book match
- Weighted combination with tunable α/β/γ/δ

### Step 3: Embedding cache

- Cache embeddings to a `.npy` file
- Skip re-embedding if `cards.json` hasn't changed
- Makes incremental runs near-instant

### Step 4: Wire into build pipeline

- Add `npm run content:relations`
- Update `npm run content:prepare`
- Add `card-relations.json` to `sync-content.mjs`

### Step 5: Frontend integration

- Consume `card-relations.json` on the card detail page
- Display "Related cards" section below the card content
- Click navigates to related card

---

## Open decisions

| Decision                         | Options                                                  | Recommendation                                            |
| -------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Model                            | `MiniLM-L12-v2` vs `Granite 311m`                        | MiniLM — lighter, faster, already tested                  |
| Top-N                            | 5 vs 10 vs 15                                            | 10 — good density without noise                           |
| Caching format                   | `.pickle` vs `.npy`                                      | `.npy` — portable, no serialization issues                |
| Same-book exclusion              | Allow vs exclude from related                            | Allow — but low-weight so cross-book dominates            |
| Relations storage                | Inline in `cards.json` vs separate `card-relations.json` | **Separate file** — cleaner separation, easier to iterate |
| Edge case: short/empty cards     | Skip or treat as low-confidence                          | Recommend skipping cards under 50 chars                   |
| Edge case: title/author mismatch | Cards with missing metadata                              | Fall back to pure embedding similarity                    |
