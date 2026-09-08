"""Smoke tests for the source-document split patterns.

Every ``SourceDocument`` entry has a ``split_pattern`` that's used to chop
a source document into cards. If a pattern regresses (typo, lost character
class, etc.) every card in that book breaks at once — silent but total.

These tests take the first ``raw_marker`` from each book in the live
``cards.json`` and run it through the book's configured pattern. If the
regex doesn't match, the source file was regenerated with a new style and
the pattern needs updating.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from source_documents import (
    LEVINSON_2004_PATTERN,
    PAGE_DOT_PATTERN,
    PARENTHESIS_YEAR_PAGE_PATTERN,
    WARNOCK_PAGE_PATTERN,
    SourceDocument,
)

# --- Each pattern in isolation ---------------------------------------------

@pytest.mark.parametrize(
    "value",
    [
        "p. 45",
        "P. 45",
        "P.  45",
        "p.107-108",
        "P. 107-108",
        "P. 45.",
        "P. 45",
    ],
)
def test_page_dot_pattern_matches(value: str) -> None:
    assert re.match(PAGE_DOT_PATTERN, value) is not None


@pytest.mark.parametrize(
    "value",
    [
        "DAVIDSON, Donald (1984-1990:27).",
        "PUTNAM, H. (1990:16-17).",
        "ECO, U. (1992:42).",
        "Some Author (1990-2001:29).",
        "Some Author (1990:29).",
        "Some Author (1990: 826-827).",
    ],
)
def test_parenthesis_year_page_pattern_matches(value: str) -> None:
    assert re.match(PARENTHESIS_YEAR_PAGE_PATTERN, value) is not None


@pytest.mark.parametrize(
    "value",
    [
        "LEVINSON, S. C. (2004:30).",
        "LEVINSON, S. (2004:30).",
        "LEVINSON, S. (2004 (2000): 31).",
    ],
)
def test_levinson_2004_pattern_matches(value: str) -> None:
    assert re.match(LEVINSON_2004_PATTERN, value) is not None


@pytest.mark.parametrize(
    "value",
    [
        "Truth p.43",
        "Conocimiento y otras mentes p. 25",
        "p. 99",
    ],
)
def test_warnock_page_pattern_matches(value: str) -> None:
    assert re.match(WARNOCK_PAGE_PATTERN, value) is not None


# --- Each configured source's pattern actually matches its data ------------

def _live_cards_path() -> Path:
    return Path(__file__).resolve().parents[1] / "cards.json"


@pytest.fixture(scope="module")
def live_cards() -> dict:
    return json.loads(_live_cards_path().read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    "source_enum_name",
    [member.name for member in SourceDocument],
)
def test_first_marker_in_each_book_matches_its_pattern(
    source_enum_name: str, live_cards: dict
) -> None:
    """Regression test: a refactor of a pattern must be matched by an update
    here, otherwise this test catches the divergence before the data does."""
    config = SourceDocument[source_enum_name].value
    pattern = re.compile(config.split_pattern, flags=re.IGNORECASE | re.MULTILINE)
    # Find the matching book in cards.json by source filename.
    expected_filename = config.filename
    book = next(
        (b for b in live_cards["books"] if expected_filename in b.get("cards", [{}])[0].get("source_path", "")),
        None,
    )
    if book is None:
        pytest.skip(f"no live cards for {expected_filename}")
    first_marker = book["cards"][0]["raw_marker"]
    match = pattern.match(first_marker)
    assert match is not None, (
        f"first marker for {config.filename!r} did not match its split_pattern: {first_marker!r}"
    )
    # Page group should always be captured.
    assert match.group("page"), f"page group empty in match: {match.groupdict()}"
