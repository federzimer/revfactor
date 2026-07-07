# RevFactor — Developer Handoff

> Onboarding + access package for the RevFactor marketing site and analytics.
> Scope: the **website** (build/deploy, lead funnel) and **analytics/conversion tracking**.
> (Google Ads / paid search is run separately by Aaron — not part of this handoff.)
> Last updated: 2026-06-29.

> **🔑 Secrets/API keys are NOT in this document.** Aaron is sharing them separately as a
> LastPass secure note titled **"RevFactor — Shared Secrets (Jlo)"**. Wherever you see
> `→ LastPass note` below, the value lives there.

---

## 0. What RevFactor is

RevFactor is a revenue-management consultancy for short-term-rental (STR) operators —
dynamic pricing strategy, not a tool. The site is a cinematic Astro landing site
("Precision Revenue Craft" aesthetic) plus a blog/journal, case studies, a few PPC
landing pages, and lead-capture flows.

- **Production domain:** `www.revfactor.io` (apex `revfactor.io` 307-redirects to `www`)
- **Primary CTA:** "Schedule a Strategy Call" / "Discovery Call" → consultation booking
- **Founder/owner:** Federico ("Fede") Zimerman. Partner: Gaston.

---

## 1. Access checklist — what you'll be invited to (you use your OWN logins)

You don't get shared master accounts. You get added to each service under your own
identity. **Send Aaron your GitHub username + the Google account you want to use**, and
these invites get created:

| Service | What you need | How you get it |
|---|---|---|
| **GitHub repo** | Collaborator (write) on `federzimer/revfactor` | Fede/Aaron adds you; clone over your own SSH key/account |
| **Vercel** | Member on the `revfactor` project | Added by email; deploys are automatic on push (see §3) |
| **Google Analytics 4** | Editor on property `533592968` | Access granted to your Google account |
| **Search Console** | Full user on `https://www.revfactor.io/` | Access granted to your Google account |
| **Bing Webmaster** | Delegated access on `https://revfactor.io/` | Invite or shared API key (→ LastPass note) |
| **PostHog** | Member on project `412677` | Added by email |

> The shared **service API keys** (AirROI, Anthropic, Gemini, Supabase, Resend, Bing,
> Ahrefs) are the only raw secrets you'll hold — everything else is your own login. All
> live in the **LastPass note**.

---

## 2. Repo + local setup

- **Repo:** `git@github.com:federzimer/revfactor.git` (clone with your own GitHub SSH key once added)
- **Stack:** Astro 5 + React 19 islands + Tailwind v4 + GSAP + MDX + sitemap. d3-geo/topojson for the coverage map. GrowthBook for feature flags.
- **Node:** use the version your local Node 20+ provides; `npm install` to set up.

```bash
npm install
npm run dev      # astro dev — http://localhost:4321
npm run build    # → dist/
npm run preview  # serve the production build
npm run lint     # eslint
```

Create a local `.env` (gitignored) with the values from the **LastPass note** to run the API routes and analytics locally.

---

## 3. Hosting / deploy (Vercel)

- Vercel project is connected to the GitHub repo. **Push to `main` → production deploy.** Push any other branch → preview deploy.
- **Framework preset:** Astro · **Build:** `npm run build` · **Output:** `dist/`
- **Domains:** `www.revfactor.io` (primary), `revfactor.io` (redirects to www)
- **Preview/staging safety:** `vercel.json` sends `X-Robots-Tag: noindex, nofollow` on every `*.vercel.app` host, so previews never get indexed. **Do not** remove that rule. After any production deploy, sanity-check headers (see §11).
- **Serverless API routes** live in `api/` and run as Vercel Edge functions:
  - `api/subscribe.ts` — newsletter signup → Supabase
  - `api/discovery-lead.ts` — discovery-call qualifier capture → Supabase + Resend email notification
- Set the LastPass env vars in **Vercel → Project → Settings → Environment Variables** (Production + Preview).

---

## 4. Site architecture

```
src/
├── pages/            # Astro routes (incl. /blog, /vs comparison pages, PPC LPs, 404)
│   └── blog/
├── content/          # Content collections
│   ├── blog/         # MDX posts
│   └── case-studies/
├── components/       # Astro + React island components (ScheduleModal, PPCLanding, Navbar…)
│   └── blog/
├── layouts/          # BaseLayout.astro etc.
├── data/             # portfolio-stats.ts — SINGLE SOURCE OF TRUTH for headline numbers
└── assets/
api/                  # Vercel edge functions (subscribe, discovery-lead)
public/               # static assets incl. llms.txt + okf/ (AI-citability bundle)
scripts/              # Build/ops + content-mining helpers (mostly Aaron's tooling)
tests/playwright/     # E2E flow + conversion tests
```

### Portfolio stats — single source of truth
Headline numbers (properties managed, markets, states, RevPAR lift) live in
**`src/data/portfolio-stats.ts`** (`PORTFOLIO_STATS` + `STAT_LABELS`). React/Astro
components import `STAT_LABELS` directly. MDX prose can't import TS, so a script keeps
the literal text in sync:

```bash
# Updates the data file AND sweeps known literals across content/pages/components:
python3 scripts/update_portfolio_stats.py --properties 220 --markets 72 --states 26 --lift 26
python3 scripts/update_portfolio_stats.py --properties 220 --dry-run   # preview first
```

---

## 5. Lead funnel (read this — it's the heart of the site)

There are **three** lead paths on the site. You'll own keeping them working and helping
integrate Fede's v2 funnel.

### 5a. Newsletter / self-serve subscribe → Stripe Checkout
The "Subscribe" buttons send visitors **straight to a single Stripe Checkout link**
(`CHECKOUT_URL` in `src/components/Navbar.jsx` → `https://checkout.revfactor.io/...`).
Property count is selected inside Stripe Checkout — there is **no** property-count modal
anymore (that was removed). PostHog fires `subscribe_checkout_started` on click.
The separate `api/subscribe.ts` route still writes journal newsletter emails → Supabase
`subscribers` (used by the blog newsletter form, not the paid Subscribe button).

### 5b. Discovery Call qualifier (v1 — LIVE)
`ScheduleModal` runs a 2-question qualifier:
1. "Do you have a short-term rental property?"
2. "PM company or self-host?"

Branches: **no-property** → email capture · **PM company** → email capture · **self-host**
→ Cal.com booking embed. Captures land via `api/discovery-lead.ts` → Supabase
`discovery_leads` + a Resend notification to `notifications@revfactor.io` +
`federico@blackbirdhm.com`. (Requires `RESEND_API_KEY` in Vercel — without it the lead
still saves but no email goes out.)

### 5c. v2 funnel (Fede is designing/building — you'll QA + integrate)
Fede is building updated funnel logic in a fork and will hand it over for integration into
`main`. The intended v2 flow:

1. **Q1 — Have an STR property?** No → invest-intent branch · Yes → launch-status branch
2. **No-property branch — investing in next 90 days?** No → investment-guide drip (no call) · Yes → email capture + "check back" flag
3. **Has-property branch — property status?** (about-to-launch / operating / wants-to-switch-PM) → calculator
4. **Calculator** — revenue estimate from listing URL + comps + amenities (v2 makes it a real estimator; AirDNA/PriceLabs comps, photo/amenity AI scoring, downloadable PDF; ~$1/report API cost)
5. **Service-overview video** (45–90s)
6. **Testimonials carousel** (approved case studies)
7. **Final qualifier — delegate pricing vs. self-manage** → delegate → Cal.com Discovery Call · self-manage → self-service tier / educational drip

**Four lead types Fede defined:**

| Type | Who | Destination |
|---|---|---|
| 1 | No property, no knowledge | Investment guide + 60-day drip |
| 2 | Has property, room to grow | Calculator → testimonials → Discovery Call |
| 3 | Has property, wants consulting | Calculator → Discovery Call (priority) |
| 4 | Large portfolio / PM company | Email capture → Fede outreaches personally |

> **Integration plan:** QA the v2 funnel against v1 before swapping it in; hide the existing
> scheduler widget on swap day (coordinate timing with Fede). The booking scheduler itself
> lives in Fede's separate repo (§8).

---

## 6. Environment variables / shared secrets

**All raw values are in the LastPass secure note** ("RevFactor — Shared Secrets (Jlo)").
The website + API routes use these (set in local `.env` and Vercel project settings):

```bash
# --- Public (client-side, safe to expose) ---
PUBLIC_CLARITY_ID=...
PUBLIC_POSTHOG_PROJECT_TOKEN=...
PUBLIC_POSTHOG_HOST=https://us.posthog.com
PUBLIC_GROWTHBOOK_KEY=...

# --- Supabase (newsletter + discovery-lead storage) ---
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# --- Resend (discovery/newsletter notification email) ---
RESEND_API_KEY=...
DISCOVERY_NOTIFY_FROM=RevFactor Discovery <notifications@revfactor.io>
DISCOVERY_NOTIFY_TO=...
DISCOVERY_NOTIFY_TO_PM=...

# --- AirROI (STR market data for the calculator tooling) ---
AIRROI_API_KEY=...        # base https://api.airroi.com · header x-api-key

# --- Anthropic (listing-craft scorers) ---  model: claude-haiku-4-5-20251001
ANTHROPIC_API_KEY=...

# --- Google Gemini (AI image mockups) ---  model: gemini-2.5-flash-image
GEMINI_API_KEY=...

# --- Bing Webmaster Tools API ---  site: https://revfactor.io/
BING_WEBMASTER_API_KEY=...
```

> The `scripts/` folder also contains Aaron's content-mining tooling (brain-scan, Peec,
> POP, Slack alerts) which use their own keys (`APIFY_TOKEN`, `PEEC_API_KEY`, `POP_API_KEY`,
> `SLACK_WEBHOOK_URL`). **Those are Aaron's — not needed to build or run the website.**

---

## 7. Analytics & conversion tracking

| Surface | ID / property | Notes |
|---|---|---|
| **GA4** | `properties/533592968` (measurement ID `G-1CTGBJ9RLK`) | Key event: `book_strategy_call` (primary conversion) |
| **Search Console** | `https://www.revfactor.io/` (URL-prefix property) | Use the www URL-prefix property, not the domain property |
| **Bing Webmaster** | `https://revfactor.io/` | API key → LastPass note |
| **PostHog** | project `412677` | events: `schedule_modal_opened`, `strategy_call_booked`, `subscribe_checkout_started`, `exit_intent_*`, `faq_item_expanded` |
| **Microsoft Clarity** | `wjzvovceec` | session replay / heatmaps |

**Booking → conversion flow:** the strategy-call calendar is a separate app embedded as
an iframe at `https://schedule.revfactor.io/embed` (Fede's repo, not in this codebase).
The conversion event fires *inside* that scheduler app when the booking reaches the
"confirmed" state — not via postMessage from this site. If conversions stop firing,
that's the place to look (coordinate with Fede).

> These conversions also feed Aaron's Google Ads account (Aaron manages paid search
> separately). After any funnel/tracking change, give Aaron a heads-up so he can confirm
> conversions still register on the Ads side.

---

## 8. Integrations to know about

- **Stripe** — self-serve Subscribe path is a hosted Stripe Checkout link (`checkout.revfactor.io`), configured in Stripe (not in this repo). The site just links to it.
- **Resend** — transactional email for discovery/newsletter notifications. revfactor.io domain DNS is live; needs a RevFactor-owned key + domain "verified" in Resend before external recipients (e.g. blackbirdhm.com founders) receive mail.
- **Supabase** — stores newsletter `subscribers` and discovery-lead `discovery_leads` (project `dvzqphrzzhbjfcctyksw`, us-west-2).
- **GrowthBook** — feature flags / experiments (`@growthbook/growthbook-react`). Client key via `PUBLIC_GROWTHBOOK_KEY`.
- **AirROI** — STR market data (ADR/occupancy/RevPAR/comps) for the calculator. (v2 calculator may also pull AirDNA/PriceLabs comps — see §5c.)
- **schedule.revfactor.io** — external Next.js booking app (Fede's). The site only embeds it.

---

## 9. House rules (important)

- **PPC landing pages are `noindex, nofollow`** by default — never let a paid-traffic LP get indexed.
- **Every PPC ad URL carries a `?msg=THEME` parameter** for ad↔LP message match — don't randomize the H1 on paid traffic.
- **Never `noindex` a live/production page** without explicit sign-off.
- **Owner name in copy:** first name only ("Fede" / "Federico"), per brand convention.
- **Brand spelling:** "RevFactor" (capital V).
- **Headline numbers** come from `src/data/portfolio-stats.ts` only — don't hardcode them ad hoc.

---

## 10. QA / testing

- Playwright E2E specs live in `tests/playwright/specs/` (discovery modal, PPC modal, conversion tracking). Run before shipping UI/flow changes.
- **Verify the full conversion pipeline**, not just the success screen — submit a real test lead and confirm it lands in Supabase + fires the conversion.
- Use a **unique test email per run** (the specs already tag emails with a run ID).

---

## 11. Post-deploy sanity check

After any production deploy, confirm robots headers are correct (HTTP `X-Robots-Tag`
overrides HTML meta — a preview-noindex rule leaking onto production has bitten this
site before):

```bash
curl -sI https://www.revfactor.io/ | grep -i x-robots-tag      # should be ABSENT on production
curl -sI https://revfactor.io/      | grep -i -E 'location|x-robots'  # apex should 307 → www
```

---

## 12. First-day checklist (Jlo)

1. Send Aaron your **GitHub username** + the **Google account** you'll use.
2. Accept invites: GitHub, Vercel, GA4, Search Console, PostHog.
3. Clone the repo, `npm install`, drop the LastPass values into a local `.env`, `npm run dev`.
4. Confirm a local build (`npm run build`) succeeds.
5. Read §5 (lead funnel) closely — it's where most of the work will land, including QA/integration of Fede's v2 funnel.
6. Ping Aaron once you can build locally — then he'll hand off live tasks.
