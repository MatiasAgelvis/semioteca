#!/usr/bin/env python3
# coding: utf-8

"""Verify invariants on the generated ``cards.json``.

The frontend renders every card with a page badge (``p. <page>``) and falls
back to ``s/p`` when ``page`` is missing. That fallback has caused UI bugs in
the past, so the generator must guarantee that every shipped card satisfies
a set of invariants before it gets synced to the frontend.

Exit status:
    0  — every card satisfies the required invariants.
    1  — at least one card violated an invariant.

The script intentionally stays small and dependency-free so it can run as a
fast pre-commit / CI check on top of an already generated ``cards.json``.

Invariants enforced (see :func:`verify` for the full list):

    1.  Every card has a non-empty ``page`` matching :mod:`page_shapes`.
    2.  Every card has a non-empty ``id``, unique across the dataset, and
        matching the ``slug-N`` convention.
    3.  Every card has the metadata fields the frontend renders
        (``title``, ``author``, ``book``, ``year``, ``content``,
        ``source_path``, ``source_format``, ``raw_marker``).
    4.  ``year`` matches ``YYYY`` or ``YYYY-YYYY``; ``source_format`` is in
        ``{odt, docx}``.
    5.  Within a book, every card inherits the book's
        ``author``/``title``/``book``/``year``.
    6.  Every ``tag`` belongs to the ``card-tags.json`` allow-list.
    7.  Every ``image.path`` exists on disk under ``image_root``.
    8.  Every ``[[IMAGE:N]]`` placeholder in ``content`` matches a
        ``placeholder_id`` declared on the same card.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Callable, Iterable, Optional

from page_shapes import is_allowed_page

# --- Pattern constants ----------------------------------------------------

# Card IDs follow the convention ``<author-or-book-slug>-<index>``.
# Example: ``honderich-2001-enciclopedia-oxford-42``.
_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$")
_YEAR_PATTERN = re.compile(r"^\d{4}(?:-\d{4})?$")
_IMAGE_PLACEHOLDER = re.compile(r"\[\[IMAGE:(\d+)\]\]")

_REQUIRED_FIELDS: tuple[str, ...] = (
    "id",
    "title",
    "author",
    "book",
    "year",
    "content",
    "source_path",
    "source_format",
    "raw_marker",
)
_ALLOWED_SOURCE_FORMATS: frozenset[str] = frozenset({"odt", "docx"})
_BOOK_METADATA_FIELDS: tuple[str, ...] = ("author", "title", "book", "year")


# --- Individual checks ----------------------------------------------------

def _check_page_shape(card_id: str, author: str, card: dict) -> list[str]:
    problems: list[str] = []
    page = card.get("page")
    normalized_page = page.strip() if isinstance(page, str) else ""

    if not normalized_page:
        problems.append(f"{card_id} (author={author}): missing or empty 'page' field")
        return problems

    if not is_allowed_page(normalized_page):
        problems.append(
            f"{card_id} (author={author}): page {page!r} does not match the allowed shape"
        )
    return problems


def _check_required_fields(card_id: str, author: str, card: dict) -> list[str]:
    problems: list[str] = []
    for field in _REQUIRED_FIELDS:
        value = card.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            problems.append(f"{card_id} (author={author}): missing or empty {field!r} field")
    return problems


def _check_field_formats(card_id: str, author: str, card: dict) -> list[str]:
    problems: list[str] = []
    year = card.get("year")
    if isinstance(year, str) and not _YEAR_PATTERN.match(year):
        problems.append(f"{card_id} (author={author}): year {year!r} is not YYYY or YYYY-YYYY")

    source_format = card.get("source_format")
    if source_format not in _ALLOWED_SOURCE_FORMATS:
        problems.append(
            f"{card_id} (author={author}): source_format {source_format!r} "
            f"is not one of {sorted(_ALLOWED_SOURCE_FORMATS)}"
        )

    card_id_value = card.get("id")
    if isinstance(card_id_value, str) and card_id_value and not _ID_PATTERN.match(card_id_value):
        problems.append(
            f"{card_id}: id {card_id_value!r} does not match the '<slug>-<n>' pattern"
        )
    return problems


def _check_book_metadata_consistency(dataset: dict) -> list[str]:
    problems: list[str] = []
    for book in dataset.get("books", []):
        author = book.get("author", "<unknown>")
        for card in book.get("cards", []):
            card_id = card.get("id") or "<missing id>"
            for field in _BOOK_METADATA_FIELDS:
                book_value = book.get(field)
                card_value = card.get(field)
                if book_value != card_value:
                    problems.append(
                        f"{card_id} (author={author}): {field!r} {card_value!r} "
                        f"does not match book {field!r} {book_value!r}"
                    )
    return problems


def _check_tags_allowlist(tag_allowlist: Iterable[str]) -> Callable[[str, str, dict], list[str]]:
    # An empty allow-list means the caller opted out of the tag check
    # entirely; we return a no-op rather than flagging every card.
    allowed: Optional[set[str]] = set(tag_allowlist) if tag_allowlist else None
    if allowed is not None and not allowed:
        allowed = None

    def check(card_id: str, author: str, card: dict) -> list[str]:
        if allowed is None:
            return []
        problems: list[str] = []
        tags = card.get("tags")
        if not isinstance(tags, list):
            problems.append(
                f"{card_id} (author={author}): 'tags' field must be a list, got {type(tags).__name__}"
            )
            return problems
        for tag in tags:
            if tag not in allowed:
                problems.append(
                    f"{card_id} (author={author}): tag {tag!r} is not in card-tags.json"
                )
        return problems

    return check


def _check_images(
    card_id: str, author: str, card: dict, image_root: Optional[Path]
) -> list[str]:
    problems: list[str] = []
    images = card.get("images") or []
    declared_ids: set[int] = set()
    for image in images:
        placeholder_id = image.get("placeholder_id")
        if placeholder_id is not None:
            declared_ids.add(placeholder_id)

        path = image.get("path")
        if image_root is not None and path:
            full_path = image_root / path
            if not full_path.exists():
                problems.append(
                    f"{card_id} (author={author}): image path {path!r} does not exist on disk"
                )

    referenced_ids = {
        int(match.group(1))
        for match in _IMAGE_PLACEHOLDER.finditer(card.get("content") or "")
    }
    missing_refs = referenced_ids - declared_ids
    if missing_refs:
        problems.append(
            f"{card_id} (author={author}): [[IMAGE:N]] placeholders "
            f"{sorted(missing_refs)} not declared in this card's images"
        )
    return problems


# --- Driver ---------------------------------------------------------------

def iter_cards(dataset: dict) -> list[tuple[str, dict]]:
    """Flatten ``(author, card)`` tuples from the dataset's book groups."""
    pairs: list[tuple[str, dict]] = []
    for book in dataset.get("books", []):
        author = book.get("author", "<unknown>")
        for card in book.get("cards", []):
            pairs.append((author, card))
    return pairs


def verify(
    dataset: dict,
    *,
    tag_allowlist: Iterable[str] = (),
    image_root: Optional[Path] = None,
) -> list[str]:
    """Return a list of human-readable problems; empty list means OK.

    ``tag_allowlist`` is the iterable of tag names defined in
    ``card-tags.json``. Pass an empty iterable to skip the tag check.

    ``image_root`` is the directory under which ``image.path`` is resolved
    to check that the file exists on disk. Pass ``None`` to skip the
    filesystem check (the in-content placeholder check still runs).
    """
    problems: list[str] = []

    books = dataset.get("books")
    if not isinstance(books, list) or not books:
        problems.append("dataset has no 'books' array")
        return problems

    # Per-card checks ---------------------------------------------------
    seen_ids: set[str] = set()
    check_tags = _check_tags_allowlist(tag_allowlist)

    for author, card in iter_cards(dataset):
        card_id = card.get("id") or "<missing id>"

        # Uniqueness must be checked first so subsequent checks can safely
        # use ``card_id`` to point at offenders.
        if card_id in seen_ids:
            problems.append(f"{card_id}: duplicate card id")
        seen_ids.add(card_id)

        problems.extend(_check_page_shape(card_id, author, card))
        problems.extend(_check_required_fields(card_id, author, card))
        problems.extend(_check_field_formats(card_id, author, card))
        problems.extend(check_tags(card_id, author, card))
        problems.extend(_check_images(card_id, author, card, image_root))

    # Cross-card checks --------------------------------------------------
    problems.extend(_check_book_metadata_consistency(dataset))

    return problems


# --- CLI ------------------------------------------------------------------

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
        "--card-tags-json",
        default="card-tags.json",
        help="Path to the card-tags.json file (default: card-tags.json).",
    )
    parser.add_argument(
        "--image-root",
        default=".",
        help="Directory under which image paths are resolved (default: current dir).",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only print a one-line summary; suppress per-card diagnostics.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cards_path = Path(args.cards_json)
    if not cards_path.exists():
        print(f"[verify-cards] cards.json not found at {cards_path}", file=sys.stderr)
        return 1

    tag_allowlist: list[str] = []
    tags_path = Path(args.card_tags_json)
    if tags_path.exists():
        tag_allowlist = [t["name"] for t in json.loads(tags_path.read_text(encoding="utf-8")) if "name" in t]

    image_root = Path(args.image_root).resolve()

    dataset = json.loads(cards_path.read_text(encoding="utf-8"))
    total_cards = sum(len(book.get("cards", [])) for book in dataset.get("books", []))
    problems = verify(dataset, tag_allowlist=tag_allowlist, image_root=image_root)

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
