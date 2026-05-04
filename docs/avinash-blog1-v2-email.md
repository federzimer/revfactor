# Email draft to Avinash Tripathi — Blog 1 v2 review

**To:** Avinash Tripathi <team@getcito.com>
**From:** Aaron Whittaker
**Subject:** RevFactor Blog 1 v2 — three small fixes before we publish

---

Hey Avinash,

Reviewed v2 — strong work. The team picked up almost everything from the round-1 feedback: Quick-Answer + Key Stats callouts under the H1, Refactor.ai disambiguation in three locations, the 7 leaks reordered by impact, the bookshop quote (verbatim, with the "perishable inventory inside perishable inventory" tag we suggested), the 4-step minimum-stay HowTo block, the strengthened author bio with the five podcasts, the single CTA before About-the-Author, Federico's headshot, both new RevFactor FAQs, and the math standardized to 50% / $250. The voice still sounds like Federico.

Three small fixes before we publish:

**1. Flip the order of the WW2 paragraph and the lake-house quote in §"Minimum Stay as a Competitive Weapon."**
Right now the Wald/bombers paragraph lands after Federico's Michigan lake-house quote — the narrative arc wants it before, so the survivorship-bias frame sets up Federico's STR application of it (rather than explaining a quote we already read). Same paragraphs, just swap.

**2. Clean the markdown escape artifacts at the HTML pass.**
The Quick Answer cell currently shows `\*\*Quick Answer\*\*` with literal escaped asterisks, and the Key Takeaways block has `&#10;` line-break entities throughout. Google-Docs export noise; if it ships as-is it'll render as raw `\*\*` and HTML entities on the live page. Your dev/HTML pass should normalize: `\*\*` → bold, `&#10;` → line breaks.

**3. Smaller polish (your call):**
- The "60% occupancy with strong rates" line inside the RevPAR FAQ contradicts the body's standardized 50%/$250 example. Doesn't matter much because the contexts are different, but if you want strict consistency, change it to "60% occupancy with strong rates" → "low occupancy with strong rates" (or align to 50%/$250).
- Leak #4 ("Minimum stays are treated as a single setting") lost the "static" / "treated as defense" framing from v1 — minor, but the sharper phrasing landed better.

**Schema:** noted that you're sending the JSON-LD package (Article + Person + FAQPage + HowTo + DefinedTerm + BreadcrumbList) separately. Drop it as a single `<script type="application/ld+json">` block at the very end of the post body — Google parses head or body, and ending-of-body keeps it inside the GetCito-delivered HTML by default. The full code is in the review doc Appendix A if your dev needs it.

**Doc cleanup:** before publish day, prune the v1 backup and the Content Outline section from the bottom of the doc (everything after the second `# Blog` heading). Confirming only the top v2 ships.

Once these three land, we're publish-ready. Aiming to ship Blog 1 alongside the companion "best revenue management companies" listicle in the same drop so FAQ #1 has a live link target.

Thanks — Aaron
