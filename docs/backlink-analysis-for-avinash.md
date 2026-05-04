# RevFactor Backlinks — First-Month Quality Read

**For:** Avinash Tripathi (GetCito)
**From:** Aaron
**Date:** 2026-05-04
**Sample:** 6 URLs delivered week of 2026-04-27 → 2026-05-02

## What I built

I set up a SQLite tracker for every backlink your team delivers so we have a shared, objective view of how each one performs over time:

- **Monthly automated check** on every URL (1st of each month)
- Scores each link 0–100 on four signals:
  - Alive (HTTP 2xx/3xx, or anti-bot 4xx on platforms like Reddit/Medium): **+30**
  - "RevFactor" mentioned in the static HTML: **+25**
  - Outbound link to revfactor.io present: **+25**
  - That link is dofollow (no `nofollow` / `sponsored` / `ugc`): **+20**
- Grades: A 80+, B 60–79, C 40–59, D 1–39, F 0
- History dots show grade drift month-over-month so we catch a link going dead or losing the mention

I'll re-run on the 1st of each month and share the diff.

## First-month scorecard

| Grade | Score | URL | Why |
|-------|-------|-----|-----|
| **A** | 100 | sites.google.com/view/airbnb-software-reviews/blogs/the-revfactor-edge | Alive · brand mention found · dofollow link to revfactor.io |
| **A** | 100 | str-revenue-tips.weebly.com/blog/the-revfactor-edge | Alive · brand mention found · dofollow link to revfactor.io |
| **D** | 30 | medium.com/@revfactormarketing/the-revfactor-edge | Medium 403s static crawlers — alive but mention unverifiable without JS render |
| **D** | 30 | reddit.com/r/STRRevenueTips/comments/1t1m16a/ | Reddit serves React-rendered HTML — static fetch returned no brand mention |
| **D** | 30 | strrevenuetips.quora.com/I-m-currently-pricing-my-Airbnb-manually | Quora 403s static crawlers — alive but mention unverifiable |
| **F** | 0 | facebook.com/share/p/18Dvydymsw | HTTP 400 on the share URL |

**Distribution:** A=2 · B=0 · C=0 · D=3 · F=1

## Honest read

The mix matches what we discussed on 2026-04-22 — controlled-property republishes acting as a Tier-2 layer for the Medium pillar. The Google Sites + Weebly entries land cleanly (real outbound dofollow link, brand mention indexable). That's the floor working as designed.

The concern is the other four. Medium, Reddit, Quora, and Facebook all block static crawlers (4xx anti-bot or JS-rendered DOM). They're alive for a human visitor, but:

1. Most search and AI crawlers (including the new generation — Perplexity, ChatGPT search, Gemini) don't execute JavaScript on every page they hit. So those four mentions are invisible to a meaningful share of crawlers.
2. Google's SpamBrain has been auto-discounting controlled-property republish wheels for years (see [feedback_low_quality_backlinks.md](../../.claude/projects/...)). We're not at risk of a manual action, but the link equity to revfactor.io from this batch is essentially what the two A-grade links provide.

This is not a Cito problem — it's the nature of the platforms. But it does mean **6 placements ≠ 6 links of equal value to Google/AI**.

## Suggested adjustment for next batch

Keep the controlled-property layer as a baseline (it doesn't hurt and Weebly/Sites are clearly working), but I'd like to start layering in editorial placements that DO move DR. Specifically:

- STR / hospitality trade outlets: **Hotel Tech Report, Rental Scale-Up, BiggerPockets, Skift Pro, ShortTermRentalz**
- PMS / pricing tool partner blogs: **Hospitable, Hostfully, Guesty, PriceLabs blog, Beyond Pricing blog**
- Niche newsletter mentions: **No Vacancy podcast notes, STR Profit podcast notes, Get Paid for Your Pad**

Two questions for you:

1. **Does Cito offer outreach to editorial properties like the above** (HARO-style or relationship-based pitching), or is the current package controlled-property republishes only?
2. **What's your team's read on the Reddit / Quora deliverables specifically?** Do you have a lever to make those static-crawler-visible (e.g., crosspost to old.reddit.com mirrors, ensure mention appears in initial-render HTML), or are those primarily for direct human discovery?

I'd love to keep building on what's working and dial in the next batch with both of us seeing the same scorecard.

## How to read the live tracker

- Spreadsheet view: `python3 scripts/backlinks/export_csv.py --open` (opens in Numbers)
- HTML dashboard: `python3 scripts/backlinks/render_html.py --open`
- Add new URLs: pipe into `sync.py` from the master Google Sheet
- Cron: monthly check, 1st of month, 8:30am

Happy to share read access to the DB or a live link to the dashboard if useful.

— Aaron
