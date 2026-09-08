"""Tests for the ``verify_cards`` command-line interface.

These cover ``main()`` end-to-end: exit codes, the ``--quiet`` flag, the
``--cards-json`` argument, and the error path when the input file is missing.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def test_main_returns_zero_on_clean_dataset(tmp_path: Path) -> None:
    """The shipped cards.json + card-tags.json + images directory is clean."""
    repo_root = Path(__file__).resolve().parents[2]
    rc = subprocess.run(
        [sys.executable, "verify_cards.py"],
        capture_output=True, text=True,
        cwd=repo_root / "backend",
    ).returncode
    assert rc == 0, f"expected 0, got {rc}; stderr={rc!r}"


def test_main_returns_nonzero_when_cards_json_missing(tmp_path: Path) -> None:
    script = Path(__file__).resolve().parents[1] / "verify_cards.py"
    rc = subprocess.run(
        [sys.executable, str(script), "--cards-json", str(tmp_path / "nope.json")],
        capture_output=True, text=True,
    ).returncode
    assert rc == 1


def test_main_returns_nonzero_on_violation(tmp_path: Path) -> None:
    cards_path = tmp_path / "cards.json"
    cards_path.write_text(
        json.dumps({
            "books": [{
                "title": "T", "author": "A", "book": "B", "year": "2000",
                "cards": [{
                    "id": "a-1", "title": "T", "author": "A", "book": "B",
                    "year": "2000", "page": "", "raw_marker": "A (2000:).",
                    "content": "x", "source_path": "p", "source_format": "odt",
                    "tags": [], "images": [],
                }],
            }],
        }),
        encoding="utf-8",
    )
    rc = subprocess.run(
        [sys.executable, "verify_cards.py", "--cards-json", str(cards_path)],
        capture_output=True, text=True,
    ).returncode
    assert rc == 1


def test_main_quiet_suppresses_per_card_diagnostics(tmp_path: Path) -> None:
    cards_path = tmp_path / "cards.json"
    cards_path.write_text(
        json.dumps({
            "books": [{
                "title": "T", "author": "A", "book": "B", "year": "2000",
                "cards": [{
                    "id": "a-1", "title": "T", "author": "A", "book": "B",
                    "year": "2000", "page": "", "raw_marker": "A (2000:).",
                    "content": "x", "source_path": "p", "source_format": "odt",
                    "tags": [], "images": [],
                }],
            }],
        }),
        encoding="utf-8",
    )
    proc = subprocess.run(
        [sys.executable, "verify_cards.py", "--cards-json", str(cards_path), "--quiet"],
        capture_output=True, text=True,
    )
    assert proc.returncode == 1
    # Quiet means no per-card diagnostic lines like "  - missing or empty..."
    assert "missing or empty" not in proc.stderr
    # ...but the summary line still appears.
    assert "FAILED" in proc.stderr


def test_main_verbose_shows_per_card_diagnostics(tmp_path: Path) -> None:
    cards_path = tmp_path / "cards.json"
    cards_path.write_text(
        json.dumps({
            "books": [{
                "title": "T", "author": "A", "book": "B", "year": "2000",
                "cards": [{
                    "id": "a-1", "title": "T", "author": "A", "book": "B",
                    "year": "2000", "page": "", "raw_marker": "A (2000:).",
                    "content": "x", "source_path": "p", "source_format": "odt",
                    "tags": [], "images": [],
                }],
            }],
        }),
        encoding="utf-8",
    )
    proc = subprocess.run(
        [sys.executable, "verify_cards.py", "--cards-json", str(cards_path)],
        capture_output=True, text=True,
    )
    assert proc.returncode == 1
    assert "missing or empty" in proc.stderr


def test_main_success_summary_format() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    proc = subprocess.run(
        [sys.executable, "verify_cards.py"],
        capture_output=True, text=True,
        cwd=repo_root / "backend",
    )
    assert proc.returncode == 0
    assert "OK" in proc.stdout
    assert "cards" in proc.stdout


def test_main_reports_missing_file_to_stderr(tmp_path: Path) -> None:
    script = Path(__file__).resolve().parents[1] / "verify_cards.py"
    proc = subprocess.run(
        [sys.executable, str(script), "--cards-json", str(tmp_path / "nope.json")],
        capture_output=True, text=True,
    )
    assert "not found" in proc.stderr.lower() or "no such file" in proc.stderr.lower()
