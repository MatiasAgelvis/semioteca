"""End-to-end round-trip tests for the card-generation pipeline.

For each source book whose ODT/DOCX is checked into ``backend/ODT/``,
this test re-runs the full extraction pipeline and asserts the count of
generated cards matches what's already in ``cards.json``. The split
patterns and the ODT-to-text conversion are exercised together; if any
of them drift apart, this test catches it.

These tests are slow (each one runs ODT→DOCX→text) so we keep the scope
narrow: only check the card count, not the content. Per-card content
comparison would be flaky against minor ODT re-export differences.
"""

from __future__ import annotations

import json
from pathlib import Path

import generate_cards_json
import pytest
from generate_cards_json import build_cards_for_source
from source_documents import SourceDocument

REPO_ROOT = Path(__file__).resolve().parents[2]
ODT_DIR = REPO_ROOT / "backend" / "ODT"
IMAGE_ROOT = REPO_ROOT / "backend" / "cards_images"
CARDS_JSON = REPO_ROOT / "backend" / "cards.json"


def _expected_card_count(config_filename: str, cards: dict) -> int | None:
    """Look up the number of cards in cards.json for a given source file."""
    for book in cards["books"]:
        first_card = book.get("cards", [{}])[0]
        if config_filename in first_card.get("source_path", ""):
            return len(book["cards"])
    return None


# Convert each ODT once at import time so we don't pay the cost per test.
# (pypandoc is the slowest step; the rest is cheap.)

def _build(config) -> list:
    source_path = ODT_DIR / config.filename
    if not source_path.exists():
        return None
    return build_cards_for_source(source_path, config, IMAGE_ROOT)


@pytest.fixture(scope="module")
def live_cards() -> dict:
    return json.loads(CARDS_JSON.read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    "source_enum_name",
    [member.name for member in SourceDocument],
)
def test_round_trip_card_count(source_enum_name: str, live_cards: dict) -> None:
    """Generated cards for each source match the count in cards.json."""
    config = SourceDocument[source_enum_name].value
    source_path = ODT_DIR / config.filename
    if not source_path.exists():
        pytest.skip(f"ODT not checked in: {config.filename}")

    expected = _expected_card_count(config.filename, live_cards)
    if expected is None:
        pytest.skip(f"no cards.json entry for {config.filename}")

    result = _build(config)
    assert result is not None
    # The pipeline drops empty divider-only cards; ``cards.json`` already
    # reflects the post-drop count, so we compare the same way.
    non_empty = [card for card in result.cards if card.content.strip() or card.images]
    assert len(non_empty) == expected, (
        f"{config.filename}: generated {len(non_empty)} cards, "
        f"cards.json has {expected}"
    )
