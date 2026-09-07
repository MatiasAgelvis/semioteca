"""Pin tests for :mod:`page_shapes`.

These tests serve as living documentation for the page-shape allow-list.
The table at the top of the test mirrors the one in ``page_shapes.py``'s
docstring; if you change the shapes, update both.
"""

from __future__ import annotations

import pytest
from page_shapes import is_allowed_page


@pytest.mark.parametrize(
    "value",
    ["29", "36\u2019", "127 \u2018", "132\u2019\u2019"],
)
def test_single_page_shape(value: str) -> None:
    assert is_allowed_page(value), f"rejected: {value!r}"


@pytest.mark.parametrize(
    "value",
    ["32-33", "826-827", "154-155-156"],
)
def test_range_shape(value: str) -> None:
    assert is_allowed_page(value), f"rejected: {value!r}"


@pytest.mark.parametrize(
    "value",
    ["151 y ss", "744 y ss"],
)
def test_spanish_y_ss_shape(value: str) -> None:
    assert is_allowed_page(value), f"rejected: {value!r}"


def test_spanish_y_ss_with_chapter_shape() -> None:
    # Free-text trailing clause after "del capítulo X".
    value = "5 y ss del cap\u00edtulo Cerebros en una cubeta"
    assert is_allowed_page(value)


def test_three_segment_spanish_range_shape() -> None:
    # Range-prefix variant used by Putnam: "13-14 y 15".
    assert is_allowed_page("13-14 y 15")


def test_roman_prefix_shape() -> None:
    assert is_allowed_page("II, 3")


def test_comma_list_shape() -> None:
    assert is_allowed_page("105, 107, 109")


@pytest.mark.parametrize(
    "value",
    ["48(2)", "54 (2)", "149 (2)", "195 (2)"],
)
def test_subpage_shape(value: str) -> None:
    assert is_allowed_page(value), f"rejected: {value!r}"


@pytest.mark.parametrize(
    "value",
    [
        "-826-827", "-876", "-891",
        "(156-157", "(180",
        "29abc", "29.", "29/", "29#",
        "II,III", "ss y 151", "151 ss y",
    ],
)
def test_every_rejected_example_from_docstring(value: str) -> None:
    # These are the historical Honderich source-typo artifacts called
    # out in ``page_shapes.py`` — they must keep being rejected.
    assert not is_allowed_page(value), f"accepted: {value!r}"
