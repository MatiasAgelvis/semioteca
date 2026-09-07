"""Page-shape catalog for the ``page`` field on every card.

The frontend renders every card with a page badge (``p. <page>``) and falls
back to ``s/p`` when ``page`` is missing. The fallback has caused UI bugs in
the past, so the generator must guarantee that every shipped card has a
non-empty ``page`` string whose content matches one of the accepted shapes
in this module. ``verify_cards`` enforces that invariant against the
generated ``cards.json``.

Shape inventory
--------------

Each shape below corresponds to at least one real value in ``cards.json``.
The set is intentionally an *allow-list*: a card whose ``page`` doesn't
match any of these is rejected by the verifier.

==================  =====================================================  ============
Shape               Regex / description                                    Example(s)
==================  =====================================================  ============
Single              Bare digit run, optional curly-quote primes, with     ``29`` ``36'`` ``127 '`` ``132''``
                    optional whitespace before/after.
Range               Two or more digit runs joined by ``-``/en-dash/em-dash ``32-33`` ``826-827`` ``154-155-156``
                    (each segment may carry curly-quote primes).
Spanish "y ss"      Digit run followed by ``y ss``; optionally followed    ``151 y ss`` ``744 y ss`` ``5 y ss del
                    by ``del capítulo …`` (free text after).              capítulo Cerebros en una cubeta``
3-segment Spanish   Range-prefix followed by ``y <digit>``.                ``13-14 y 15``
Roman prefix        Roman-numeral chapter / part label + ``, <digit>``.   ``II, 3``
Comma list          Two or more digit runs separated by ``, ``.           ``105, 107, 109``
Sub-page            Digit run with a parenthesised sub-page number.        ``48(2)`` ``54 (2)`` ``149 (2)`` ``195 (2)``
==================  =====================================================  ============

Rejected on purpose
-------------------

These are the artifacts the verifier exists to catch. They used to slip
through the generator (see ``generate_cards_json.normalize_capture``) and
break the frontend badge layout.

- Stray leading hyphen: ``-826-827``, ``-876``, ``-891``, … — comes from
  source ODTs that re-use the year-range separator before the page
  (``Honderich (1995-2001:-826-827).``).
- Stray leading unbalanced paren: ``(156-157``, ``(180`` — comes from
  source ODTs that re-use the marker-closer for the page reference
  (``Honderich (1995-2001: (156-157).``).
- Any other junk (trailing letters, ``29.``, ``29/``, ``II,III``, ``ss y 151``).
"""

from __future__ import annotations

import re

# --- Building blocks ----------------------------------------------------

_DIGIT = r"\d"

# Range separators used in source citations: ASCII hyphen, en-dash, em-dash.
_RANGE_SEP = r"[-–—]"

# Curly-quote superscript markers some publishers use to mark a page within
# a page ("p. 36'", "p. 132''"), including the space-before variant.
_PRIME = r"['’‘]"

# Optional curly-quote primes with optional whitespace between digits and
# prime — covers both "36'" and "127 ‘".
_OPTIONAL_PRIMES = rf"(?:\s*{_PRIME})*"

# A single page number with optional curly-quote primes and surrounding
# whitespace — the most common shape.
_SINGLE = rf"\s*{_DIGIT}+{_OPTIONAL_PRIMES}\s*"

# A run of page numbers joined by range separators, e.g. "826-827" or
# "154-155-156". Each segment is a digit run, optionally with primes.
_RANGE = rf"\s*{_DIGIT}+{_OPTIONAL_PRIMES}(?:\s*{_RANGE_SEP}\s*{_DIGIT}+{_OPTIONAL_PRIMES})*\s*"

# Spanish "y siguientes" continuation marker, e.g. "151 y ss", and the
# 3-segment variant "13-14 y 15" used by some Putnam citations. The prefix
# part is itself a small range, so we allow either a bare digit run or a
# range-style continuation.
_RANGE_SPANISH = rf"(?:{_DIGIT}+|{_DIGIT}+\s*{_RANGE_SEP}\s*{_DIGIT}+)\s+y\s+(?:ss|{_DIGIT}+)"

# Roman-numeral chapter / part markers such as "II, 3".
_ROMAN_PREFIX = r"[IVXLCDM]+,\s+\d+"

# Multi-page citations separated by commas, e.g. "105, 107, 109".
_COMMA_LIST = rf"{_DIGIT}+\s*(?:,\s*{_DIGIT}+\s*)+"

# Bare parenthesised sub-page markers, e.g. "48(2)" / "54 (2)" / "149 (2)".
_SUBPAGE = rf"{_DIGIT}+\s*\(\s*{_DIGIT}+\s*\)"

# --- Assembled allow-list ----------------------------------------------

# The trailing `(?:{_RANGE_SPANISH}(?:\s+del\s+cap[íi]tulo\s+[^\n]+)?)`
# arm keeps the rare free-text page values such as
# "5 y ss del capítulo Cerebros en una cubeta" admissible.
_ALLOWED_SHAPES = (
    rf"(?:{_SINGLE})",
    rf"(?:{_RANGE})",
    rf"(?:{_RANGE_SPANISH}(?:\s+del\s+cap[íi]tulo\s+[^\n]+)?)",
    rf"(?:{_ROMAN_PREFIX})",
    rf"(?:{_COMMA_LIST})",
    rf"(?:{_SUBPAGE})",
)
PAGE_REGEX = re.compile(rf"^(?:{"|".join(_ALLOWED_SHAPES)})$", re.UNICODE)


def is_allowed_page(value: str) -> bool:
    """Return True when ``value`` matches one of the accepted page shapes."""
    return PAGE_REGEX.match(value) is not None


__all__ = ["PAGE_REGEX", "is_allowed_page"]
