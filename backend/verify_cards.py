#!/usr/bin/env python3
# coding: utf-8

"""Verify invariants on the generated ``cards.json``.

The frontend renders every card with a page badge (``p. <page>``) and falls
back to ``s/p`` when ``page`` is missing. That fallback has caused UI bugs in
the past, so the generator must guarantee that every shipped card has a
non-empty ``page`` string whose content matches one of the accepted shapes
described in :mod:`page_shapes`.

Exit status:
    0  — every card satisfies the required invariants.
    1  — at least one card violated an invariant.

The script intentionally stays small and dependency-free so it can run as a
fast pre-commit / CI check on top of an already generated ``cards.json``.
"""

import argparse
import json
import sys
from pathlib import Path

from page_shapes import is_allowed_page


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify that cards.json satisfies the constraints the frontend relies on.",
    )
    parser.add_argument(
        "--cards-json",
        default="cards.json",
        help="Path to the generated cards.json file (default: cards.json).",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only print a one-line summary; suppress per-card diagnostics.",
    )
    return parser.parse_args()


def iter_cards(dataset: dict) -> list[tuple[str, dict]]:
    """Flatten (book, card) tuples from the cards.json payload."""
    pairs: list[tuple[str, dict]] = []
    for book in dataset.get("books", []):
        author = book.get("author", "<unknown>")
        for card in book.get("cards", []):
            pairs.append((author, card))
    return pairs


def verify(dataset: dict) -> list[str]:
    """Return a list of human-readable problems; empty list means OK."""
    problems: list[str] = []

    books = dataset.get("books")
    if not isinstance(books, list) or not books:
        problems.append("dataset has no 'books' array")
        return problems

    seen_ids: set[str] = set()
    for author, card in iter_cards(dataset):
        card_id = card.get("id") or "<missing id>"
        page = card.get("page")
        normalized_page = page.strip() if isinstance(page, str) else ""

        # Constraint the frontend depends on: every card must have a page.
        if not normalized_page:
            problems.append(
                f"{card_id} (author={author}): missing or empty 'page' field"
            )
            continue

        # Page content must match the allow-list of shapes (see
        # ``page_shapes`` for the inventory); this rejects source typos like
        # ``-826-827`` or ``(156-157`` and any other garbage that slipped
        # into the generator output before now.
        if not is_allowed_page(normalized_page):
            problems.append(
                f"{card_id} (author={author}): page {page!r} does not match the allowed shape"
            )

        # IDs must be unique so cross-card relations stay well-defined.
        if card_id in seen_ids:
            problems.append(f"{card_id}: duplicate card id")
        seen_ids.add(card_id)

    return problems


def main() -> int:
    args = parse_args()
    cards_path = Path(args.cards_json)
    if not cards_path.exists():
        print(f"[verify-cards] cards.json not found at {cards_path}", file=sys.stderr)
        return 1

    dataset = json.loads(cards_path.read_text(encoding="utf-8"))
    total_cards = sum(len(book.get("cards", [])) for book in dataset.get("books", []))
    problems = verify(dataset)

    if problems:
        print(f"[verify-cards] FAILED — {len(problems)} problem(s) in {total_cards} cards:", file=sys.stderr)
        if not args.quiet:
            for problem in problems:
                print(f"  - {problem}", file=sys.stderr)
        return 1

    print(f"[verify-cards] OK — {total_cards} cards across {len(dataset.get('books', []))} books all have a page.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
