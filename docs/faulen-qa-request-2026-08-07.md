# QA request — RevFactor content batch, 2026-08-07

Draft of the QA hand-off for Faulen. Written for a non-technical reviewer: three links to
click, plain-language checks, no branch or deploy detail. Send by whichever channel Faulen
uses; they are not on the Claude-to-Claude mailbox, so this does not route itself.

**Anything technical is deliberately not in here** — schema, build, frontmatter, IndexNow,
indexability, `updatedDate`, and the link gate are on me and are verified separately. Faulen's
pass is content, accuracy and how it reads. See §"Split of responsibilities" at the bottom so
nothing falls between us.

---

Hi Faulen,

Three RevFactor pages are ready for your review. Everything below opens in a browser, no
setup needed. These are staging links, so they're not public yet and nothing you do can
affect the live site.

Nothing ships until you sign off, so take the time you need. If you can get to it early next
week that keeps us on schedule.

## The three pages

**1. Best Airbnb & STR Revenue Management Companies and Tools (2026)**
https://revfactor-kavbbhe4w-federico-zimermans-projects.vercel.app/blog/best-str-revenue-management-companies-2026/

This is our biggest page and it's a rebuild of an existing one, so it's the most important of
the three. Two older articles were combined into this single one, and the place to look
hardest is where they join, because that's where a combined article usually starts to repeat
itself or contradict itself.

The article ranks six companies. Three of them do the work for you, three are software you
run yourself. Further down there's a separate section for companies that show up when people
search for this but that don't actually do revenue management. **Keeping those two groups
clearly separate is the whole point of the article** — if anywhere in the copy it gets blurry
which group a company is in, flag it.

**2. Best Airbnb Property Managers With Dynamic Pricing (2026)**
https://revfactor-kavbbhe4w-federico-zimermans-projects.vercel.app/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/

Blackbird Hospitality is now listed at number one on this page. Blackbird is Fede's own
company, and the page says so openly and scores it on the same criteria as everyone else.
Please read that disclosure the way a stranger would and tell us honestly whether it reads as
upfront or as something we're slipping past people. That's a judgement call and we'd rather
have yours than ours.

**3. Is a Pricing Tool Enough? How to Choose an Airbnb Revenue Management Solution**
https://revfactor-git-content-best-a-1b2275-federico-zimermans-projects.vercel.app/blog/is-a-pricing-tool-enough-airbnb-revenue-management/

A new article for people trying to work out whether they need a person or just software. It
links across to page 1, and that link won't work yet on staging. That's expected, not a bug,
and it will work once both go live.

## What we'd like you to check

- **Is anything factually wrong?** Especially any company name, price, or claim about what a
  company does.
- **Does it read like a person wrote it?** Flag anything stiff, repetitive, or robotic.
- **Do the source links work and do they say what we claim they say?** Click a fair few. A
  link that opens is not the same as a link that backs up the sentence.
- **Does it look as good as our best articles?** Charts, images and tables should be spread
  through it, not a wall of text.
- **No names.** Never a client, owner, or property name anywhere. Results are described by
  market and property type only, for example "a Gatlinburg cabin".
- **Anything that makes you wince.** If a claim feels too strong or a comparison feels
  unfair, say so, even if you can't say exactly why.

## One task that specifically needs you

Five review scores appear on page 1 in a box that's meant to build trust. Each one needs a
human to open the site and confirm it, because we won't publish a number we haven't seen with
our own eyes.

| Company | What we currently claim | Where to check |
|---|---|---|
| PriceLabs | 4.9 out of 5, from 250 reviews | Capterra |
| Wheelhouse | 4.8 from 162 reviews | Capterra |
| Wheelhouse | 4.9 from 88 reviews | G2 |
| Beyond | 4.7 from 150 reviews | G2 |
| AirDNA | 4.0 from 942 reviews | Trustpilot |

Just tell us the number you see and the date you checked. **If a review count doesn't match,
don't worry about it** — we'll drop the counts and keep the scores. A wrong number in a trust
box costs us more than not having the number at all.

## How to send it back

Whatever's easiest — a list in a message, comments in a doc, screenshots. Page name and a
quick description of what's wrong is plenty. I'll turn fixes around the same day.

Thanks,
Jlo

---

## Split of responsibilities (internal note, not part of the message)

**Faulen checks (human judgement, browser only):** factual accuracy, tone and readability,
whether source links support the claim, visual density, absence of client names, the five
review numbers, the Blackbird disclosure.

**Jlo verifies (technical, before publish):** `updatedDate` bumped on every touched page,
schema intact (Person / BlogPosting / FAQ), 8 to 12 FAQs in frontmatter, meta description
under 320 chars with brand name verbatim, clean build, all links and images returning 200,
`index, follow` live, IndexNow fired, internal cross-links resolving, merge order held
(Aaron's branch first, then ours).

The original SOP §4 checklist mixes both. It cannot be handed to a non-technical reviewer as
written, because roughly half of it isn't checkable without a build. Splitting it this way
keeps every item owned by someone.
