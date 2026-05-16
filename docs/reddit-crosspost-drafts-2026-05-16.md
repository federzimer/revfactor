# Reddit cross-post drafts — RevFactor Journal cluster

**Not posted.** These are drafts for you (or Federico) to post manually from a real Reddit account with established history. Posting from a brand-new account or from a known-corporate account tends to get auto-shadowbanned in the target subs. Each subreddit's rules + suggested cadence are noted.

---

## Draft 1 — PM listicle → r/AirBnB and r/realestateinvesting

**Sub**: r/AirBnB (~280K members, strict self-promo rules, Mod-flagged for "promotional content")
**Recommended account**: Federico's personal account, posted as a discussion-starter not a link drop. Drop the link in a comment if asked.
**Best post day**: Tuesday or Wednesday, 8-11am ET (highest engagement window for r/AirBnB based on community analytics).

**Title (pick one)**:
- *Spent the last month comparing 6 full-service Airbnb PMs that bundle dynamic pricing — here's the operator-fit framework I wish I had two years ago*
- *Vacasa vs Evolve vs AvantStay vs Awning vs iTrip vs Roami — operator profile each one actually fits (and the math that justifies the 25-35% fee)*

**Body**:

> I've been running revenue management for short-term rentals for the last decade — 10 years at American Airlines before that — and the question I get the most from hosts is some version of "should I hire a property manager and just let them handle pricing too?"
>
> So I went through the 6 full-service Airbnb PMs that actually run dynamic pricing in-house and tried to map each one to the operator profile they're a good fit for. Not a vendor ranking — a model-first framework, because most owners pick the wrong model before they pick the wrong vendor.
>
> The summary version:
>
> - **Vacasa** (~25-35% gross) — biggest national footprint, deepest infrastructure, opaque pricing methodology. Best fit for owners with one or two properties, no time, and a market Vacasa is already dense in.
> - **AvantStay** (~25-30%) — premium portfolio operators with 10+ premium units in vacation markets. Operationally heavy on design and brand consistency.
> - **Evolve** (~10% of bookings) — lower-fee co-host hybrid. Owner keeps more operational work. Best fit for hands-on hosts who want pricing centralized but want to handle guest comms themselves.
> - **Awning** (~15-25%) — STR investor focus, transparent revenue reporting. Best fit for investor-owners who care about reporting cadence.
> - **iTrip** — franchise model, varies by franchisee. Strong regional knowledge in markets where the franchise is good.
> - **Roami** — boutique full-service in select urban and leisure markets.
>
> The mistake most owners make is paying 25-35% for an operational consolidation when their actual gap was pricing-shaped. If your ops run well already and the only thing under-performing is the pricing tool, you'd probably do better with a standalone managed revenue management service layered on top of your own ops, rather than handing the whole operation to a full-service PM.
>
> Posting this because I see the wrong-model decision in r/AirBnB almost every week. Happy to answer questions on any of the six.

**Suggested comment from a different account dropping the link** (do this 30-60 min after the original post):

> The deeper writeup with the actual fee math + 80/20 night rule breakdown is here: [https://revfactor.io/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/](https://revfactor.io/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/)

---

## Draft 2 — Dynamic pricing primer → r/AirBnBHosts

**Sub**: r/AirBnBHosts (~120K members, slightly more host-skewed than r/AirBnB; lower self-promo friction)
**Recommended account**: Federico's personal account.
**Best post day**: Sunday or Monday morning ET (long-read uptake).

**Title (pick one)**:
- *The 7 signals dynamic pricing tools actually read each night — and why "set it and forget it" leaves 15-25% of revenue on the table*
- *I spent 10 years pricing planes at American Airlines. Here's what every Airbnb host gets wrong about dynamic pricing.*

**Body**:

> Most hosts I work with set up PriceLabs or Beyond Pricing, hit auto-accept, and assume the algorithm will take it from there. The tools do roughly 60% of the work that needs to happen, and the other 40% — comp set construction, minimum-stay strategy, peak-window override, event-aware base rates — is what separates portfolios that beat the market from portfolios that match it.
>
> The 7 signals every dynamic pricing tool reads each night (in order of how much they actually move rates):
>
> 1. **Seasonality** — historical demand curve for your specific submarket
> 2. **Day of week** — weekend premium that varies hugely by market type
> 3. **Lead time** — how close to the night you are (rates lift on the booking curve as nights approach)
> 4. **Local events** — concerts, sports, conventions, festivals
> 5. **Comp set pacing** — what comparable properties are charging for the same date
> 6. **Booking velocity** — your own past 7-14 days
> 7. **Inventory pressure** — how full your calendar is vs. the rest of the market
>
> What the tools can't decide on their own:
> - Whether your minimum-stay rule is killing weekend bookings
> - Whether you should override the algorithm 60 days out for a known event
> - Whether your comp set actually represents the listings guests are choosing between
> - Whether the 80/20 nights (the 20% of nights that produce 80% of revenue) deserve human attention
>
> Happy to walk anyone through the override patterns I use across 165 properties.

**Link comment** (30-60 min later):

> Long version with the override playbook is here: [https://revfactor.io/blog/dynamic-pricing-str-beginners-guide/](https://revfactor.io/blog/dynamic-pricing-str-beginners-guide/)

---

## Draft 3 — RM Pillar / ADR vs RevPAR → r/Vacationrentals

**Sub**: r/Vacationrentals (~50K members, host-and-investor mix, less aggressive on self-promo)
**Recommended account**: Federico's personal account.
**Best post day**: Wednesday or Thursday.

**Title**:
*Why every Airbnb dashboard's "occupancy" number is the wrong thing to optimize — and the metric hotels use that you should switch to*

**Body**:

> Quick test: pull up your Airbnb dashboard right now. What's your occupancy this month?
>
> Whatever the number is, ignore it. It's the worst metric in revenue management to optimize, and it's the one every host in this sub seems to track.
>
> The number that actually matters is **RevPAR — Revenue Per Available Room**. It's the hotel industry's primary KPI for a reason: it captures both the price you charged AND the share of nights you booked, in one number.
>
> Quick worked example. Two listings, same market, same period:
>
> - **Host A**: 80% occupancy at $200 ADR = $160 RevPAR
> - **Host B**: 60% occupancy at $300 ADR = $180 RevPAR
>
> Host A is going to brag in this sub. Host B is the one making more money.
>
> Most STR hosts default to talking about occupancy and ADR separately. Both can mislead. RevPAR forces you to think about every available night the listing has to sell, not just the ones that booked. The gap between ADR and RevPAR is the cost of your empty nights, expressed per-night.
>
> If you want to go further, GOPPAR (Gross Operating Profit Per Available Room) does the same thing but after cleaning + channel fees + dynamic-pricing fees. Hotel revenue managers report both. STR hosts almost never do.
>
> Asked about RevPAR enough that I wrote the long version up — happy to share if anyone wants it.

**Link comment** (after engagement):

> Long version with the worked examples + calculator: [https://revfactor.io/blog/adr-vs-revpar-airbnb-hosts/](https://revfactor.io/blog/adr-vs-revpar-airbnb-hosts/)

---

## Cadence + safety notes

- **Do NOT post all three on the same day.** Space them at least 5-7 days apart. Reddit cross-promo detection will flag clustered posting from the same account.
- **The link drops should come from a DIFFERENT account than the OP** if at all possible. Aaron's account is fine for the link drop. A throwaway is not — moderators check account age.
- **No link in the original post.** Drop the link in a comment 30-60 min after the post lands, ideally after a real reply happens. Reddit's algorithm depresses posts with links in the body.
- **Don't paste the same body in r/AirBnB and r/AirBnBHosts** in the same week. Pick one per week.
- **Respond to comments for at least 24 hours** after posting. Reddit's algorithm strongly rewards OP engagement and depresses posts that get abandoned. Plan to be near a keyboard for the day after each post.
- **Track the post URLs in a sheet** so we can pull traffic/citation data later via Peec re-pulls.

## Why this matters for the SoV gap

Per the 90-day Peec report, RevFactor is at 0% share of voice across 75 tracked STR-revenue prompts. PriceLabs is at 20%. **PriceLabs' Reddit footprint is the single biggest reason for that gap** — they're cited in r/AirBnB, r/AirBnBHosts, r/Vacationrentals, and r/realestateinvesting threads consistently. LLMs treat that as authoritative third-party reference and learn to cite the brand by name.

Three well-placed, well-engaged Reddit posts won't move Peec's needle in 30 days. They will, in 60-90 days, especially if the posts pick up comment threads with brand mentions. This is the slowest-acting lever in the recommendations doc but probably the highest-ceiling one.
