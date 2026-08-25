# Review of the Sunday run proposal — 2026-08-26

Reviewing `docs/reports/pop-vs-homegrown-2026-08-24.md` and the rotation
proposal that went with it. **Every measurement in that document checks out.**
Re-verified against the repo, the 08-23 sweep report and the live site:

| Claim | Verdict |
|---|---|
| Sweep #1 comp-set at priority 406, then 326.5 / 249.0 / 238.5 / 238.0 | exact match |
| `/about/` CQF 0 | confirmed, and it is an artifact of scoring a non-article |
| Autopilot tracks 12, sweep scanned 16 | confirmed |
| 11 of 12 measured pages run 1.9x–12.8x SERP average words | confirmed |
| GSC: 8+ word queries 65% of impressions, position 6.2, zero clicks | confirmed |
| `page_vs_serp` coverage: 8 of 14 usable | confirmed |

Four things to settle before this goes into the Sunday run. One is a decision
only Aaron and Jlo can make; the other three are corrections.

---

## 1. The cooldown arithmetic does not close — needs a decision

3 pages/week with a 4-week cooldown needs a pool of **15** distinct eligible
pages to always be satisfiable: a page picked in week W is unavailable for
weeks W+1..W+4, so week 5 must find 3 pages outside the previous 12 picks.

The pool is smaller than that in both counts:

- the proposal's own figure: 17 sitemap URLs minus `/`, `/about/`, `/blog/` =
  **14 articles**
- the live site today: 14 sitemap URLs minus the same three = **11 articles**
  (two posts are 404 — see §2 — and the PriceLabs-vs-Wheelhouse post is not
  merged yet)

At 14 it breaks in week 5. At 11 it breaks in week 4. And it does not have to
be arithmetically impossible to stop working: once the cooldown binds, priority
stops deciding anything and the rotation is a fixed cycle wearing a ranking's
clothes — which is not what the cooldown was for. The stated purpose was to
stop `how-to-build-comp-set-str` winning every week forever, and both options
below do that.

**Two that close:**

| Option | Pool needed | Works at 11 | Works at 14 |
|---|--:|:--:|:--:|
| **2 pages/week, 4-week cooldown** | 10 | yes | yes |
| **3 pages/week, 2-week cooldown** | 9 | yes | yes |

3/week can come back later: the pool grows by 1 a week from the post cadence
while the rotation consumes 3, so it converges.

**Implementation is cheap either way.** `db.save_report` already stores
`{"chosen": [urls]}` per weekly run, so the cooldown reads the last N weekly
reports. No new state, no new table.

**One drift note.** "5 optimizations/week" is written in three places —
`clients.json`, `CONTENT_CADENCE_SOP.md` (twice) and §4 of
`AUTOPILOT_CONSTRAINTS.md`. All three change together, or the docs start
contradicting the cron.

## 2. Registry reconciliation — the drift is real, but not in the direction it looked

The proposal reads the 12 / 16 / 17 gap as "the autopilot is blind to 5 pages
the sweep sees". Today it is also the reverse: the autopilot is tracking **two
pages that no longer exist**, and the sitemap has **shrunk to 14, not grown to
17**. `/blog/is-a-pricing-tool-enough-.../` and `/blog/str-revenue-benchmarks-2026/`
both answer 404 on `www.revfactor.io`, because the domain is pointed at a stale
deployment. The current production deployment serves all 16 correctly.

That matters for the proposal directly. **Deriving both lists from the sitemap
would have hidden this outright.** Both pages left the sitemap in the same
instant they started 404ing, so a registry derived from the sitemap would have
agreed with a broken sitemap and said nothing — it converts the loud mismatch
that just caught this into silent agreement.

So: **report the drift, never reconcile it.** Keep the registry as an
independent expected set and fail when it disagrees with the live site.

Also worth keeping separate: these are two different KINDS of list. The
autopilot registry costs a SerpApi call per page per day and needs a keyword
per page — and `tracked-pages.json` says why a derived one is dangerous: *"it
tracks a page against a phrase nobody optimised for and reports the position as
fact, weekly, forever."* `/`, `/about/`, `/blog/` and `/blog/the-revfactor-method/`
are excluded there deliberately, which is the same call the proposal's §1 makes.
The weekly sweep, by contrast, already builds its list from the live sitemap at
run time — there is nothing to change on that side, and the 16-vs-17 gap is
just the sweep having run before the new post.

**Done, 2026-08-26** (`thrive-seo-autopilot@2ce5cf7`): `src/registry.py` probes
every registry URL before `register`. Dead (4xx) pages are dropped from the
audit shortlist and reported as failures; unreachable ones (timeout, DNS, 5xx)
are dropped from nothing and reported as notes. Registry-vs-sitemap drift is
printed and never applied, with the four deliberate exclusions recorded in
`untracked_by_design` so the note names only real drift. Verified against the
live site: 12 in, 10 live, 2 dead, 0 noise.

**Why it mattered before Sunday.** A registry URL that 404s does not merely
fail to rank. `rank` records no position, `watch` raises `off_serp`, and
`picker.priority` scores a page with no position as `rank = 999` —
*deliberately* the worst case, which is right for a page that fell off the SERP
and catastrophic for one that no longer exists. Both 404s would have **led** the
shortlist, taken two of the seven Anthropic audits, and plausibly won two of the
week's three slots. The only outward sign would have been the report saying
*"the rest returned an error inside the toolkit"* — the wrong culprit, in words
convincing enough to stop the search.

## 3. C9 — agree, with two additions

The constraint is right and the GSC evidence behind it is the strongest thing in
the 08-24 document. Two refinements before it goes in the file:

**Say that splitting a passage is not cutting words.** 78–93% of every top-5
priority score is the single unbounded term `8 x failed_passages` — comp-set
344 of 406, the pillar 232 of 249 — and what that term generates is
*"long (164 words; consider splitting)"*. Splitting reformats; it removes
nothing. As worded, C9's floor/ceiling language does not reach reformatting, and
an LLM audit reading "split" as licence to trim would cut exactly the depth C9
exists to protect. C9 also has to name the metric it moves — V4 requires it —
which is **AI citation**.

**Do not lose `/` and `/about/`.** Keeping them out of an *article* rotation is
right. But `/` scores inline citability **25** and receipts **31**, and
`/about/` scores 25 and 37 — the worst two on the site, and `/about/` is what
the `receipts` tool checks *for* on every other page. They want a one-off fix
outside the rotation, not removal from view.

## 4. Items 4 and 5 — no objection

`page_vs_serp` not driving the rotation, and skipping its output below 60%
coverage, are both right. The sweep covers every page deterministically and for
free; `page_vs_serp` runs on whatever the sweep picked.
