#!/usr/bin/env python3
# coding: utf-8

"""Detect and strip the repeated bibliographic "divider" (page header / citation)
from a source's cards.

Detection (report-only, always safe) infers whether a leading or trailing
divider exists, its coverage, and a normalized signature. Stripping removes it:

- **leading** divider: drop leading line(s) matching the detected signature;
- **trailing** divider: truncate at the last line matching the signature;
- **preamble** (first card only): drop leading lines matching the source
  metadata, even when no divider is detected (the Warnock case).

Fingerprint is repetition-first: the *dominant* boundary line per side must
cover a high fraction of cards and fuzzy-match the source's own metadata.
"""

from __future__ import annotations

import argparse
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from card_models import Card
from source_documents import SourceDocumentConfig

MIN_COVERAGE = 0.5


def normalize_text(text: str) -> str:
    """Lowercase, strip diacritics, collapse non-alphanumerics to single spaces."""
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def metadata_keys(config: SourceDocumentConfig) -> list[str]:
    keys: list[str] = []
    for value in (config.title, config.author, config.book):
        if not value:
            continue
        norm = normalize_text(value)
        if len(norm) >= 3:
            keys.append(norm)
    return keys


def matches_metadata(line_norm: str, keys: list[str]) -> bool:
    for key in keys:
        if key in line_norm:
            return True
        key_tokens = key.split()
        if len(key_tokens) < 3:
            continue
        line_tokens = set(line_norm.split())
        overlap = sum(1 for token in key_tokens if token in line_tokens)
        if overlap / len(key_tokens) >= 0.66:
            return True
    return False


def boundary_lines(content: str) -> tuple[str | None, str | None]:
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    if not lines:
        return None, None
    return lines[0], lines[-1]


@dataclass
class DividerDetection:
    position: str  # "leading" | "trailing" | "both" | "none"
    leading_coverage: float
    trailing_coverage: float
    leading_sample: str | None = None
    trailing_sample: str | None = None
    leading_key: str | None = None
    trailing_key: str | None = None


def _dominant_line(
    counter: Counter, raw_by_norm: dict[str, str], total: int
) -> tuple[str | None, str | None, float]:
    if not counter:
        return None, None, 0.0
    norm, count = counter.most_common(1)[0]
    return raw_by_norm.get(norm), norm, count / total


def detect_divider(config: SourceDocumentConfig, contents: list[str]) -> DividerDetection:
    keys = metadata_keys(config)
    if not keys:
        return DividerDetection(position="none", leading_coverage=0.0, trailing_coverage=0.0)

    total = len(contents)
    first_counter: Counter = Counter()
    last_counter: Counter = Counter()
    first_raw: dict[str, str] = {}
    last_raw: dict[str, str] = {}

    for content in contents:
        first, last = boundary_lines(content)
        if first:
            norm = normalize_text(first)
            first_counter[norm] += 1
            first_raw.setdefault(norm, first)
        if last:
            norm = normalize_text(last)
            last_counter[norm] += 1
            last_raw.setdefault(norm, last)

    top_first, first_key, first_cov = _dominant_line(first_counter, first_raw, total)
    top_last, last_key, last_cov = _dominant_line(last_counter, last_raw, total)

    lead_ok = bool(top_first) and first_cov >= MIN_COVERAGE and matches_metadata(first_key or "", keys)
    trail_ok = bool(top_last) and last_cov >= MIN_COVERAGE and matches_metadata(last_key or "", keys)

    if lead_ok and trail_ok:
        position = "both"
    elif lead_ok:
        position = "leading"
    elif trail_ok:
        position = "trailing"
    else:
        position = "none"

    return DividerDetection(
        position=position,
        leading_coverage=first_cov,
        trailing_coverage=last_cov,
        leading_sample=top_first if lead_ok else None,
        trailing_sample=top_last if trail_ok else None,
        leading_key=first_key if lead_ok else None,
        trailing_key=last_key if trail_ok else None,
    )


def _matches_key(line: str, key: str | None) -> bool:
    """True if a boundary line is the divider key, tolerant of extra text.

    A divider variant may carry more text than the detected key (e.g. a longer
    citation). Match by containment, not whole-line similarity, so one key
    covers all its forms.
    """
    if not line.strip() or not key:
        return False
    norm = normalize_text(line)
    if key in norm:
        return True
    key_tokens = key.split()
    if not key_tokens:
        return False
    line_tokens = set(norm.split())
    overlap = sum(1 for token in key_tokens if token in line_tokens)
    return overlap / len(key_tokens) >= 0.7


def strip_divider(
    config: SourceDocumentConfig, contents: list[str]
) -> tuple[list[str], DividerDetection]:
    detection = detect_divider(config, contents)
    keys = metadata_keys(config)
    stripped: list[str] = []

    for idx, content in enumerate(contents):
        lines = content.splitlines()

        # Preamble (first card) + detected leading divider: drop leading noise.
        if idx == 0 or detection.position in ("leading", "both"):
            while lines and not lines[0].strip():
                lines.pop(0)
            if lines:
                head_norm = normalize_text(lines[0])
                is_preamble_meta = idx == 0 and matches_metadata(head_norm, keys)
                is_leading = _matches_key(lines[0], detection.leading_key)
                if is_leading or is_preamble_meta:
                    lines.pop(0)
                    while lines and not lines[0].strip():
                        lines.pop(0)

        # Detected trailing divider: truncate at the last matching line.
        if detection.position in ("trailing", "both"):
            cut = None
            for i in range(len(lines) - 1, -1, -1):
                if _matches_key(lines[i], detection.trailing_key):
                    cut = i
                    break
            if cut is not None:
                lines = lines[:cut]

        stripped.append("\n".join(lines).strip())

    return stripped, detection


@dataclass
class SplitAnomaly:
    source_path: str
    card_id: str
    page: str | None
    marker: str


def detect_split_anomalies(config: SourceDocumentConfig, cards: list[Card]) -> list[SplitAnomaly]:
    """Flag cards whose content still contains an unconsumed page marker.

    A correctly-split card should have no remaining match of the source's split
    pattern in its content — all markers were consumed as boundaries. A match in
    content means a page marker was missed (two pages fused into one card).
    """
    pattern = re.compile(config.split_pattern, re.IGNORECASE | re.MULTILINE)
    anomalies: list[SplitAnomaly] = []
    for card in cards:
        if not card.content:
            continue
        match = pattern.search(card.content)
        if match:
            anomalies.append(
                SplitAnomaly(
                    source_path=card.source_path,
                    card_id=card.id,
                    page=card.page,
                    marker=match.group(0).strip(),
                )
            )
    return anomalies


def print_split_anomalies(anomalies: list[SplitAnomaly]) -> None:
    if not anomalies:
        return
    print("\nPossible missed page markers (unconsumed marker found in body):")
    for anomaly in anomalies:
        print(
            f"- {anomaly.source_path} "
            f"card={anomaly.card_id} "
            f"page={anomaly.page or '?'} "
            f"marker={anomaly.marker!r}"
        )


def report_line(config: SourceDocumentConfig, detection: DividerDetection) -> str:
    sample = detection.leading_sample if detection.position in ("leading", "both") else detection.trailing_sample
    if detection.position == "both" and detection.trailing_sample:
        sample = detection.trailing_sample

    preview = re.sub(r"\s+", " ", sample or "").strip()
    if len(preview) > 70:
        preview = preview[:67] + "..."

    return (
        f"{config.filename:<52} "
        f"pos={detection.position:<8} "
        f"lead={detection.leading_coverage:.0%} "
        f"trail={detection.trailing_coverage:.0%} "
        f"sample={preview!r}"
    )


def _extract(configs, source_dir: str):
    # Imported lazily to keep the module importable without the heavy deps.
    from generate_cards_json import (
        convert_odt_to_docx_bytes,
        extract_raw_text_from_docx_bytes,
        split_text_into_cards,
    )
    from source_documents import find_source_configs

    for config, path in find_source_configs(Path(source_dir)):
        try:
            text = extract_raw_text_from_docx_bytes(convert_odt_to_docx_bytes(path))
        except Exception as exc:  # pragma: no cover
            print(f"{config.filename:<52} ERROR {exc}")
            continue
        sections = split_text_into_cards(text, config)
        yield config, [section.content or "" for section in sections]


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect and strip card dividers.")
    parser.add_argument("--source-dir", default="ODT", help="Directory of source ODT/DOCX files.")
    parser.add_argument("--apply", action="store_true", help="Apply stripping (default is report-only).")
    args = parser.parse_args()

    for config, contents in _extract(None, args.source_dir):
        detection = detect_divider(config, contents)
        print(report_line(config, detection))

        if args.apply:
            stripped, _ = strip_divider(config, contents)
            changed = sum(1 for a, b in zip(contents, stripped) if a.strip() != b.strip())
            print(f"  -> stripped {changed}/{len(contents)} cards")
            for before, after in zip(contents, stripped):
                if before.strip() != after.strip():
                    print(f"     before: {before.strip()[:70]!r}")
                    print(f"     after : {after.strip()[:70]!r}")
                    break


if __name__ == "__main__":
    main()
