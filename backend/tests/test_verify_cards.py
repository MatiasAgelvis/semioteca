"""Tests for the post-generation invariant checker.

The single source of truth for accepted page shapes lives in
:mod:`page_shapes`; these tests cover both that allow-list and the
:func:`verify_cards.verify` end-to-end checks.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
import verify_cards
from page_shapes import is_allowed_page

# --- Helpers --------------------------------------------------------------

def _book(author: str, *cards: dict, year: str = "2000") -> dict:
    """Build a book entry with consistent metadata across its cards."""
    return {
        "title": "T",
        "author": author,
        "book": "B",
        "year": year,
        "cards": list(cards),
    }


def _card(
    page: str = "29",
    *,
    card_id: str = "t-2000-b-1",
    author: str = "A",
    year: str = "2000",
    tags: list[str] | None = None,
    images: list[dict] | None = None,
    content: str = "Some body text.",
    **overrides,
) -> dict:
    """Build a minimally-valid card; override any field via kwargs."""
    card = {
        "id": card_id,
        "title": "T",
        "author": author,
        "book": "B",
        "year": year,
        "page": page,
        "raw_marker": "A (2000:29).",
        "content": content,
        "source_path": "ODT/A.odt",
        "source_format": "odt",
        "tags": tags if tags is not None else [],
        "images": images if images is not None else [],
    }
    card.update(overrides)
    return card


# --- is_allowed_page: shapes that ship in cards.json ------------------------

@pytest.mark.parametrize(
    "value",
    ["29", "180", "1006", "1024"],
)
def test_plain_page_numbers(value: str) -> None:
    assert is_allowed_page(value)


@pytest.mark.parametrize(
    "value",
    ["32-33", "826-827", "154-155-156", "89-90-91"],
)
def test_hyphen_ranges(value: str) -> None:
    assert is_allowed_page(value)


@pytest.mark.parametrize(
    "value",
    ["32-33", "32\u2013 33", "32 \u2014 33"],
)
def test_alternate_range_separators(value: str) -> None:
    # ASCII hyphen, en-dash and em-dash are all valid separators.
    assert is_allowed_page(value)


@pytest.mark.parametrize(
    "value",
    ["36\u2019", "132\u2019\u2019", "127 \u2018", "59'"],
)
def test_curly_quote_primes(value: str) -> None:
    assert is_allowed_page(value)


@pytest.mark.parametrize(
    "value",
    ["151 y ss", "744 y ss", "732 y ss"],
)
def test_spanish_y_ss(value: str) -> None:
    assert is_allowed_page(value)


def test_spanish_y_ss_with_chapter_free_text() -> None:
    # The "5 y ss del capítulo X" free-text form used by Putnam.
    value = "5 y ss del cap\u00edtulo Cerebros en una cubeta"
    assert is_allowed_page(value)


def test_three_segment_spanish_range() -> None:
    # Putnam-style "13-14 y 15" 3-segment range.
    assert is_allowed_page("13-14 y 15")


def test_roman_prefix() -> None:
    assert is_allowed_page("II, 3")


def test_comma_separated_list() -> None:
    assert is_allowed_page("105, 107, 109")


@pytest.mark.parametrize(
    "value",
    ["48(2)", "54 (2)", "149 (2)", "195 (2)"],
)
def test_subpage_marker(value: str) -> None:
    assert is_allowed_page(value)


@pytest.mark.parametrize(
    "value",
    [" 29 ", "\t180\t"],
)
def test_surrounding_whitespace(value: str) -> None:
    # ``verify()`` strips before matching, but the regex itself tolerates
    # leading/trailing whitespace too.
    assert is_allowed_page(value)


# --- is_allowed_page: artifacts that must keep being rejected ----------------

def test_empty_string() -> None:
    assert not is_allowed_page("")


@pytest.mark.parametrize(
    "value",
    ["-826-827", "-876", "-891"],
)
def test_stray_leading_hyphen(value: str) -> None:
    # The historical Honderich source-typo "(1995-2001:-826-827).".
    assert not is_allowed_page(value)


@pytest.mark.parametrize(
    "value",
    ["(156-157", "(180"],
)
def test_stray_leading_unbalanced_paren(value: str) -> None:
    # The historical Honderich source-typo "(1995-2001: (156-157).".
    assert not is_allowed_page(value)


def test_trailing_alpha() -> None:
    assert not is_allowed_page("29abc")


@pytest.mark.parametrize(
    "value",
    ["29.", "29/", "29#"],
)
def test_disallowed_punctuation(value: str) -> None:
    assert not is_allowed_page(value)


def test_double_leading_hyphen() -> None:
    assert not is_allowed_page("--826")


def test_malformed_roman() -> None:
    assert not is_allowed_page("II,III")


@pytest.mark.parametrize(
    "value",
    ["ss y 151", "151 ss y"],
)
def test_inverted_spanish_range(value: str) -> None:
    assert not is_allowed_page(value)


# --- verify(): per-card invariants -----------------------------------------

def test_missing_page_is_flagged() -> None:
    dataset = {"books": [_book("A", _card("29"), _card("", card_id="t-2000-b-2"))]}
    problems = verify_cards.verify(dataset)
    assert any("missing or empty 'page' field" in p for p in problems)


def test_none_page_is_flagged() -> None:
    dataset = {"books": [_book("A", _card(None, card_id="t-2000-b-2"))]}  # type: ignore[arg-type]
    problems = verify_cards.verify(dataset)
    assert any("missing or empty 'page' field" in p for p in problems)


def test_malformed_page_is_flagged() -> None:
    dataset = {"books": [_book("A", _card("-999"))]}
    problems = verify_cards.verify(dataset)
    assert any("does not match the allowed shape" in p for p in problems)


def test_duplicate_id_is_flagged() -> None:
    dataset = {"books": [_book("A", _card("29"), _card("30", card_id="t-2000-b-1"))]}
    problems = verify_cards.verify(dataset)
    assert any("duplicate card id" in p for p in problems)


def test_id_must_match_slug_n_pattern() -> None:
    dataset = {"books": [_book("A", _card("29", card_id="Not_A_Slug-42"))]}
    problems = verify_cards.verify(dataset)
    assert any("does not match the '<slug>-<n>' pattern" in p for p in problems)


# --- verify(): required-field invariants -----------------------------------

@pytest.mark.parametrize(
    "field",
    [
        "title", "author", "book", "year", "id",
        "content", "source_path", "source_format", "raw_marker",
    ],
)
def test_missing_required_field_is_flagged(field: str) -> None:
    card = _card("29")
    card[field] = ""
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset)
    assert any(f"missing or empty {field!r} field" in p for p in problems)


def test_required_field_with_none_is_flagged() -> None:
    card = _card("29")
    card["title"] = None
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset)
    assert any("missing or empty 'title' field" in p for p in problems)


# --- verify(): field-format invariants -------------------------------------

@pytest.mark.parametrize(
    "year",
    ["1990", "1990-2001"],
)
def test_well_formed_year_accepted(year: str) -> None:
    card = _card("29", year=year)
    dataset = {"books": [_book("A", card, year=year)]}
    assert verify_cards.verify(dataset) == []


@pytest.mark.parametrize(
    "year",
    ["90", "19900", "nineteen-ninety", "1990 ", " 1990"],
)
def test_malformed_year_is_flagged(year: str) -> None:
    card = _card("29", year=year)
    dataset = {"books": [_book("A", card, year=year)]}
    problems = verify_cards.verify(dataset)
    assert any("is not YYYY or YYYY-YYYY" in p for p in problems)


@pytest.mark.parametrize("fmt", ["odt", "docx"])
def test_allowed_source_formats_accepted(fmt: str) -> None:
    card = _card("29", source_format=fmt)
    dataset = {"books": [_book("A", card)]}
    assert verify_cards.verify(dataset) == []


@pytest.mark.parametrize("fmt", ["pdf", "epub", "ODT", ""])
def test_disallowed_source_format_is_flagged(fmt: str) -> None:
    card = _card("29", source_format=fmt)
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset)
    assert any("source_format" in p for p in problems)


# --- verify(): book-metadata consistency -----------------------------------

def test_book_metadata_match_is_ok() -> None:
    book = _book("A", _card("29"), _card("30", card_id="t-2000-b-2"))
    assert verify_cards.verify({"books": [book]}) == []


@pytest.mark.parametrize(
    "field",
    ["author", "title", "book", "year"],
)
def test_card_metadata_drift_is_flagged(field: str) -> None:
    card = _card("29", **{field: "DIFFERENT"})
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset)
    assert any(f"{field!r} 'DIFFERENT' does not match book" in p for p in problems)


# --- verify(): tag allow-list ----------------------------------------------

def test_known_tags_pass() -> None:
    card = _card("29", tags=["Semiótica", "Realismo"])
    dataset = {"books": [_book("A", card)]}
    assert verify_cards.verify(dataset, tag_allowlist=["Semiótica", "Realismo"]) == []


def test_unknown_tag_is_flagged() -> None:
    card = _card("29", tags=["Boustrophedon"])
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset, tag_allowlist=["Semiótica"])
    assert any("'Boustrophedon' is not in card-tags.json" in p for p in problems)


def test_empty_tag_allowlist_skips_tag_check() -> None:
    card = _card("29", tags=["Boustrophedon"])
    dataset = {"books": [_book("A", card)]}
    # An empty allow-list opts out of the tag check entirely.
    assert verify_cards.verify(dataset, tag_allowlist=[]) == []


def test_non_list_tags_field_is_flagged() -> None:
    card = _card("29")
    card["tags"] = "Semiótica"  # type: ignore[assignment]
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset, tag_allowlist=["Semiótica"])
    assert any("'tags' field must be a list" in p for p in problems)


# --- verify(): image integrity ---------------------------------------------

def test_existing_image_path_is_ok(tmp_path: Path) -> None:
    img_dir = tmp_path / "imgs"
    img_dir.mkdir()
    (img_dir / "img-1.png").write_bytes(b"fake")
    card = _card(
        "29",
        content="Some text [[IMAGE:1]] more text.",
        images=[{"path": "img-1.png", "placeholder_id": 1}],
    )
    dataset = {"books": [_book("A", card)]}
    assert verify_cards.verify(dataset, image_root=img_dir) == []


def test_missing_image_path_is_flagged(tmp_path: Path) -> None:
    img_dir = tmp_path / "imgs"
    img_dir.mkdir()
    card = _card(
        "29",
        images=[{"path": "does-not-exist.png", "placeholder_id": 1}],
    )
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset, image_root=img_dir)
    assert any("does not exist on disk" in p for p in problems)


def test_undeclared_image_placeholder_is_flagged(tmp_path: Path) -> None:
    img_dir = tmp_path / "imgs"
    img_dir.mkdir()
    card = _card(
        "29",
        content="text [[IMAGE:3]] text",
        images=[{"path": "img-1.png", "placeholder_id": 1}],
    )
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset, image_root=img_dir)
    assert any("[[IMAGE:N]] placeholders [3]" in p for p in problems)


def test_image_root_none_skips_filesystem_check() -> None:
    # Image files don't need to exist when image_root is None — the
    # placeholder check still runs and catches logical mismatches.
    card = _card(
        "29",
        content="text [[IMAGE:3]] text",
        images=[{"path": "does-not-exist.png", "placeholder_id": 1}],
    )
    dataset = {"books": [_book("A", card)]}
    problems = verify_cards.verify(dataset, image_root=None)
    # No filesystem problem, but the undeclared placeholder IS flagged.
    assert not any("does not exist on disk" in p for p in problems)
    assert any("[[IMAGE:N]] placeholders" in p for p in problems)


# --- verify(): full pipeline ------------------------------------------------

def test_clean_dataset_returns_no_problems(tmp_path: Path) -> None:
    img_dir = tmp_path / "imgs"
    img_dir.mkdir()
    (img_dir / "img-1.png").write_bytes(b"fake")
    book = _book(
        "A",
        _card("29", card_id="t-2000-b-1", tags=["Semiótica"]),
        _card(
            "30",
            card_id="t-2000-b-2",
            tags=["Realismo"],
            content="body [[IMAGE:1]] more",
            images=[{"path": "img-1.png", "placeholder_id": 1}],
        ),
    )
    dataset = {"books": [book]}
    problems = verify_cards.verify(
        dataset,
        tag_allowlist=["Semiótica", "Realismo"],
        image_root=img_dir,
    )
    assert problems == []


def test_empty_books_array_is_reported() -> None:
    problems = verify_cards.verify({"books": []})
    assert any("no 'books' array" in p for p in problems)


# --- verify(): live data sanity --------------------------------------------

def test_live_cards_json_satisfies_all_invariants() -> None:
    """End-to-end check against the generated dataset.

    The expectation is that the dataset checked into the repo always
    satisfies every invariant. If a regression lands here, the test
    fails loudly — which is the point.
    """
    cards_path = Path(__file__).resolve().parents[1] / "cards.json"
    tags_path = Path(__file__).resolve().parents[1] / "card-tags.json"
    dataset = json.loads(cards_path.read_text(encoding="utf-8"))
    tag_allowlist = [t["name"] for t in json.loads(tags_path.read_text(encoding="utf-8"))]
    image_root = Path(__file__).resolve().parents[1]

    problems = verify_cards.verify(
        dataset,
        tag_allowlist=tag_allowlist,
        image_root=image_root,
    )
    assert problems == [], problems
