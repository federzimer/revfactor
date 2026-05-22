#!/usr/bin/env python3
"""Update RevFactor portfolio stats across the repo in one command.

Single source of truth: src/data/portfolio-stats.ts

This script:
  1. Reads NEW values from CLI args
  2. Writes them into src/data/portfolio-stats.ts (so React/Astro
     components that import STAT_LABELS pick them up automatically)
  3. Sed-replaces all known number patterns across MDX/Astro prose
     (which can't import the TS file because they're rendered as static
     markdown)
  4. Prints a diff summary + the canonical "still appearing" check
     so you can eyeball anything the regex missed

Usage:
    python3 scripts/update_portfolio_stats.py \\
        --properties 220 \\
        --markets 72 \\
        --states 26 \\
        --lift 26

All flags optional; any omitted value stays at its current TS file value.
Idempotent — running it twice with the same numbers is a no-op.

Re-run anytime portfolio stats grow. The TS file remains the source of
truth — if you only change the React side, no MDX text gets updated; if
you only change MDX text, the TS file falls out of sync. This script
keeps both aligned with one invocation.
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS_FILE = ROOT / "src" / "data" / "portfolio-stats.ts"


def read_current_ts() -> dict[str, int]:
    """Parse current numeric values from portfolio-stats.ts."""
    text = TS_FILE.read_text()
    out = {}
    for key in ("properties", "states", "markets", "revparLiftPct"):
        m = re.search(rf"{key}:\s*(\d+)", text)
        if not m:
            raise RuntimeError(f"could not read {key} from {TS_FILE}")
        out[key] = int(m.group(1))
    return out


def write_ts(properties: int, states: int, markets: int, revpar_lift: int) -> None:
    text = TS_FILE.read_text()
    text = re.sub(r"properties:\s*\d+", f"properties: {properties}", text)
    text = re.sub(r"states:\s*\d+", f"states: {states}", text)
    text = re.sub(r"markets:\s*\d+", f"markets: {markets}", text)
    text = re.sub(r"revparLiftPct:\s*\d+", f"revparLiftPct: {revpar_lift}", text)
    text = re.sub(r"propertiesShort:\s*'\d+\+?'", f"propertiesShort: '{properties}'", text)
    text = re.sub(r"propertiesLong:\s*'\d+\+? listings'", f"propertiesLong: '{properties} listings'", text)
    text = re.sub(r"propertiesPhrase:\s*'\d+\+? short-term rentals'", f"propertiesPhrase: '{properties} short-term rentals'", text)
    text = re.sub(r"marketsShort:\s*'\d+'", f"marketsShort: '{markets}'", text)
    text = re.sub(r"marketsLong:\s*'\d+ markets'", f"marketsLong: '{markets} markets'", text)
    text = re.sub(r"marketsHero:\s*'\d+ US-WIDE'", f"marketsHero: '{markets} US-WIDE'", text)
    text = re.sub(r"statesShort:\s*'\d+'", f"statesShort: '{states}'", text)
    text = re.sub(r"statesLong:\s*'\d+ U\.S\. states'", f"statesLong: '{states} U.S. states'", text)
    text = re.sub(r"revparLift:\s*'\+\d+%'", f"revparLift: '+{revpar_lift}%'", text)
    text = re.sub(r"revparLiftPhrase:\s*'\+\d+% RevPAR lift vs\. comp set'", f"revparLiftPhrase: '+{revpar_lift}% RevPAR lift vs. comp set'", text)
    TS_FILE.write_text(text)


def sweep_prose(old: dict[str, int], new: dict[str, int]) -> dict[str, int]:
    """Rewrite known stat patterns in MDX/Astro prose.

    Returns counts per pattern for the diff summary.
    """
    targets = [
        ROOT / "src" / "content" / "blog",
        ROOT / "src" / "pages",
        ROOT / "src" / "components",
    ]
    files: list[Path] = []
    for t in targets:
        files.extend(t.rglob("*.mdx"))
        files.extend(t.rglob("*.astro"))
        files.extend(t.rglob("*.jsx"))
        files.extend(t.rglob("*.tsx"))

    # Don't rewrite the SSOT file itself
    files = [f for f in files if f != TS_FILE]

    # Specific patterns we know are portfolio-stat references.
    # Each tuple: (old regex, new replacement, label)
    patterns = []

    # Properties — "165 short-term rentals" / "165 listings" / "165+" / etc.
    if new["properties"] != old["properties"]:
        op, np_ = old["properties"], new["properties"]
        patterns += [
            (rf"\b{op}\+? short-term rentals\b",       f"{np_} short-term rentals",       "properties (phrase)"),
            (rf"\b{op}\+? listings\b",                 f"{np_} listings",                 "properties (listings)"),
            (rf"\b{op}\+? properties\b",               f"{np_} properties",               "properties (properties)"),
            (rf"\b{op}\+? STR listings\b",             f"{np_} STR listings",             "properties (STR listings)"),
            (rf"\b{op}\+? STRs\b",                     f"{np_} STRs",                     "properties (STRs)"),
            (rf"\b{op}\+? active short-term rentals", f"{np_} active short-term rentals",  "properties (active STRs)"),
            (rf"across the {op}\+? listings",          f"across the {np_} listings",      "properties (across the X listings)"),
        ]

    # Markets — "56 markets" / "56 US markets" / "56-market"
    if new["markets"] != old["markets"]:
        om, nm = old["markets"], new["markets"]
        patterns += [
            (rf"\b{om} markets\b",         f"{nm} markets",         "markets (X markets)"),
            (rf"\b{om} US markets\b",      f"{nm} US markets",      "markets (US markets)"),
            (rf"\b{om} U\.S\. markets\b",  f"{nm} U.S. markets",    "markets (U.S. markets)"),
            (rf"\b{om}-market\b",          f"{nm}-market",          "markets (hyphenated)"),
            (rf"\b{om} active markets\b",  f"{nm} active markets",  "markets (active)"),
            (rf"\b{om} market locations\b",f"{nm} market locations","markets (locations)"),
            (rf"\b{om} US-WIDE\b",         f"{nm} US-WIDE",         "markets (US-WIDE)"),
        ]

    # States
    if new["states"] != old["states"]:
        os_, ns = old["states"], new["states"]
        patterns += [
            (rf"\b{os_} U\.S\. states\b",       f"{ns} U.S. states",       "states (U.S.)"),
            (rf"\b{os_} states\b",              f"{ns} states",            "states (X states)"),
            (rf"\b{os_} active states\b",       f"{ns} active states",     "states (active)"),
        ]

    # RevPAR lift
    if new["revparLiftPct"] != old["revparLiftPct"]:
        ol, nl = old["revparLiftPct"], new["revparLiftPct"]
        patterns += [
            (rf"\+{ol}% lift\b",                       f"+{nl}% lift",                       "lift (+X%)"),
            (rf"\+{ol}% RevPAR\b",                     f"+{nl}% RevPAR",                     "lift (+X% RevPAR)"),
            (rf"{ol}% lift comes\b",                   f"{nl}% lift comes",                  "lift (X% lift comes)"),
            (rf"leave {ol}% on the table\b",           f"leave {nl}% on the table",          "lift (leave X% on the table)"),
            (rf"leaves {ol}% on the table\b",          f"leaves {nl}% on the table",         "lift (leaves X% on the table)"),
            (rf"leaving {ol}% on the table\b",         f"leaving {nl}% on the table",        "lift (leaving X% on the table)"),
            (rf"the {ol}% an algorithm\b",             f"the {nl}% an algorithm",            "lift (the X% an algorithm)"),
            (rf"the {ol}% your algorithm\b",           f"the {nl}% your algorithm",          "lift (the X% your algorithm)"),
            (rf"recovers the {ol}%",                   f"recovers the {nl}%",                "lift (recovers the X%)"),
            (rf"pull back the {ol}%",                  f"pull back the {nl}%",               "lift (pull back the X%)"),
            (rf"They leave {ol}% on the table",        f"They leave {nl}% on the table",     "lift (they leave)"),
            (rf"\+{ol}% RevPAR lift vs\. comp set",    f"+{nl}% RevPAR lift vs. comp set",   "lift (vs comp set)"),
            (rf"documented \+{ol}% RevPAR",            f"documented +{nl}% RevPAR",          "lift (documented)"),
        ]

    counts: dict[str, int] = {}
    for f in files:
        text = f.read_text()
        new_text = text
        for pat, repl, label in patterns:
            new_text, n = re.subn(pat, repl, new_text)
            if n:
                counts[label] = counts.get(label, 0) + n
        if new_text != text:
            f.write_text(new_text)
    return counts


def main() -> int:
    p = argparse.ArgumentParser(description="Update RevFactor portfolio stats site-wide.")
    p.add_argument("--properties", type=int, help="new property count (e.g. 220)")
    p.add_argument("--markets", type=int, help="new market count (e.g. 72)")
    p.add_argument("--states", type=int, help="new state count (e.g. 26)")
    p.add_argument("--lift", type=int, help="new RevPAR lift percent (e.g. 26)")
    p.add_argument("--dry-run", action="store_true", help="show what would change, don't write")
    args = p.parse_args()

    old = read_current_ts()
    new = dict(old)
    if args.properties is not None: new["properties"] = args.properties
    if args.markets is not None:    new["markets"] = args.markets
    if args.states is not None:     new["states"] = args.states
    if args.lift is not None:       new["revparLiftPct"] = args.lift

    if new == old:
        print("Nothing to update — all values match current SSOT.")
        for k, v in old.items():
            print(f"  {k}: {v}")
        return 0

    print("Updating portfolio stats:")
    for k in new:
        if old[k] != new[k]:
            print(f"  {k}: {old[k]} → {new[k]}")
    print()

    if args.dry_run:
        print("(dry-run, no files written)")
        return 0

    write_ts(new["properties"], new["states"], new["markets"], new["revparLiftPct"])
    print(f"✓ wrote {TS_FILE.relative_to(ROOT)}")

    counts = sweep_prose(old, new)
    if counts:
        print("\n✓ prose rewrites (MDX/Astro/JSX):")
        for label, n in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"  {n:3d}× {label}")
    else:
        print("\n(no MDX/Astro prose changes — SSOT was already aligned)")

    print("\nNext steps:")
    print("  1. Inspect: git diff src/")
    print("  2. Build:   npm run build")
    print("  3. Update Google Ads RSAs separately via scripts/google-ads/add_rsa_variants.py")
    print("     (Google Ads is OUT-of-band from this repo — the API call is a separate concern.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
