#!/usr/bin/env python3
"""
page_vs_serp.py — homegrown alternative to Page Optimizer Pro.

Compares a target page against SERP top-N competitors for a primary keyword.
Outputs an actionable on-page SEO report (markdown + JSON).

Usage:
  python page_vs_serp.py \
    --target https://revfactor.io/blog/foo/ \
    --keyword "short term rental revenue management" \
    --competitors competitors.txt \
    --out report.md

Designed to mirror what Page Optimizer Pro reports:
  - LSA term coverage (target vs SERP avg)
  - Word count comparison
  - Heading-structure analysis (H1/H2/H3)
  - Schema audit (Article/FAQPage/HowTo/etc. presence vs competitors)
  - Recommendations (rule-based — not LLM-driven)

Dependencies (stdlib + 2 packages):
  pip install requests beautifulsoup4
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

# Words we don't want polluting LSA — common English stopwords + filler.
STOPWORDS = set("""
a about above after again against all am an and any are as at be because been before
being below between both but by could did do does doing down during each few for from
further had has have having he her here hers him his how i if in into is it its itself
just may me might more most my myself nor not now of off on once only or other our ours
ourselves out over own same she should so some such than that the their them themselves
then there these they this those through to too under until up very was we were what
when where which while who whom why will with would you your yours yourself yourselves
also one two three first second third also like much many use using used use also
even still get gets got every another way ways thing things make makes made
""".split())

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
)

WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z\-']{2,}")


@dataclass
class PageData:
    url: str
    title: str = ""
    meta_description: str = ""
    h1: list[str] = field(default_factory=list)
    h2: list[str] = field(default_factory=list)
    h3: list[str] = field(default_factory=list)
    body_text: str = ""
    word_count: int = 0
    schema_types: list[str] = field(default_factory=list)
    word_freq: Counter = field(default_factory=Counter)
    error: str | None = None


def fetch(url: str, timeout: int = 25) -> str:
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout, allow_redirects=True)
    r.raise_for_status()
    return r.text


def extract_page(url: str, html: str) -> PageData:
    soup = BeautifulSoup(html, "html.parser")
    # Drop nav/footer/script/style/noscript so word counts are body-only
    for tag in soup(["script", "style", "nav", "footer", "noscript", "aside", "form", "button"]):
        tag.decompose()
    title = (soup.title.string or "").strip() if soup.title else ""
    meta_desc = ""
    md = soup.find("meta", attrs={"name": "description"})
    if md and md.get("content"):
        meta_desc = md["content"].strip()
    h1 = [h.get_text(strip=True) for h in soup.find_all("h1")]
    h2 = [h.get_text(strip=True) for h in soup.find_all("h2")]
    h3 = [h.get_text(strip=True) for h in soup.find_all("h3")]

    main = soup.find("main") or soup.find("article") or soup.body or soup
    body_text = main.get_text(" ", strip=True)
    body_lower = body_text.lower()
    words = WORD_RE.findall(body_lower)
    word_count = len(words)
    freq = Counter(w for w in words if w not in STOPWORDS and len(w) > 2)

    # Schema types — collect every JSON-LD @type from the original soup
    soup2 = BeautifulSoup(html, "html.parser")
    schema_types: list[str] = []
    for tag in soup2.find_all("script", attrs={"type": "application/ld+json"}):
        raw = tag.string or tag.get_text() or ""
        try:
            data = json.loads(raw)
        except Exception:
            continue
        for obj in _flatten_jsonld(data):
            t = obj.get("@type")
            if isinstance(t, list):
                schema_types.extend(t)
            elif isinstance(t, str):
                schema_types.append(t)

    return PageData(
        url=url,
        title=title,
        meta_description=meta_desc,
        h1=h1, h2=h2, h3=h3,
        body_text=body_text,
        word_count=word_count,
        schema_types=schema_types,
        word_freq=freq,
    )


def _flatten_jsonld(data: Any) -> list[dict]:
    """Walk every nested dict so we discover Person/Organization/etc. embedded inside
    Article.author, Article.publisher, Question.acceptedAnswer, BreadcrumbList items, etc."""
    out: list[dict] = []
    if isinstance(data, list):
        for d in data:
            out.extend(_flatten_jsonld(d))
    elif isinstance(data, dict):
        out.append(data)
        for k, v in data.items():
            if k.startswith("@"):  # skip @context, @id, @type strings
                continue
            if isinstance(v, (dict, list)):
                out.extend(_flatten_jsonld(v))
    return out


def analyze(target: PageData, competitors: list[PageData], keyword: str) -> dict:
    valid_comps = [c for c in competitors if not c.error and c.word_count > 100]
    if not valid_comps:
        return {"error": "no valid competitors fetched"}

    avg_wc = round(sum(c.word_count for c in valid_comps) / len(valid_comps))
    avg_h2 = round(sum(len(c.h2) for c in valid_comps) / len(valid_comps), 1)
    avg_h3 = round(sum(len(c.h3) for c in valid_comps) / len(valid_comps), 1)

    # LSA: top N most-frequent (non-stopword) terms across competitors,
    # weighted by document frequency (term must appear in ≥ 3 competitor pages)
    term_doc_freq: Counter = Counter()
    term_total_count: Counter = Counter()
    for c in valid_comps:
        for term in set(c.word_freq):
            term_doc_freq[term] += 1
        for term, n in c.word_freq.items():
            term_total_count[term] += n

    threshold = max(3, len(valid_comps) // 2)
    lsa_candidates = [t for t, df in term_doc_freq.items() if df >= threshold]
    # Rank by a TF-IDF-style score: avg per doc × log(doc_freq).
    # Pure frequency over-favors high-stopword-density terms that dropped through
    # the stopword filter; weighting by document spread (how many comps use it)
    # mimics POP's ranking better than raw avg-per-doc.
    import math
    kw_tokens = set(WORD_RE.findall(keyword.lower()))
    def lsa_score(t: str) -> float:
        avg = term_total_count[t] / term_doc_freq[t]
        spread = math.log1p(term_doc_freq[t])
        return avg * spread
    ranked = sorted(lsa_candidates, key=lsa_score, reverse=True)
    # Pull top 25, excluding terms that are just the head keyword tokens
    lsa_top = []
    for t in ranked:
        if t in kw_tokens:
            continue
        avg_per_doc = term_total_count[t] / term_doc_freq[t]
        target_count = target.word_freq.get(t, 0)
        ratio = (target_count / avg_per_doc) if avg_per_doc else 0
        lsa_top.append({
            "term": t,
            "avg_per_competitor": round(avg_per_doc, 1),
            "doc_freq": term_doc_freq[t],
            "target_count": target_count,
            "target_vs_avg_ratio": round(ratio, 2),
        })
        if len(lsa_top) >= 25:
            break

    # Schema gap analysis: which schema types appear in ≥30% of comps but not target.
    # Filter out site-wide / chrome schemas that aren't actionable on-page (POP also skips these).
    SITE_CHROME_SCHEMAS = {
        "organization", "website", "imageobject", "webpage", "sitenavigationelement",
        "wpheader", "wpfooter", "wpsidebar", "logo", "videoobject", "searchaction",
        "personrole", "listitem",  # "listitem" is breadcrumb noise
    }
    competitor_schemas: Counter = Counter()
    for c in valid_comps:
        for s in set(c.schema_types):
            competitor_schemas[s.lower()] += 1
    target_schemas = set(s.lower() for s in target.schema_types)
    schema_gaps = []
    for s, cnt in competitor_schemas.most_common():
        if s in SITE_CHROME_SCHEMAS:
            continue
        coverage_pct = round(cnt / len(valid_comps) * 100)
        if coverage_pct >= 30 and s not in target_schemas:
            schema_gaps.append({"type": s, "in_competitors_pct": coverage_pct})

    # Strengths = content-meaningful schemas we have that competitors don't
    competitor_set = set(s.lower() for s in competitor_schemas) | SITE_CHROME_SCHEMAS
    schema_strengths = sorted(s for s in target_schemas if s not in competitor_set and s not in SITE_CHROME_SCHEMAS)

    # Keyword density (target keyword phrase frequency)
    kw_lower = keyword.lower()
    target_kw_count = target.body_text.lower().count(kw_lower)
    kw_per_competitor = [c.body_text.lower().count(kw_lower) for c in valid_comps]
    avg_kw_count = round(sum(kw_per_competitor) / len(kw_per_competitor), 1)

    return {
        "target": {
            "url": target.url,
            "word_count": target.word_count,
            "h2_count": len(target.h2),
            "h3_count": len(target.h3),
            "schema_types": sorted(set(target.schema_types)),
            "keyword_count": target_kw_count,
        },
        "serp_avg": {
            "competitors_used": len(valid_comps),
            "competitor_urls": [c.url for c in valid_comps],
            "word_count": avg_wc,
            "h2_count": avg_h2,
            "h3_count": avg_h3,
            "keyword_count": avg_kw_count,
        },
        "lsa_top": lsa_top,
        "schema_gaps": schema_gaps,
        "schema_strengths": schema_strengths,
    }


def render_markdown(report: dict, keyword: str) -> str:
    t, s = report["target"], report["serp_avg"]
    lines = []
    lines.append(f"# SEO Comparison Report — `{keyword}`\n")
    lines.append(f"**Target:** {t['url']}\n")
    lines.append(f"**Competitors compared:** {s['competitors_used']}  ")
    lines.append("")
    lines.append("## Page metrics — target vs SERP avg\n")
    lines.append("| Metric | Target | SERP avg | Verdict |")
    lines.append("|---|--:|--:|---|")
    wc_v = "MORE depth" if t["word_count"] > s["word_count"] else "BELOW avg — consider expanding"
    lines.append(f"| Word count | **{t['word_count']:,}** | {s['word_count']:,} | {wc_v} |")
    h2_v = "OK" if abs(t["h2_count"] - s["h2_count"]) <= 4 else ("over" if t["h2_count"] > s["h2_count"] else "under")
    lines.append(f"| H2 count | {t['h2_count']} | {s['h2_count']} | {h2_v} |")
    h3_v = "OK" if abs(t["h3_count"] - s["h3_count"]) <= 6 else ("over" if t["h3_count"] > s["h3_count"] else "under")
    lines.append(f"| H3 count | {t['h3_count']} | {s['h3_count']} | {h3_v} |")
    kw_v = "fine" if t["keyword_count"] >= s["keyword_count"] * 0.5 else "low — work the phrase in more"
    lines.append(f"| Primary keyword count | {t['keyword_count']} | {s['keyword_count']} | {kw_v} |")
    lines.append("")

    lines.append("## Schema audit\n")
    if report["schema_gaps"]:
        lines.append("### Schema types competitors use that we don't")
        lines.append("| Type | % of competitors using |")
        lines.append("|---|--:|")
        for g in report["schema_gaps"]:
            lines.append(f"| {g['type']} | {g['in_competitors_pct']}% |")
    else:
        lines.append("No schema gaps detected — target page covers everything competitors use.\n")
    if report["schema_strengths"]:
        lines.append("\n### Schema types we have that competitors don't (E-E-A-T edge)")
        for s_ in report["schema_strengths"]:
            lines.append(f"- `{s_}`")
    lines.append("")

    lines.append("## LSA term coverage — target vs competitor average\n")
    lines.append("Terms used by ≥50% of SERP top-N. Ratio = target count ÷ competitor avg per page.\n")
    lines.append("| # | Term | Competitor avg | Target | Ratio | Read |")
    lines.append("|--:|---|--:|--:|--:|---|")
    for i, row in enumerate(report["lsa_top"], 1):
        ratio = row["target_vs_avg_ratio"]
        if ratio < 0.4:
            read = "**under-using** — weave in"
        elif ratio < 0.8:
            read = "below avg"
        elif ratio < 2.0:
            read = "in line"
        else:
            read = f"deep coverage ({ratio}×)"
        lines.append(f"| {i} | {row['term']} | {row['avg_per_competitor']} | {row['target_count']} | {ratio} | {read} |")
    lines.append("")

    # Recommendations
    lines.append("## Recommendations\n")
    recs = []
    underused = [r["term"] for r in report["lsa_top"] if r["target_vs_avg_ratio"] < 0.4]
    if underused:
        recs.append(f"**Weave these terms into body copy** (under-used vs SERP): {', '.join(underused[:8])}.")
    if report["schema_gaps"]:
        types = [g["type"] for g in report["schema_gaps"]]
        recs.append(f"**Schema additions to consider:** {', '.join(types)}.")
    if t["word_count"] < s["word_count"] * 0.9:
        recs.append(f"**Word count gap** — target is {t['word_count']:,} vs SERP avg {s['word_count']:,}. Consider expanding.")
    if t["keyword_count"] < s["keyword_count"] * 0.5:
        recs.append(f"**Primary keyword underused** — used {t['keyword_count']}× vs SERP avg {s['keyword_count']}×.")
    if not recs:
        recs.append("No structural changes recommended. Term coverage, schema, headings all match or exceed SERP avg.")
    for r in recs:
        lines.append(f"- {r}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--target", required=True, help="Target URL to audit")
    p.add_argument("--keyword", required=True, help="Primary keyword")
    p.add_argument("--competitors", required=True, help="Path to txt file with competitor URLs (one per line)")
    p.add_argument("--out", default="report.md", help="Output markdown path")
    p.add_argument("--json", default=None, help="Optional JSON output path")
    args = p.parse_args()

    competitor_urls = [l.strip() for l in Path(args.competitors).read_text().splitlines() if l.strip() and not l.startswith("#")]
    print(f"[fetch] target: {args.target}", file=sys.stderr)
    try:
        target = extract_page(args.target, fetch(args.target))
    except Exception as e:
        print(f"FATAL: target fetch failed: {e}", file=sys.stderr)
        return 1

    competitors: list[PageData] = []
    for url in competitor_urls:
        print(f"[fetch] {url}", file=sys.stderr)
        try:
            html = fetch(url)
            comp = extract_page(url, html)
            print(f"  wc={comp.word_count} schemas={comp.schema_types[:5]}", file=sys.stderr)
            competitors.append(comp)
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            competitors.append(PageData(url=url, error=str(e)))

    report = analyze(target, competitors, args.keyword)
    md = render_markdown(report, args.keyword)
    Path(args.out).write_text(md)
    print(f"[done] markdown → {args.out}", file=sys.stderr)
    if args.json:
        Path(args.json).write_text(json.dumps(report, indent=2))
        print(f"[done] json → {args.json}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
