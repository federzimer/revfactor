# QA request — RevFactor content batch, 2026-08-07

Draft of the QA hand-off. Send by whichever channel Faulen uses; they are not on the
Claude-to-Claude mailbox, so this does not route itself.

---

Hi Faulen,

You're the QA gate on the RevFactor content batch and it's released on Aaron's side, so
whenever you can get to it. Three pieces, all on staging, plus one item that specifically
needs a human with a browser.

## What to review

**1. The merged listicle — "Best Airbnb & STR Revenue Management Companies and Tools (2026)"**
https://revfactor-kavbbhe4w-federico-zimermans-projects.vercel.app/blog/best-str-revenue-management-companies-2026/

This one replaces the old best-str post in place, at the same URL, so it keeps the equity
and the live lead path. No redirect involved. It merges the new DEFINITIVE structure and
verified vendor data with the old post's vendor screenshots, Three Models framework, and the
geographic coverage / when-to-switch / common-mistakes sections. 16 FAQs merged. Worth
checking the seams where the two posts join, since that's where a merge usually reads oddly.

Six vendors are ranked: three managed services, three pricing tools. AirDNA, Key Data, DPGO,
Rankbreeze, Hostaway and Quibble sit in a labelled "show up in this search but are not
revenue management" section and are deliberately not ranked. That distinction is the point
of the post, so please check nothing in the copy accidentally blurs it.

**2. Blackbird Hospitality at #1 on the property-managers listicle**
Same staging branch. New entry with a fresh homepage screenshot, TL;DR / decision / coverage
tables updated. The founder relationship is disclosed on the page and the entry is scored on
the same rubric as everyone else. Please read the disclosure as a reader would and tell us
if it lands as plainly as we think it does.

**3. The 7-Lever buyer's guide**
`/blog/is-a-pricing-tool-enough-airbnb-revenue-management/`, on the second branch. It's the
"do I need a revenue manager or is a tool enough" intent, and it forward-links to the
listicle above, so it only makes sense once both are merged.

## The one item that needs a browser

Aaron called this out explicitly. Five review numbers appear in a trust box and each needs a
human to open the source and confirm it, then date-stamp it on the page:

| Vendor | Claimed |
|---|---|
| PriceLabs | Capterra 4.9 / 250 reviews |
| Wheelhouse | Capterra 4.8 / 162, and G2 4.9 / 88 |
| Beyond | G2 4.7 / 150 |
| AirDNA | Trustpilot 4.0 / 942 |

If any count can't be confirmed, we drop the volumes and keep the scores. A wrong count in a
trust box costs more than omitting it.

## Your §4 checklist, for reference

- `updatedDate` bumped on every touched page
- First-party data present and accurate, every cited stat hyperlinked to a source that loads
- Visual density matches our best posts, not a wall of text
- Humanized, no AI tells, no em-dashes, no hallucinated quotes
- Schema intact (Person / BlogPosting / FAQ), 8 to 12 FAQs in frontmatter
- Meta description serves SEO and AEO, under 320 characters, brand name verbatim
- Indexable live, IndexNow fired
- No client, property or owner names anywhere, results by market and property type only
- Internal cross-links to the pillar and related posts, no cannibalizing angle
- Builds clean, all links and images return 200

## What happens after you sign off

Merge order matters and it is not reversible: Aaron's branch goes to main first, then ours.
The buyer's guide forward-links to a page that only exists on Aaron's branch, so merging ours
first fails the link gate by design. Nothing goes live until you've signed off.

Anything you flag, send it back and I'll turn it around the same day.

Thanks,
Jlo
