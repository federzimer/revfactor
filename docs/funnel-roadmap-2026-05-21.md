# Funnel + Calculator Roadmap — 2026-05-21

**Source:** Federico / Aaron call, 2026-05-21 (Fireflies ID `01KS300FV9N3NTFE25WT4Q1X77`, 94 min).

**Shipped today:** v1 Discovery Call qualifier (commit `04a0e40` on `cluster-builds-2026-05-15`).

This document is the action list extracted from the call. Group A is what's already done. Group B is the v2 funnel build Fede is leading. Group C is content / ads / data work to do in parallel.

---

## Group A — v1 Discovery Call qualifier (✅ shipped)

| Item | Status |
| --- | --- |
| Rename "Free Strategy Call" → "Discovery Call" across all surfaces (20 files) | ✅ |
| ScheduleModal Q1: "Do you have a short-term rental property?" | ✅ |
| ScheduleModal Q2: "PM company or self-host?" | ✅ |
| No-property path → email capture | ✅ |
| PM path → email capture | ✅ |
| Self-host path → existing Cal.com embed | ✅ |
| Supabase `discovery_leads` table + RLS | ✅ |
| `api/discovery-lead.ts` Vercel edge function | ✅ |
| Resend notification email → aaron@procloser.ai + federico@blackbirdhm.com | ✅ (needs `RESEND_API_KEY` env var in Vercel) |

**Blocker before this is fully live:** Vercel env var `RESEND_API_KEY` needs to be set on the project. Without it the lead still saves, but no notification email goes out.

---

## Group B — v2 funnel (Fede leading, building in a fork)

Per Fede: "Build updated funnel logic in a new git branch or fork and notify Aaron when ready for integration." Aaron's job after that: QA + integrate into main repo.

### v2 Question flow (Fede's design)

1. **Q1 — Do you have a short-term rental property?**
   - No → branch to investment-intent question.
   - Yes → branch to launch-status question.

2. **Q2a (No-property branch) — Are you planning to invest in the next 90 days?**
   - No → investment-guide drip (educational low-ticket content + partner referrals + 60-day email follow-up). No call booked.
   - Yes → email capture + queue into the investment-guide drip with a "we'll check back" flag.

3. **Q2b (Has-property branch) — Status of your property?**
   - About to launch / under contract → calculator → continue funnel.
   - Already operating → calculator → continue funnel.
   - Currently using a property manager and want to switch → calculator → continue.

4. **Calculator** (revenue estimate using listing URL + comps + amenities).

5. **Service-overview video** (45-90 sec, the "what RevFactor actually does" reel).

6. **Testimonials** (carousel pulled from approved case studies + video testimonials).

7. **Final qualifier — Are you ready to delegate pricing, or do you want to self-manage with our tooling?**
   - Delegate → Cal.com Discovery Call booking.
   - Self-manage → currently no fit; route to a self-service tier or educational drip.

### Four lead types Fede defined

| Type | Description | Funnel destination |
| --- | --- | --- |
| Type 1 | No property, no knowledge | Investment guide + 60-day follow-up drip |
| Type 2 | Has property, room to grow | Calculator → testimonials → Discovery Call |
| Type 3 | Has property, wants detailed consulting | Calculator → Discovery Call (priority) |
| Type 4 | Large portfolio co-host / PM company | Email capture → Fede outreaches personally |

### v2 build TODOs (in branch)

- [ ] Q1 → branch logic (No → invest-intent, Yes → launch-status)
- [ ] Investment-intent question (90-day window)
- [ ] Investment-guide drip (Resend campaign with 60-day cadence)
- [ ] Launch-status question on Has-property branch
- [ ] Calculator integration as funnel step
- [ ] Service-overview video embed
- [ ] Testimonials carousel
- [ ] Final delegate-vs-self-manage qualifier
- [ ] Self-service tier landing (for "self-manage" path)
- [ ] Hide existing scheduler widget while v2 rolls out (temporary, Fede + Aaron coordinate timing)

---

## Group C — Calculator v2 (revenue estimator)

The calculator is the funnel's center of gravity. Today it's a static RevPAR widget; v2 makes it a real revenue-lift estimator with AI inputs.

- [ ] Property URL input
- [ ] Auto-pull listing comps from AirDNA / PriceLabs API
- [ ] User override on auto-selected comps (replace with their own picks)
- [ ] Amenities ranking (extract + score from listing)
- [ ] Photo quality assessment (AI scoring)
- [ ] Downloadable PDF report with full analysis
- [ ] Confidence-level disclaimers on AI estimates
- [ ] Expand comp search radius based on property count (1 vs portfolio)
- [ ] Single dynamic flow — branches on has-property y/n, no separate market-research entry point
- [ ] Cost guardrails — API spend is ~$1/report; investigate partner plans as volume grows

---

## Group D — Content + marketing

### Stats / claim updates

- [ ] **+18% → +24-25%** average revenue lift (Aaron updates all site copy + Person schema + listicle copy). Source: new client data 2026-Q2.
- [ ] **165+ properties → 1,998 listings across 56+ markets, 67 clients.** Update all stat blocks (Method post, RM pillar, hero, About).

### Case studies + permissions

- [ ] Aaron sends Fede list of featured clients + video cuts.
- [ ] Fede requests photo + social-handle permissions from each.
- [ ] Fede updates client success stories with stronger detail (Kate Henry, Erin/Kassidy Warren, Sarah, Maryssa, etc.).
- [ ] Build /case-studies/ pages once permissions land (currently 404 — links already removed from cluster posts).

### Blog content

- 2 posts live today; 6 more queued.
- [ ] Aaron + GetCito ship the 6 queued posts.
- [ ] Each post gets the new interactive design treatment (charts, graphs, AI-generated imagery).
- [ ] AI post summaries (Claude-generated TL;DR cards on each post).

### AI training data archive (Claude persona)

- [ ] Pull podcasts, TikToks, IG content into shared git repo.
- [ ] Train Claude assistant on the archive so it can produce consistent messaging + post summaries.
- [ ] Long-term: AI persona for the business owner / "what would Fede say" routing.

### PR opportunities

- [ ] Pitch underpricing-during-major-events angle (Super Bowl, World Cup) to STR / hospitality press.
- [ ] Pursue mentions / placements as algorithm-fail narratives keep landing.

---

## Group E — Ads + tracking

- [ ] Aaron adds Fede as admin in Google Ads + walks him through verification.
- [ ] Continue Google Ads campaigns; expect free credits at increased spend.
- [ ] Monitor conversion tracking after funnel changes deploy.
- [ ] Aaron resends scheduler-update links to Fede.

---

## Group F — Strategic / longer-term

- [ ] Proprietary SaaS combining market data + RM (compete with AirDNA / PriceLabs).
- [ ] Selective referral revenue: CPAs, brokers, partner programs for unqualified leads.
- [ ] "Great problem" capacity awareness — selectivity is the brand; funnel should reinforce it.

---

## Coordination — who does what

| Owner | Next action |
| --- | --- |
| **Aaron** | Add `RESEND_API_KEY` to Vercel; ship v1 discovery flow live; send Fede the featured-client list + scheduler update links; add Fede to Google Ads. |
| **Fede** | Build v2 funnel logic in fork; request client photo/social permissions; integrate screen recording into scheduler. |
| **Both** | QA the v2 funnel together before swapping it in over v1. Hide existing scheduler widget on swap day. |

---

*Generated from Fireflies meeting `01KS300FV9N3NTFE25WT4Q1X77` — 2026-05-21.*
