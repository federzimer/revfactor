# Fede sync, Wed 2026-09-16

Updated 2026-09-14. Evidence and full plan: `docs/geo-citation-strategy-2026-09-13-update.md`.

## 1. AI visibility: where we are (10 min)
- [ ] Tracker baseline: RevFactor named in 6.2% of answers (#13 of 28 brands). Perplexity 10.7%, Claude 5.3%, ChatGPT 2.7%.
- [ ] We win "which company" prompts (9.6%) and score 0% on pricing-tool, how-to pricing and occupancy prompts.
- [ ] What works: our own "Best STR Revenue Management Companies" listicle (87 citations in 30 days) and the TechBullion listicle (~$50, 89 citations since 8/2).
- [ ] Shipped this week: AirDNA pricing-tool response added to the comparison posts; citability fixes on the top sweep pages.

## 2. Decisions we need from Fede (15 min)
- [ ] **Make the RevFactor GitHub repo private (federzimer/revfactor).** It is public today, so our strategy, pricing and outreach docs are readable by anyone. Only Fede can change it: GitHub repo Settings, General, Danger Zone, Change visibility to Private. Vercel deploys keep working after the switch.
- [ ] **HotelTechReport:** most-retrieved third-party site for our prompts (44 of 450 answers). Co-founder Adam Hollander emailed 9/11: basic profile in "Vacation Rental Dynamic Pricing Software" for a $500 one-time fee. Yes or no.
- [ ] **TechBullion round 2 (~$50):** "The Best Airbnb Pricing Tools in 2026 (and When a Done-for-You Service Beats a Tool)". Plus the matching listicle on revfactor.io.
- [ ] **LinkedIn Pulse from Fede's own profile:** two posts, "How to Price Your Airbnb for Peak and Off Seasons (2026)" and "How to Increase Airbnb Occupancy Without Dropping Your Rates". The vendor-profile post from July has 0 citations.
- [ ] **Listicle inclusion outreach:** 11 drafts ready (Chekin, Truvi, RealEstateBees, StayFi, Hostfully first). Fede approves the copy and the referral offers in 7 of them before anything sends from federico@revfactorwa.com.
- [ ] **AirROI:** Fede opens an AirROI account (needed for the Revenue Check app below) and we ask AirROI for a co-content or partner mention (airroi.com shows up in 31 of 450 answers).

## 3. YouTube (10 min)
- [ ] Status: RevFactor channel has 1 video, Fede's channel 4 (30 views total). YouTube is the #4 cited source on our prompts (771 citations in 30 days).
- [ ] First video script already sent: "How We Added $139K to 7 Airbnbs in One Summer (The Exact Playbook)". Shot list is ~20 minutes of talking head. Pick a filming date.
  - Script: https://docs.google.com/document/d/1P07DZMIWSnJwKHCDu7y2ke7YH-6rCYw4gTPO6-YngjA/edit
  - Channel strategy: https://docs.google.com/document/d/1gM2SQR51Sn1rYhSPw9IjJgEp7pjF14iYb-lyPH2q-y4/edit
- [ ] Publishing blocker: API uploads need an owner token from the channel owner, or publish through Riverside. Decide which.
- [ ] Next two videos cut from existing footage with pricing-tool titles (the most-cited video format on our prompts).

## 4. Meta ads strategy (10 min)
- [ ] Doc: https://docs.google.com/document/d/1NVv3zcIQHGwAdxjX0vRqxt5uGrwmXvK4k08wRelwUhE/edit
- [ ] Plan: one campaign at $3,000 to $5,000/mo, founder-face video, 4 hooks x 2 personas + retargeting cut (9 assets). Modeled $75 to $150 per booked call.
- [ ] Competitor: Pricing By Mira has run our tool-versus-strategy angle in paid since June 1. Our edge is the published numbers plus Fede's airline yield background.
- [ ] Before launch: budget sign-off, hooks rewritten to one sentence per line, one filming session for all 9 creatives (can share the YouTube shoot day), pixel + CAPI verified on the GHL page.

## 5. Revenue Check app (5 min)
- [ ] Shows an owner how much more they could make with RevFactor from their Airbnb listing URL (live AirROI data, 24% lift).
- [ ] Staging, verified loading 9/14: https://revfactor-revcheck-staging.vercel.app/revenue-check-local
- [ ] Needed to go live: **Fede's AirROI account and API key** (staging runs on a temporary key), Resend sender verified on revfactor.io (DNS at Namecheap), lead emails pointed to Fede and Gaston.

## 6. Tracking and site health (5 min)
- [ ] **Microsoft Clarity is not live.** The tag is missing from the live homepage (checked 9/14); it was never committed, so a production deploy removed it. Commit it to main, and always pull before `vercel --prod`.
- [ ] GSC Generative AI report: review AI Overviews and AI Mode impressions (data from 5/18).
- [ ] Weekly sweep: the "Bing deindex" alarm was a broken metric. Fixed 9/14, Bing shows 24 pages indexed and the sitemap is healthy.

## 7. Carry-over
- [ ] **Market pages (parked 8/16 plan, never started):** "Airbnb Revenue Management in {Market}" pages plus a paired "Best Airbnb Revenue Management Services for {Market} Hosts" listicle, 2 markets a month. Fede picks the first markets where we have real case data (candidates: Smoky Mountains, Gulf Shores/30A, Orlando/Kissimmee, Scottsdale, Broken Bow, Poconos, Big Bear, Hill Country TX). Plan: `docs/market-pages-addendum-2026-08-16.md`.
- [ ] Booking conversion: bookings flat at 15 while sessions rose 68% (Thrive Local strategy v3). Who owns the funnel audit?
- [ ] VRMA: Kevin and Dave confirmed supplier-membership fit and asked for a call. Take the call? Blake's VRMA 26 booth is a separate spend decision.
- [ ] Sept keyword swap.
- [ ] Case-studies v2 revisit with Gaston.
