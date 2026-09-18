"""Extract footnote sections from card content.

Footnotes are detected as a contiguous block of numbered lines (e.g.
"1. ...", "2. ...") near the end of a card's content.  The block is
stripped from the card and returned as a {num: text} dict.

Only contiguous blocks of ≥2 footnote lines are considered — single
numbered lines are treated as regular content (e.g. numbered lists).
"""

from __future__ import annotations

import re

# Matches footnote lines like "1. Text..." or "23) Text..."
_FOOTNOTE_LINE_RE = re.compile(r"^(\d+)[\.\)]\s+(.+)")


def extract_footnotes(content: str) -> tuple[dict[str, str], str]:
    """Detect and extract a footnote block from *content*.

    Returns:
        (footnotes, cleaned_content) where *footnotes* is ``{num: text}``
        (keys are strings for JSON compatibility) and *cleaned_content* is
        the original content with the footnote block removed.
    """
    lines = content.split("\n")
    matches: list[tuple[int, int, str]] = []  # (line_idx, fn_num, text)

    for i, line in enumerate(lines):
        m = _FOOTNOTE_LINE_RE.match(line.strip())
        if m:
            matches.append((i, int(m.group(1)), m.group(2).strip()))

    if not matches:
        return {}, content

    # Find the longest contiguous run (allowing ≤2 line gaps for blank lines).
    runs: list[list[tuple[int, int, str]]] = []
    current = [matches[0]]

    for j in range(1, len(matches)):
        if matches[j][0] - current[-1][0] <= 3:
            current.append(matches[j])
        else:
            runs.append(current)
            current = [matches[j]]
    runs.append(current)

    best = max(runs, key=len)
    if len(best) < 2:
        return {}, content

    # Build the footnote dict (str keys for JSON).
    footnotes = {str(num): text for _, num, text in best}

    # Compute character offsets to strip the block.
    first_idx = best[0][0]
    last_idx = best[-1][0]
    char_start = sum(len(lines[i]) + 1 for i in range(first_idx))
    char_end = sum(len(lines[i]) + 1 for i in range(last_idx + 1))

    cleaned = (content[:char_start] + content[char_end:]).strip()
    return footnotes, cleaned
