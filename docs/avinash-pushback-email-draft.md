# Email draft to Avinash Tripathi — RevFactor strategy & backlink pushback

**To:** Avinash Tripathi <team@getcito.com>
**From:** Aaron Whittaker
**Subject:** RevFactor — strategy reconciliation + backlink audit findings

**Attachments:**
- `blog-1-outline-feedback.docx` — annotated Pillar 1 outline with all detailed feedback inline
- `disavow-revfactor-2026-04-29.txt` — proposed disavow file (25 domains)

---

Hey Avinash,

I've worked through the four strategy docs (Pillar 1 outline, 12-month Content Strategy, Onboarding Questionnaire, Backlink Strategy) and pulled Ahrefs data on the 38 backlinks built so far. A few things to work through before we go further. I've put the detailed feedback inline in an annotated copy of the Pillar 1 outline (attached) — this email is the summary.

## 1. The four docs disagree with each other

Pillar count, posts/month, and backlink velocity are all different across the docs vs what we agreed on the 4/22 call:

| | 4/22 call | Content Strategy | Onboarding §7 | Backlink Strategy |
|---|---|---|---|---|
| Pillars/clusters | 6 | 7 | 6 (different set) | Assumes 7 |
| Posts/month | 8 | 16–24 | ~20 | — |
| Backlink approach | "Conservative" | — | — | 100+/mo, 20 DR70+ |

Either we ratify what we discussed (6 pillars / 8 posts/mo / conservative links) or you walk me through the case for the expansion with corresponding budget. As written today it's drift, not decision — I need one source-of-truth strategy before any more production starts.

## 2. Pull the "controlled forums resembling Private Blog Networks" item

This was in your call action items at the 30:00 mark. PBNs are an explicit Google webmaster guideline violation, even euphemized as "controlled forums" — it'll trigger a manual action and tank everything else we ship. Let's replace with participation on legitimate communities (Reddit r/airbnb, BiggerPockets STR forum, AirHostsForum).

## 3. Brand-clash with Refactor.ai needs Phase 1 work

You flagged this on the call but it's not in any of the four docs. Without an llms.txt entity statement + Wikidata entry + schema sameAs locks pointing at revfactor.io, the AEO citations split between revfactor.io and refactor.ai. Needs to be Phase 1, Week 1 — before any pillar content ships.

## 4. The 38 backlinks delivered so far — Ahrefs audit

I ran every domain through Ahrefs. Summary:

- **15 of 16 bookmark sites are PBN-signature link farms.** DR 22–50 with **0 organic traffic and 0 keywords across the board.** That's the classic artificial-DR-no-real-audience pattern Google's link-spam classifier specifically targets. Same template across all 15, identical anchor text "RevFactor: Intelligent Pricing for Inspired Stays" copied verbatim across each one. (Diigo is the only legitimate one — keeping.)
- **7 of the "profile creation" placements are Wix-template parasite profiles** (pattern: `<random-small-business>.com/profile/revfactormarketing<digits>/profile`). DR 18–35, all 0 traffic, 100% nofollow by Wix default — zero authority transfer. drfedorenko.com is DR 18, lower than ours. The others (moonpathcuups.org, garthcharityprojects.org, uapexpedition.org, etc.) are charity/expedition/restaurant sites with no topical relationship to STR pricing.
- **3 sketchy/dead platforms with 0 traffic:** bingbees.com, chaintalk.tv, interestpin.com.
- **NAP inconsistency.** Five different brand handles across the 38 placements: `revfactormarketing`, `revfactrevenue`, `Revfactor`, `revfactor`, `thoughtfullychocolate8a90b78b45` (auto-generated Gravatar). The strategy doc explicitly required uniform NAP — that didn't happen.
- **Zero placements** in the editorial categories your Backlink Strategy named as priorities: Hotel Tech Report (which you called the "highest leverage editorial link"), Rental Scale-Up, BiggerPockets, Skift/Bisnow, or any of the 5 PMS partner blogs (Hospitable / Hostaway / Guesty / OwnerRez / Hostfully).

Your own Backlink Strategy doc says: *"Spammy or low-trust platforms do not appear in our submission list — the 17% spam score cannot afford additional exposure to bad neighbourhoods."* The execution did the opposite.

**Action requested:**

1. **Pause further foundational link work** until we agree on the next 60 days of plan.
2. I'm preparing a **disavow file covering 25 of the 38 domains** (15 bookmark farms + 7 Wix parasites + 3 dead platforms — attached). Confirm none of those were planned anchors before I submit it to GSC.
3. **Fix NAP consistency** on the 13 profiles we keep — pick one handle (`revfactor` is shortest and cleanest), update everywhere.
4. **Run the spam-score audit** the strategy doc promised in Phase 3 — but FIRST, before any new links go on the profile. Don't pour clean water into a dirty bucket.
5. **Replace the next 100 foundational links** with editorial outreach: Hotel Tech Report listing, Rental Scale-Up feature pitch, Reddit/BiggerPockets community engagement, podcast outreach pipeline, PMS partner blog pitches. 8 high-effort editorial placements over 60 days will move DR more than 800 foundational submissions ever will.

Scope split, to confirm: I own HARO/Featured/Qwoted/Connectively pitch motion (per the 4/22 call). GetCito covers everything else off-page.

## 5. Other doc fixes — covered in detail in the attached docx

Quick list of items that need to land in the next strategy revision:

- **Move FIFA content from Phase 4 to Phase 1.** FIFA World Cup 2026 runs Jun 11 – Jul 19; STR booking curve runs 60–180 days out. Publishing FIFA content in Phase 4 (Wks 11–13) lands it during the tournament, past the booking window. It needs to ship now.
- **Add a companion listicle** — "Best STR Revenue Management Companies 2026" — to capture the ~60 vendor-discovery prompts on Peec that the pillar can't (the pillar is definitional, not a buyer-comparison page).
- **Cannibalization triangle:** existing live `/blog/dynamic-pricing-str-beginners-guide/` + the new pillar + your planned "Dynamic Pricing vs Revenue Management" Phase 2 post all target the same head-term intent. Decision needed before any of the three ships. My recommendation: keep the existing post, trim to ~600 words, link UP to the pillar; merge the planned vs-post into Section 4 of the pillar instead of standing it up alone.
- **Standardize pricing copy.** Strip the "1–2% management fee" line from Pillar 1 Section 12. Real pricing per Stripe: $320/mo (1 prop) → $304 → $288 → $272 → $256 (5 props), plus $125 onboarding. This needs to be consistent across every blog brief going forward.
- **Onboarding §6.3:** Federico's IG handle is `@federico.zimerman`, not `@strguide`. TikTok is `@federicozimerman`. Both wrong in the doc.
- **Onboarding §2.2:** Says "24 states and 56 markets" then enumerates 23 states. Reconcile to whichever is accurate on the about page.

The annotated docx has more — verbatim Federico quotes mapped to specific pillar sections (8 quotes, including a fresh pacing quote from his April TikTok), a recommended testimonial for Section 13 with schema guidance, and a podcast-citation pattern that gets all 9 of his appearances into the page-level Person schema rather than diluting the body copy.

Happy to jump on a 30 minute call this week if it's easier than email.

— Aaron
