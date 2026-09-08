# TODO: is this file out of place
"""Exercise verify_cards._is_allowed_page against positive and negative cases."""
import sys

sys.path.insert(0, 'backend')
from verify_cards import _is_allowed_page

POSITIVE = [
    # Plain numbers
    "29", "180", "1006",
    # Ranges
    "32-33", "826-827", "154-155-156",
    # Hyphen, en-dash, em-dash separators
    "32-33", "32\u2013 33", "32 \u2014 33",
    # Curly-quote primes
    "36\u2019", "132\u2019\u2019", "127 \u2018",
    # Spanish y siguientes
    "151 y ss", "744 y ss", "5 y ss del cap\u00edtulo Cerebros en una cubeta",
    "13-14 y 15",
    # Roman numeral + page
    "II, 3",
    # Comma list
    "105, 107, 109",
    # Sub-page markers
    "48(2)", "54 (2)", "149 (2)", "195 (2)",
    # Surrounding whitespace
    " 29 ", "\t180\t",
]

NEGATIVE = [
    # Missing/empty
    "", None,
    # Stray leading hyphen
    "-826-827", "-876", "-891",
    # Stray leading paren (unbalanced)
    "(156-157", "(180",
    # Trailing junk (note: whitespace is stripped by verify() before the
    # regex sees the value, so "826-827 " is canonicalised to "826-827")
    "29abc",
    # Bad characters
    "29a", "29.", "29/", "29#",
    # Multiple leading dashes
    "--826",
    # Wrong structure
    "II,III", "ss y 151", "151 ss y", "del cap\u00edtulo X",
]

passed = 0
failed = 0
print("== positive ==")
for p in POSITIVE:
    ok = _is_allowed_page(p)
    flag = "OK " if ok else "FAIL"
    print(f"  [{flag}] {p!r}")
    if ok: passed += 1
    else: failed += 1

print("== negative ==")
for n in NEGATIVE:
    # _is_allowed_page expects a string; verify() handles None upstream.
    if n is None:
        bad = True
    else:
        bad = not _is_allowed_page(n)
    flag = "OK " if bad else "FAIL"
    print(f"  [{flag}] {n!r}")
    if bad: passed += 1
    else: failed += 1

print(f"\nSummary: {passed} passed, {failed} failed")
sys.exit(0 if failed == 0 else 1)
