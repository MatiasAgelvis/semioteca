"""Boundary handling in ``split_text_into_cards``.

Markers are matched against tag-stripped text, then slice positions are
mapped back onto the HTML by ``plain_to_original``. A tag sitting exactly
at a slice boundary belongs to one side: closing tags close the left
slice, opening tags start the right one.

Leaking the next marker's opening tags used to append a stray
``<strong>`` to every card (1474 cards were affected) and kept
citation-only sections alive as junk cards whose entire content was
``<strong>``, because the blank-card filter saw non-empty text.
"""

from generate_cards_json import split_text_into_cards
from source_documents import PARENTHESIS_YEAR_PAGE_PATTERN, SourceDocumentConfig


def make_config() -> SourceDocumentConfig:
    return SourceDocumentConfig(
        filename="Test Source.odt",
        split_pattern=PARENTHESIS_YEAR_PAGE_PATTERN,
        title="Test",
        author="Author",
        book="Book",
        year="1990",
    )


def test_next_marker_opening_tag_does_not_leak():
    text = (
        "<strong>A, B. (1990:1).</strong> first card\n"
        "<strong>C, D. (1990:2).</strong> second card"
    )
    sections = split_text_into_cards(text, make_config())
    assert [section.content for section in sections] == ["first card", "second card"]


def test_citation_only_section_keeps_text_but_no_tags():
    text = (
        "A, B. (1990:1). Análisis y metafísica. Una introducción.\n"
        "<strong>C, D. (1990:2).</strong> real content"
    )
    sections = split_text_into_cards(text, make_config())
    # The split alone keeps the citation text (strip_divider removes it
    # later in the pipeline); what must not leak is the next marker's
    # formatting, which used to keep these sections alive as junk cards.
    assert sections[0].content == "Análisis y metafísica. Una introducción."
    assert sections[1].content == "real content"


def test_opening_tag_of_content_is_kept():
    text = "A, B. (1990:1).<em>quoted text</em> tail\nC, D. (1990:2). second"
    sections = split_text_into_cards(text, make_config())
    assert sections[0].content == "<em>quoted text</em> tail"
    assert sections[1].content == "second"


def test_closing_tags_stay_with_previous_card():
    text = (
        "A, B. (1990:1). some <em>emphasis</em>\n<strong>C, D. (1990:2).</strong> more"
    )
    sections = split_text_into_cards(text, make_config())
    assert sections[0].content == "some <em>emphasis</em>"
    assert sections[1].content == "more"


def test_marker_wrapped_in_nested_tags():
    text = (
        "<strong><em>A, B. (1990:1).</em></strong> first\n"
        "<strong><em>C, D. (1990:2).</em></strong> second"
    )
    sections = split_text_into_cards(text, make_config())
    assert [section.content for section in sections] == ["first", "second"]
