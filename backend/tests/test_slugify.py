"""Tests for ``generate_cards_json.slugify``.

The slugify helper turns a card ``id`` stem (typically the source filename
without extension) into the lowercase-hyphenated prefix used by every card
ID. Card IDs follow the convention ``<slug>-<index>`` and the verifier
rejects anything that doesn't match that pattern, so the slug helper is on
the critical path.
"""

from __future__ import annotations

import pytest
from generate_cards_json import slugify


@pytest.mark.parametrize(
    "raw, expected",
    [
        # Common source-file names used by the project
        ("Honderich 2001 Enciclopedia Oxford", "honderich-2001-enciclopedia-oxford"),
        ("Avranmides 2019 Knowing Other Minds", "avranmides-2019-knowing-other-minds"),
        ("Cuenca y Hilferty 1999 Intruducción a la lingüística cognitiva", "cuenca-y-hilferty-1999-intruducci-n-a-la-ling-stica-cognitiva"),
        ("Strawson 1997 Análisis y metafísica", "strawson-1997-an-lisis-y-metaf-sica"),
        # Diacritics are stripped (the regex substitutes any non-[a-z0-9])
        ("Año", "a-o"),
        # Edge cases
        ("  spaces  around  ", "spaces-around"),
        ("---", ""),
        ("", ""),
        ("plain", "plain"),
    ],
)
def test_slugify(raw: str, expected: str) -> None:
    assert slugify(raw) == expected


def test_slugify_strips_trailing_dashes() -> None:
    # ``slugify`` should not leave leading or trailing hyphens, otherwise the
    # resulting card ID would start/end with ``-`` and fail the
    # ``<slug>-<n>`` regex check.
    assert slugify("hello world") == "hello-world"
    assert slugify("hello-world") == "hello-world"
    assert slugify("hello--world") == "hello-world"
