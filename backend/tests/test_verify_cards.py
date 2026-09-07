"""Tests for the post-generation invariant checker.

The single source of truth for accepted page shapes lives in
:mod:`page_shapes`; these tests cover both that allow-list and the
:func:`verify_cards.verify` end-to-end checks.
"""

from __future__ import annotations

import pytest
import verify_cards
from page_shapes import is_allowed_page

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


# --- verify(): end-to-end checks --------------------------------------------

def _book(author: str, *cards: dict) -> dict:
    return {
        "title": "T",
        "author": author,
        "book": "B",
        "year": "2000",
        "cards": list(cards),
    }


def test_missing_page_is_flagged() -> None:
    dataset = {"books": [_book("A", {"id": "c1", "page": "29"}, {"id": "c2", "page": ""})]}
    problems = verify_cards.verify(dataset)
    assert any("missing or empty 'page' field" in p for p in problems)


def test_none_page_is_flagged() -> None:
    dataset = {"books": [_book("A", {"id": "c1", "page": None})]}
    problems = verify_cards.verify(dataset)
    assert any("missing or empty 'page' field" in p for p in problems)


def test_malformed_page_is_flagged() -> None:
    dataset = {"books": [_book("A", {"id": "c1", "page": "-999"})]}
    problems = verify_cards.verify(dataset)
    assert any("does not match the allowed shape" in p for p in problems)


def test_duplicate_id_is_flagged() -> None:
    dataset = {"books": [_book("A", {"id": "c1", "page": "29"}, {"id": "c1", "page": "30"})]}
    problems = verify_cards.verify(dataset)
    assert any("duplicate card id" in p for p in problems)


def test_clean_dataset_returns_no_problems() -> None:
    dataset = {"books": [_book("A", {"id": "c1", "page": "29"}, {"id": "c2", "page": "826-827"})]}
    assert verify_cards.verify(dataset) == []


def test_empty_books_array_is_reported() -> None:
    problems = verify_cards.verify({"books": []})
    assert any("no 'books' array" in p for p in problems)
