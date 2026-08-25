#!/usr/bin/env python3
# coding: utf-8

"""Report card-tag statistics for a `cards.json` dataset.

Purpose: quick, repeatable sanity-checks of the auto-tagger's output —
tag distribution, coverage, and per-source tag spread — so over/under-firing
by a tag or within a source is easy to spot.

Usage:
    python tag_stats.py                     # backend/cards.json
    python tag_stats.py --input path.json
    python tag_stats.py --input path.json --per-source
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


@dataclass
class TagStats:
    total: int
    no_tag: int
    tag_counts: Counter[str]
    per_source: dict[str, Counter[str]]


def load_dataset(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def compute_stats(data: dict) -> TagStats:
    total = 0
    no_tag = 0
    tag_counts: Counter[str] = Counter()
    per_source: dict[str, Counter[str]] = {}

    for book in data.get("books", []):
        key = f"{book.get('author') or '?'} — {book.get('title') or '?'}"
        ctr: Counter[str] = Counter()
        for card in book.get("cards", []):
            total += 1
            tags = card.get("tags") or []
            if not tags:
                no_tag += 1
            for tag in tags:
                tag_counts[tag] += 1
                ctr[tag] += 1
        per_source[key] = ctr

    return TagStats(total=total, no_tag=no_tag, tag_counts=tag_counts, per_source=per_source)


def print_stats(stats: TagStats, per_source: bool = False) -> None:
    tagged = stats.total - stats.no_tag
    print(f"cards={stats.total}  tagged={tagged} ({tagged/stats.total:.1%})  no_tag={stats.no_tag} ({stats.no_tag/stats.total:.1%})")
    print("tag distribution (across all cards):")
    for tag, n in stats.tag_counts.most_common():
        print(f"  {tag:<12} {n:>5}  ({n/stats.total:.1%} of cards)")

    if per_source:
        print("\nper-source tag spread (top 3 tags per source):")
        for source, ctr in sorted(stats.per_source.items()):
            top = "; ".join(f"{tag}={n}" for tag, n in ctr.most_common(3))
            print(f"  {source:<48} {top}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Report card-tag statistics.")
    parser.add_argument("--input", default="cards.json", help="Path to cards.json.")
    parser.add_argument("--per-source", action="store_true", help="Show per-source tag spread.")
    args = parser.parse_args()

    stats = compute_stats(load_dataset(args.input))
    print_stats(stats, per_source=args.per_source)


if __name__ == "__main__":
    main()
