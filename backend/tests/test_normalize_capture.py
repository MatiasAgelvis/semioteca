"""Tests for ``generate_cards_json.normalize_capture``.

The function strips stray characters that source ODTs occasionally leave
between the year and the page reference, e.g. ``"-826-827"`` or
``"(156-157"``. These tests pin the exact contract so a refactor can't
silently change the cleanup behaviour.
"""

from __future__ import annotations

import pytest

from generate_cards_json import normalize_capture


def test_none_passes_through() -> None:
    assert normalize_capture(None) is None


@pytest.mark.parametrize("value", ["", "   "])
def test_empty_or_whitespace_becomes_none(value: str) -> None:
    assert normalize_capture(value) is None


@pytest.mark.parametrize(
    "value",
    ["29", "32-33", "151 y ss", "826-827", "105, 107, 109"],
)
def test_clean_value_is_returned_unchanged(value: str) -> None:
    assert normalize_capture(value) == value


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("(156-157)", "156-157"),
        ("  (156-157)  ", "156-157"),
    ],
)
def test_outer_balanced_parens_are_stripped(raw: str, expected: str) -> None:
    assert normalize_capture(raw) == expected


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("-826-827", "826-827"),
        ("-891", "891"),
        ("-890-891", "890-891"),
    ],
)
def test_leading_hyphen_is_stripped(raw: str, expected: str) -> None:
    # The Honderich source-typo "(1995-2001:-826-827)." yields "-826-827".
    assert normalize_capture(raw) == expected


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("(156-157", "156-157"),
        ("(180", "180"),
    ],
)
def test_leading_unbalanced_paren_is_stripped(raw: str, expected: str) -> None:
    # The Honderich source-typo "(1995-2001: (156-157)." yields "(156-157".
    assert normalize_capture(raw) == expected


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("(-826-827)", "826-827"),  # outer balanced paren + leading hyphen
        ("(-826-827", "826-827"),   # unbalanced paren + leading hyphen
        ("-(-826-827", "826-827"),  # leading hyphen + unbalanced paren
    ],
)
def test_combined_paren_and_dash_typos(raw: str, expected: str) -> None:
    # Order shouldn't matter: any leading stray char should be peeled off.
    assert normalize_capture(raw) == expected


def test_whitespace_is_trimmed() -> None:
    assert normalize_capture("  29  ") == "29"
