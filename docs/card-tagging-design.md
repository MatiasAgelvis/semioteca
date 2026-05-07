## Plan: Card tagging — backend implementation

TL;DR - Tags are card-level, assigned automatically via embeddings+clustering (paraphrase-multilingual-MiniLM-L12-v2), implemented as a standalone post-processing script that enriches an existing `cards.json` in place on demand.

**Decisions**
- Card-level tags (each card gets its own set)
- Embeddings + clustering: `paraphrase-multilingual-MiniLM-L12-v2` for multilingual content
- Separate script `backend/tag_cards.py` — does NOT run as part of `generate_cards_json.py`
- Tags written back into `cards.json` in-place only when you run the tagging script explicitly
- `Card` model gains `tags: list[str]` with default empty list

---

### Phase 1 — Data model (prerequisite for all other phases)

1. `backend/card_models.py`
   - Add `tags: list[str] = field(default_factory=list)` to `Card` dataclass.
   - `asdict` will include it automatically in `to_dict`.

2. `backend/generate_cards_json.py`
   - Pass `tags=[]` explicitly when constructing each `Card` in `build_cards_for_source`.
   - This ensures cards.json always has the field, even before tagging runs.

3. Regenerate `backend/cards.json` so the field is present everywhere.

---

### Phase 2 — Standalone tagging script

4. Create `backend/tag_cards.py`:
   - Load `cards.json` (path via CLI arg, default `cards.json`).
   - Extract `content` text from each card (strip `[[IMAGE:N]]` placeholders).
   - Encode all cards with `SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")`.
   - Cluster embeddings (UMAP → HDBSCAN or plain KMeans as fallback).
   - For each cluster, identify a human-readable label:
     - Option A: extract top TF-IDF terms per cluster as the tag.
     - Option B: pick a keyword phrase from the cluster's centroid-nearest card.
   - Write back the updated `cards.json` with `tags` populated.
   - CLI flags: `--input`, `--output`, `--n-clusters` (for KMeans fallback), `--dry-run`.

5. `requirements.txt`
   - Add `sentence-transformers`, `umap-learn`, `hdbscan`, `scikit-learn`.

---

### Phase 3 — Frontend support (after backend works)

6. `frontend/src/lib/types/content.ts` — add `tags: string[]` to `CardRecord`.
7. `frontend/src/lib/components/CardItem.svelte` — render tags as small badges.
8. `frontend/src/routes/cards/+page.svelte` — include tags in searchable text.

---

**Relevant files**
- `backend/card_models.py` — add `tags` field
- `backend/generate_cards_json.py` — initialize `tags=[]` at card creation
- `backend/cards.json` — output; regenerate after model change
- `backend/tag_cards.py` — new standalone enrichment script
- `requirements.txt` — add ML deps
- `frontend/src/lib/types/content.ts` — `tags: string[]` on `CardRecord`
- `frontend/src/lib/components/CardItem.svelte` — render badges
- `frontend/src/routes/cards/+page.svelte` — search integration

**Verification**
1. `python generate_cards_json.py` produces cards with `"tags": []`.
2. `python tag_cards.py --dry-run` prints proposed cluster labels without writing.
3. `python tag_cards.py` writes tags back; manually inspect a few cards for label quality.
4. Frontend loads updated JSON; tags render as badges on cards.
5. Searching a tag keyword in the search bar surfaces matching cards.

---

**Open question**
For cluster labeling, TF-IDF term extraction is fully automatic but produces raw keyword strings. Should cluster labels be reviewed/renamed manually after a first run, or should the script try to produce clean human-readable labels from the start?
