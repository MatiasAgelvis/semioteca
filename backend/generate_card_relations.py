#!/usr/bin/env python3
"""Generate card-relations.json from cards.json.

Uses Granite 311M multilingual embeddings (768-dim, 32K token context)
combined with tag/author signals into a hybrid score. Embeddings are
cached to .npy so only changed card content triggers re-embedding.
"""

import hashlib
import json
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
from card_models import Library
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL_ID = "ibm-granite/granite-embedding-311m-multilingual-r2"
TOP_N = 10
SOURCE = Path(__file__).resolve().parent / "cards.json"
TARGET = Path(__file__).resolve().parent / "card-relations.json"
CACHE_DIR = Path(__file__).resolve().parent / "cache"

# How many characters of content to feed the model.
CONTENT_MAX_CHARS = 2000  # Granite handles 32K tokens
MIN_CONTENT_LEN = 50

# Hybrid score weights (sum to 1.0 for interpretable scores)
W_EMBEDDING = 0.70
W_TAGS = 0.15
W_AUTHOR = 0.10
W_BOOK = 0.05  # unused — cross-book author boost handles this better


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def normalize_text(card) -> str:
    """Concise text representation for embedding."""
    content = (card.content or "")[:CONTENT_MAX_CHARS]
    return f"{card.title}: {content}"


def load_cards() -> list:
    """Flatten all cards from cards.json into a list."""
    library = Library.from_dict(json.loads(SOURCE.read_text(encoding="utf-8")))
    cards = []
    for book in library.books:
        cards.extend(book.cards)
    return cards


def content_hash(cards: list) -> str:
    """Stable hash of the card texts used for embeddings."""
    h = hashlib.sha256()
    for c in cards:
        h.update((c.id or "").encode())
        h.update(normalize_text(c).encode())
    return h.hexdigest()


def cached_embeddings(model: SentenceTransformer, cards: list) -> np.ndarray:
    """Load embeddings from disk if card content hasn't changed, else compute."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    emb_path = CACHE_DIR / "embeddings.npy"
    hash_path = CACHE_DIR / "cards_hash.txt"
    chash = content_hash(cards)

    if emb_path.exists() and hash_path.exists():
        cached_hash = hash_path.read_text().strip()
        if cached_hash == chash:
            print("  → cache hit — loading embeddings from disk")
            return np.load(emb_path)
        else:
            print("  → cache stale — recomputing embeddings")

    t0 = time.time()
    texts = [normalize_text(c) for c in cards]
    emb = model.encode(
        texts,
        show_progress_bar=True,
        batch_size=8,
        normalize_embeddings=True,
    )
    emb = np.array(emb)
    np.save(emb_path, emb)
    hash_path.write_text(chash)
    print(f"  → embeddings saved to cache ({time.time() - t0:.1f}s)")
    return emb


def jaccard(a: set, b: set) -> float:
    """Jaccard similarity between two sets. Returns 0 if both empty."""
    if not a or not b:
        return 0.0
    union = len(a | b)
    return len(a & b) / union if union else 0.0


# ---------------------------------------------------------------------------
# Hybrid relation computation
# ---------------------------------------------------------------------------


def compute_relations(
    embeddings: np.ndarray,
    cards: list,
    top_n: int,
) -> dict[str, list[dict]]:
    """Build {card_id: [{id, score}, ...]} dict using hybrid scoring.

    Uses grouping for author/book/tag signals to avoid O(N²) Python loops.
    """
    N = len(cards)
    emb_sim = cosine_similarity(embeddings)  # (N, N)

    # --- Pre-compute metadata ---
    tag_sets = [set(c.tags or []) for c in cards]
    authors = [c.author or "" for c in cards]
    books = [c.book or "" for c in cards]

    # Group card indices by author, book, and each tag for fast sparse access
    by_author: dict[str, list[int]] = defaultdict(list)
    by_book: dict[str, list[int]] = defaultdict(list)
    by_tag: dict[str, list[int]] = defaultdict(list)
    for i in range(N):
        if authors[i]:
            by_author[authors[i]].append(i)
        if books[i]:
            by_book[books[i]].append(i)
        for tag in tag_sets[i]:
            by_tag[tag].append(i)

    relations: dict[str, list[dict]] = {}

    for i in tqdm(range(N), desc="Building relations", unit="card"):
        hybrid = emb_sim[i].copy() * W_EMBEDDING

        # --- Tag Jaccard (only compute for cards that share at least one tag) ---
        candidates = set()
        for tag in tag_sets[i]:
            candidates.update(by_tag.get(tag, []))
        candidates.discard(i)
        for j in candidates:
            hybrid[j] += jaccard(tag_sets[i], tag_sets[j]) * W_TAGS

        # --- Author boost (only cross-book: same author across different books) ---
        for j in by_author.get(authors[i], []):
            if j != i and books[j] != books[i]:
                hybrid[j] += W_AUTHOR

        order = np.argsort(hybrid)[::-1]
        top = []
        for j in order:
            if j == i:
                continue
            if len(top) >= top_n:
                break
            top.append({"id": cards[j].id, "score": round(float(hybrid[j]), 4)})
        relations[cards[i].id] = top

    return relations


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    print(f"Loading {SOURCE.name} …")
    cards = load_cards()
    print(f"  → {len(cards)} cards loaded")

    valid = [c for c in cards if len(c.content or "") >= MIN_CONTENT_LEN]
    skipped = len(cards) - len(valid)
    if skipped:
        print(f"  → {skipped} cards skipped (content < {MIN_CONTENT_LEN} chars)")

    print(f"\nLoading model {MODEL_ID} …")
    t0 = time.time()
    model = SentenceTransformer(MODEL_ID)
    print(f"  → {time.time() - t0:.1f}s")

    print("\nEmbeddings …")
    embeddings = cached_embeddings(model, valid)
    print(f"  → {embeddings.shape[0]} × {embeddings.shape[1]}")

    print(f"\nComputing top-{TOP_N} relations …")
    t0 = time.time()
    relations = compute_relations(embeddings, valid, TOP_N)
    print(f"  → {len(relations)} card entries ({time.time() - t0:.1f}s)")

    # Fill skipped cards with empty lists
    for card in cards:
        if card.id not in relations:
            relations[card.id] = []

    TARGET.write_text(
        json.dumps(relations, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nWrote {TARGET}")


if __name__ == "__main__":
    main()
