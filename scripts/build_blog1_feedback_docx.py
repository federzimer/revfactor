#!/usr/bin/env python3
"""
Build blog-1-getcito-feedback.docx by:
1. Loading the GetCito draft from blog-1-getcito-draft.docx
2. Inserting RevFactor inline feedback paragraphs (marked [REVF])
3. Coloring marked paragraphs blue
4. Saving to blog-1-getcito-feedback.docx

Inline notes are built as a list of (anchor_text, position, blue_text) tuples.
position = "before" | "after" — relative to the anchor paragraph.
anchor_text is matched as a substring (first match wins).
"""

from docx import Document
from docx.shared import RGBColor, Pt
from copy import deepcopy

BLUE = RGBColor(0x1A, 0x4F, 0xBF)

SRC = "/Users/aaronwhittaker/Claude/RevFactor/docs/blog-1-getcito-draft.docx"
DST = "/Users/aaronwhittaker/Claude/RevFactor/docs/blog-1-getcito-feedback.docx"

# Each entry: (anchor_substring, "before"|"after", [list_of_blue_paragraphs])
# Blue paragraphs are inserted relative to the anchor.
INSERTS = [
    # ---------- Top-of-post additions ----------
    (
        "Let me show you the conversation that defines this entire industry.",
        "before",
        [
            "[REVF — ADD AT TOP] Last Updated: 2026-04-30 · Reading Time: ~22 minutes · Author: Federico Zimerman, Founder, RevFactor",
            "[REVF — ADD AT TOP] Add a 'Quick Answer' definition box right under the H1 (above the hero image), 40–60 words, exact wording: 'Revenue management for short-term rentals is the discipline of selling the right night, to the right guest, at the right price — using historical data, inventory rules, demand forecasting, and pacing — to maximize RevPAR (revenue per available night). It is distinct from dynamic pricing software, which executes the rules a revenue manager defines.' This becomes the AI Overview / featured-snippet target.",
            "[REVF — ADD AT TOP] Add a 'Key Stats' callout box before Key Takeaways, 3 lines: '+18% RevPAR lift vs. comp set across the RevFactor portfolio · 165+ properties managed across 24 U.S. states and 56 markets · Flat $320/mo per property — sliding to $256/mo at 5+ properties.' This is the EEAT proof-of-experience signal that competitors (Guesty, RentalsUnited, PriceLabs) entirely lack.",
        ],
    ),
    # ---------- Brand disambiguation (the Refactor.ai problem) ----------
    (
        "Revenue management sits one layer above your property management system.",
        "before",
        [
            "[REVF — BRAND DISAMBIGUATION] Add this sentence at the end of this section, exact wording: 'A note on the name: RevFactor (revfactor.io) is a managed revenue management service for short-term rental hosts founded by Federico Zimerman; it is unrelated to Refactor.ai, an unrelated SaaS product.' Reason: Without it, LLMs blend the two entities. This is the single highest-leverage AEO fix in the post.",
        ],
    ),
    # ---------- ADR vs RevPAR — fix the math inconsistency ----------
    (
        "A 100% occupied calendar at $50 a night is a worse outcome than 50% occupancy at $250.",
        "after",
        [
            "[REVF — MATH CHECK] The Key Takeaways box says '60% occupancy at $250'; this paragraph and the closing-thought paragraph say '50% occupancy at $250.' Pick one and use it consistently across all three locations (Key Takeaways, this paragraph, Closing Thought). The arithmetic table uses 50% × $300 — recommend standardizing on the 50%/$250 version everywhere outside the table.",
        ],
    ),
    # ---------- 7 Leaks reorder ----------
    (
        "Here are the seven leaks I find most often when I audit portfolios.",
        "after",
        [
            "[REVF — REORDER SUGGESTION] Reorder the 7 leaks by frequency (highest-impact first) so the AI extraction grabs the top three: (1) Pacing is invisible to the tool, (2) The base rate is anchored too low, (3) There's no length-of-stay strategy, (4) Minimum stays are treated as a single setting, (5) The comp set is stale or wrong, (6) Local events are missing or generic, (7) There's no integration between the pricing tool and the PMS. The current order leads with 'base rate too low' which is a symptom; pacing is the diagnostic that reveals all the others.",
        ],
    ),
    # ---------- Survivorship-bias quote — add WW2 callback ----------
    (
        "The diagnostic here is",
        "after",
        [
            "[REVF — DEEPEN] Add a one-paragraph callback to the original survivorship-bias example (Abraham Wald, WW2 bombers) before this paragraph. Suggested wording: 'The classic illustration is the WWII bomber problem. Engineers studied returning bombers, mapped where they had been hit, and proposed armoring those spots. Statistician Abraham Wald flipped the question: the planes that did not return were hit somewhere else. Armor the parts of the surviving planes that have no holes — those are the locations that are fatal when struck. Federico's STR version: the listings you can see are the ones that survived their minimum-stay choice. The listings that didn't survive — the ones priced out by their own restrictions — are invisible to you.' Reason: this is a high-citation hook for AEO and is in the brain doc but didn't make the draft.",
        ],
    ),
    # ---------- HowTo-shaped formula ----------
    (
        "If your market is doing an average of five nights and you're offering three nights, you can bump up 20% your rates and offer a 10% discount for stays five nights and longer.",
        "after",
        [
            "[REVF — FORMAT AS HOWTO] Restructure the formula as a 4-step HowTo block (will pair with HowTo schema):",
            "[REVF — FORMAT AS HOWTO] Step 1: Pull the average length of stay for your top 5 comp-set listings (Airbnb listing pages → 'Reviews' tab → date math).",
            "[REVF — FORMAT AS HOWTO] Step 2: If your average is at least 1.5 nights below the market average, set a minimum that beats the market by 1 night (market 5 → you offer 3 or 4).",
            "[REVF — FORMAT AS HOWTO] Step 3: Raise base rates 15–20% to capture the visibility premium (you'll appear in searches competitors are filtered out of).",
            "[REVF — FORMAT AS HOWTO] Step 4: Layer a 10% LOS discount on stays at or above the market average, so longer-stay guests still see a deal and you still beat the rate of the 5-night-minimum competitors. This format is what AI Overviews extract verbatim.",
        ],
    ),
    # ---------- Bookshop / shoulder season quote ----------
    (
        "Ignoring shoulder seasons:",
        "after",
        [
            "[REVF — ADD QUOTE] Insert this Federico quote after the Nashville case study (in the same #3 section): 'My favorite example is a bookshop. If you walk into a bookshop in November and you walk out empty-handed, that bookshop has lost zero dollars — those books are still there in December. If you walk into an empty short-term rental on November 14th, that night is gone forever. Shoulder seasons are perishable inventory inside perishable inventory.' Reason: caps the perishable-inventory thesis, ties shoulder-season urgency to the airline analogy that opens the post, and is a verbatim Federico quote available in the brain doc.",
        ],
    ),
    # ---------- Self-citing FAQ #1 ----------
    (
        "What are the best revenue management companies for short-term rentals?",
        "after",
        [
            "[REVF — SELF-CITE WARNING] This FAQ references a 'companion listicle' / 'category includes specialist firms like RevFactor' that does not yet exist as a published page. Two options: (a) HOLD this FAQ until the listicle blog (Pillar 2) goes live, then publish both together so the link target exists; (b) Soft-rewrite to remove the implicit pointer — replace with: 'The category includes specialist revenue managers (paid daily for pricing/inventory work only), full-service property managers offering revenue management as a bundled service, and independent revenue consultants. The right fit depends on portfolio size, market complexity, and whether the host wants to retain operational control.' We strongly recommend option (a) — launch Pillar 1 + the companion listicle at the same time so this FAQ becomes the in-text bridge.",
        ],
    ),
    # ---------- Single CTA before the FAQ ----------
    (
        "If you take one thing from this guide, take this:",
        "after",
        [
            "[REVF — ADD CTA] Add a single CTA box immediately after this paragraph and before 'About the Author.' Suggested wording: 'If you'd rather have a revenue manager driving — across PriceLabs, your PMS, and your comp set — book a 30-minute strategy call. Flat $320/mo per property, no percentage of revenue, no PriceLabs paid twice.' Button: 'Schedule a Strategy Call → revfactor.io/schedule.' One CTA, end of post, no popups, no mid-content interruptions.",
        ],
    ),
    # ---------- Author byline strengthening ----------
    (
        "Federico Zimerman is the founder of",
        "before",
        [
            "[REVF — STRENGTHEN AUTHOR BIO] Insert one sentence at the start of the bio for E-E-A-T: 'Federico writes a daily revenue management practice into the public record on TikTok (@federicozimerman, ~7,800 followers) and Instagram (@federico.zimerman) and is the only short-term rental revenue manager who has appeared on No Vacancy with Natalie Palmer (Ep. 155), Life of Flow, Catchup with the Carlyles, Craft Stays, and STR Like The Best.' Reason: pins author authority to specific podcasts and follower counts so LLMs can verify the experience claim.",
        ],
    ),
    # ---------- Internal linking ----------
    (
        "The Tactical Playbook: 6 Plays That Move Revenue",
        "before",
        [
            "[REVF — INTERNAL LINKS] When publishing, anchor-link the four pillar names ('Historical Data', 'Inventory Management', 'Forecasting', 'Pricing Strategy') to upcoming dedicated pillar pages. Anchor-link 'PriceLabs', 'Beyond', 'Wheelhouse' to a future tools-comparison post. Anchor-link 'minimum stay rules' and 'length-of-stay discounts' to play-specific pages once they exist. The cluster topology matters more for AI Overviews than the individual page quality.",
        ],
    ),
    # ---------- Schema appendix at the very end ----------
    (
        "When should a host hire a revenue manager?",
        "after",
        [
            "[REVF — APPENDIX: SCHEMA] Suggested JSON-LD schema package for this post — paste the following blocks into <head> as a single combined @graph. The package combines Article + Person + FAQPage + HowTo + DefinedTerm so the post is eligible for rich results in Google Search and AI Overview citations.",
            "[REVF — APPENDIX: SCHEMA] (1) Article + Person — author, datePublished, headline, image, mentions Federico's airline background.",
            "[REVF — APPENDIX: SCHEMA] (2) FAQPage — wraps the 11 FAQ Q/A pairs already in the post (each Question name + acceptedAnswer text).",
            "[REVF — APPENDIX: SCHEMA] (3) HowTo — 'How to use minimum stays as a competitive weapon' (4 steps from Play 4) AND 'How to launch a new STR listing' (Play 5).",
            "[REVF — APPENDIX: SCHEMA] (4) DefinedTerm — 'RevPAR', 'ADR', 'NetRevPAR', 'Pacing', 'Length-of-stay discount', 'Survivorship bias' — gives Google a clean definition graph for AI Overviews.",
            "[REVF — APPENDIX: SCHEMA] Final block: BreadcrumbList — Home > Blog > Revenue Management for Short-Term Rentals.",
            "[REVF — APPENDIX: SCHEMA] The full JSON-LD code is in the companion review doc 'blog-1-draft-review.docx' (Schema appendix). Drop it as a single <script type=\"application/ld+json\"> tag inside <head>.",
        ],
    ),
]


def iter_all_paragraphs(doc):
    """Yield paragraphs from body AND from tables (for the boxed Author + Key Takeaways)."""
    for p in doc.paragraphs:
        yield p
    for tbl in doc.tables:
        for row in tbl.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    yield p


def main():
    doc = Document(SRC)

    # Build a lookup of paragraph index -> insertion list
    paragraphs = list(iter_all_paragraphs(doc))

    # Resolve each anchor to a paragraph index; first substring match wins
    insert_plan = []  # (target_index, before|after, list_of_strings)
    for anchor, pos, blue_lines in INSERTS:
        found = False
        for i, p in enumerate(paragraphs):
            if anchor in (p.text or ""):
                insert_plan.append((i, pos, blue_lines))
                found = True
                break
        if not found:
            print(f"WARN: anchor not found, skipping: {anchor[:80]}...")

    # Sort plan in reverse order so insertions don't shift earlier indexes.
    insert_plan.sort(key=lambda t: (t[0], 0 if t[1] == "before" else 1), reverse=True)

    for idx, pos, lines in insert_plan:
        anchor_para = paragraphs[idx]
        # Insert each line as a new paragraph above or below the anchor.
        # python-docx doesn't have a clean insert_after; use the underlying XML.
        from docx.oxml.ns import qn
        anchor_el = anchor_para._element
        # We insert in normal order so the visible order matches the list.
        new_paras = []
        for line in lines:
            new_p = deepcopy(anchor_el)
            # Wipe runs in the copy
            for r in new_p.findall(qn('w:r')):
                new_p.remove(r)
            # Add a single run with our blue text
            from docx.oxml import OxmlElement
            r = OxmlElement('w:r')
            t = OxmlElement('w:t')
            t.text = line
            t.set(qn('xml:space'), 'preserve')
            rpr = OxmlElement('w:rPr')
            color = OxmlElement('w:color')
            color.set(qn('w:val'), '1A4FBF')
            rpr.append(color)
            i_el = OxmlElement('w:i')
            rpr.append(i_el)
            r.append(rpr)
            r.append(t)
            new_p.append(r)
            new_paras.append(new_p)

        if pos == "before":
            for np in new_paras:
                anchor_el.addprevious(np)
        else:
            for np in reversed(new_paras):
                anchor_el.addnext(np)

    doc.save(DST)
    print(f"Saved feedback docx with {sum(len(b) for _, _, b in insert_plan)} blue paragraphs to {DST}")


if __name__ == "__main__":
    main()
