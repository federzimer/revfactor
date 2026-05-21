"""All campaign configuration — extracted from revfactor_campaign_blueprint.md.

Edit this file to change keywords, ads, or budgets, then re-run deploy_campaigns.py.
The deployer is idempotent: it updates existing campaigns rather than re-creating them.
"""

# Account-level negative keyword lists (applied to all campaigns)
NEGATIVE_LISTS = {
    "Free / cheap / DIY seekers": [
        "free", "cheap", "diy", "do it yourself", "template", "spreadsheet",
        "for free", "free template",
    ],
    "Job / career seekers": [
        "job", "jobs", "career", "careers", "salary", "hiring",
        "consultant jobs", "consultant salary", "consultant career",
        "linkedin", "indeed", "glassdoor", "intern", "internship",
    ],
    "Wrong audience (guests not hosts)": [
        "guest", "stay", "book", "booking", "vacation home",
        "vacation rental for rent", "hotel", "hotels", "motel", "resort",
        "places to stay",
    ],
    "Tutorial / informational": [
        "tutorial", "how to", "what is", "definition", "meaning",
        "course", "training", "certification", "sample resume",
        "examples", "wiki", "wikipedia", "reddit",
    ],
    "Wrong industry": [
        "long term", "long-term", "annual lease", "apartment",
        "commercial", "retail", "office space", "b&b", "bed and breakfast",
    ],
    "Geographic exclusions": [
        "india", "philippines", "kenya", "nigeria", "bali", "dubai", "mexico",
    ],
}

# Ad strength: every RSA needs 3-15 headlines + 2-4 descriptions
# Headlines max 30 chars, descriptions max 90 chars

CAMPAIGNS = [
    # ─────────────────────────────────────────────────────────────────
    {
        "name": "RF — Search — Tool Intent",
        "daily_budget_usd": 16.00,  # ~$480/mo
        "bid_strategy": "MANUAL_CPC",
        "default_max_cpc_usd": 7.00,
        "final_url_default": "https://www.revfactor.io/airbnb-pricing-strategy",
        # DTR (msg=tool) + Google ValueTrack params for full GA4/Clarity
        # attribution. {keyword} = literal search query, {campaignid}/{adgroupid}/
        # {matchtype} = numeric IDs for joining with Google Ads UI exports,
        # {network}/{device} = standard tracking knobs. GA4 + Clarity
        # auto-capture utm_*.
        "final_url_suffix": (
            "msg=tool"
            "&utm_source=google&utm_medium=cpc&utm_campaign=tool_intent"
            "&utm_term={keyword}&utm_content={adgroupid}"
            "&gad_campaignid={campaignid}&gad_adgroupid={adgroupid}"
            "&gad_matchtype={matchtype}&gad_device={device}&gad_network={network}"
        ),
        "ad_groups": [
            {
                "name": "airbnb-pricing-tool-exact",
                "max_cpc_usd": 9.00,
                "keywords": [
                    ("airbnb pricing tool", "EXACT"),
                    ("best airbnb pricing tool", "EXACT"),
                    ("airbnb dynamic pricing tool", "EXACT"),
                    ("airbnb smart pricing tool", "EXACT"),
                    ("dynamic pricing tool airbnb", "EXACT"),
                    ("vrbo pricing tool", "EXACT"),
                ],
            },
            {
                "name": "airbnb-pricing-tool-phrase",
                "max_cpc_usd": 5.00,
                "keywords": [
                    ("airbnb pricing software", "PHRASE"),
                    ("vacation rental pricing tool", "PHRASE"),
                    ("str pricing software", "PHRASE"),
                    ("airbnb pricing optimization", "PHRASE"),
                    ("vrbo pricing software", "PHRASE"),
                ],
            },
            {
                "name": "dynamic-pricing-tools-broad",
                "max_cpc_usd": 4.00,
                "keywords": [
                    ("dynamic pricing short term rental", "BROAD"),
                    ("airbnb revenue management software", "BROAD"),
                    ("str pricing optimization", "BROAD"),
                ],
            },
        ],
        "rsa": {
            # 2026-04-28 rewrite — loss-framed, dollar-anchored, question-led
            # variants. Matches the landing-page hero ("Your pricing tool is
            # leaving 18% on the table.") so the message-match is consistent
            # from search → ad → page → call.
            "headlines": [
                # Loss framing (highest CTR for cold traffic)
                "Your Tool's Leaving 18%",
                "Pricing Tool Missing Money?",
                "Algorithm Alone = 24% Lost",
                # Question hook
                "Is Your Airbnb Underpriced?",
                "Tool Set Wrong? Talk Now.",
                # Dollar / specific lift
                "Add 18% to STR Revenue",
                "Hosts See +20% to +75%",
                # Direct match (head-term capture)
                "Beyond Airbnb Pricing Tools",
                "Real STR Revenue Strategist",
                # Authority + offer
                "Talk to Federico Direct",
                "Free 30-Min Strategy Call",
                "Real STR Strategist · $320/mo",
                # Differentiator
                "Pricing Tool + Strategist",
                "We Extract What Tools Miss",
                "Outperform the Comp Set",
            ],
            "descriptions": [
                "Your pricing tool sets numbers. We build the strategy that makes them work. +24% lift.",
                "Algorithms execute. We strategize. Pair your tool with a real human. Free 30-min call.",
                "Hosts on PriceLabs / Wheelhouse / Beyond see +24% lift after adding strategy. $320/mo.",
                "Talk to Federico — a real STR revenue manager — free for 30 min. Walk away with 3 wins.",
            ],
            "path1": "strategy",
            "path2": "consult",
        },
    },
    # ─────────────────────────────────────────────────────────────────
    {
        "name": "RF — Search — Consultant Intent",
        "daily_budget_usd": 14.00,  # ~$420/mo
        "bid_strategy": "MANUAL_CPC",
        "default_max_cpc_usd": 5.00,
        "final_url_default": "https://www.revfactor.io/short-term-rental-consultant",
        "final_url_suffix": (
            "msg=consultant"
            "&utm_source=google&utm_medium=cpc&utm_campaign=consultant_intent"
            "&utm_term={keyword}&utm_content={adgroupid}"
            "&gad_campaignid={campaignid}&gad_adgroupid={adgroupid}"
            "&gad_matchtype={matchtype}&gad_device={device}&gad_network={network}"
        ),
        "ad_groups": [
            {
                "name": "airbnb-consultant-exact",
                # Live Google Keyword Planner 2026-04-28: airbnb consultant 170/mo,
                # short term rental consultant 70/mo, airbnb consultant near me 20/mo,
                # vacation rental consultant 30/mo, str consultant 10/mo.
                # Dropped: airbnb revenue consultant + vacation rental revenue consultant
                # (both 0 vol — would never serve impressions).
                "max_cpc_usd": 6.00,
                "keywords": [
                    ("short term rental consultant", "EXACT"),
                    ("short-term rental consultant", "EXACT"),
                    ("airbnb consultant", "EXACT"),
                    ("airbnb consultant near me", "EXACT"),
                    ("vacation rental consultant", "EXACT"),
                    ("str consultant", "EXACT"),
                ],
            },
            {
                "name": "str-consultant-phrase",
                # Live data: airbnb revenue management 70/mo, vacation rental revenue
                # management 90/mo, str revenue management 20/mo. Dropped airbnb pricing
                # consultant (0 vol). Note: high-bid range goes up to $73-91 on these
                # phrase terms — our $4 cap will limit impressions, which is intentional.
                "max_cpc_usd": 4.00,
                "keywords": [
                    ("airbnb revenue management", "PHRASE"),
                    ("vacation rental revenue management", "PHRASE"),
                    ("str revenue management", "PHRASE"),
                    ("short term rental revenue management", "PHRASE"),
                ],
            },
            {
                "name": "vacation-rental-consultant-broad",
                "max_cpc_usd": 3.50,
                "keywords": [
                    ("airbnb expert", "BROAD"),
                    ("str strategist", "BROAD"),
                    ("vacation rental expert", "BROAD"),
                ],
            },
        ],
        "rsa": {
            # 2026-04-28 rewrite: dropped 6 generic/jargon headlines for question-,
            # pain-, and dollar-anchored variants. Each variant uses a different
            # angle so Google can rotate and A/B-test which patterns pull clicks.
            "headlines": [
                # Direct match (head-term capture)
                "Short-Term Rental Consultant",
                "Airbnb Revenue Consulting",
                "Vacation Rental Revenue Expert",
                # Question hooks (pattern-interrupt)
                "Is Your Airbnb Underpriced?",
                "Pricing Tool Missing Money?",
                # Specific lift / dollar (concrete claim)
                "Add 18% to STR Revenue",
                "Hosts See +20% to +75% Lift",
                # Pain / loss framing
                "Most STRs Lose Real Revenue",
                "STR Hosts: Earn 18% More",
                # Authority + offer
                "Talk to Federico Direct",
                "Free 30-Min Strategy Call",
                "Real STR Strategist · $320/mo",
                # Differentiator vs. tools
                "Beyond DIY Pricing",
                "Top STR Performers +20-75%",
                "Most Consultants Disappear",
            ],
            "descriptions": [
                "Work 1:1 with an STR revenue consultant. +24% lift vs comp set. $320/mo per property.",
                "Most consultants audit and disappear. RevFactor partners ongoing — strategy + tracking.",
                "Founder-led STR consulting. Hosts see +20-75% revenue lift. Free 30-min strategy call.",
                "1 property or 50, we build strategy for each. $320/mo flat — no revenue-share gotchas.",
            ],
            "path1": "consultant",
            "path2": "strategy",
        },
    },
    # ─────────────────────────────────────────────────────────────────
    {
        "name": "RF — Search — Competitor Conquest",
        "daily_budget_usd": 10.00,  # ~$300/mo
        "bid_strategy": "MANUAL_CPC",
        "default_max_cpc_usd": 3.00,
        "final_url_default": "https://www.revfactor.io/vs/pricelabs",
        "final_url_suffix": (
            "msg=conquest"
            "&utm_source=google&utm_medium=cpc&utm_campaign=conquest"
            "&utm_term={keyword}&utm_content={adgroupid}"
            "&gad_campaignid={campaignid}&gad_adgroupid={adgroupid}"
            "&gad_matchtype={matchtype}&gad_device={device}&gad_network={network}"
        ),
        "ad_groups": [
            {
                "name": "pricelabs-conquest",
                "max_cpc_usd": 5.00,
                "final_url": "https://www.revfactor.io/vs/pricelabs",
                "keywords": [
                    ("pricelabs", "EXACT"),
                    ("pricelabs alternative", "EXACT"),
                    ("pricelabs vs", "PHRASE"),
                    ("pricelabs review", "PHRASE"),
                    ("pricelabs reviews", "PHRASE"),
                    ("pricelabs pricing", "PHRASE"),
                ],
            },
            {
                "name": "wheelhouse-conquest",
                "max_cpc_usd": 5.00,
                "final_url": "https://www.revfactor.io/short-term-rental-consultant",
                "keywords": [
                    ("wheelhouse pricing", "EXACT"),
                    ("wheelhouse alternative", "EXACT"),
                    ("wheelhouse pricing review", "PHRASE"),
                ],
            },
            {
                "name": "beyond-pricing-conquest",
                "max_cpc_usd": 5.00,
                "final_url": "https://www.revfactor.io/short-term-rental-consultant",
                "keywords": [
                    ("beyond pricing", "EXACT"),
                    ("beyond pricing alternative", "EXACT"),
                    ("beyond pricing review", "PHRASE"),
                ],
            },
        ],
        "rsa": {
            # IMPORTANT: no competitor trademarks in headlines/descriptions.
            # 2026-04-28 rewrite — loss-framed copy that targets shoppers
            # already on a pricing tool: "you have a tool, but you're still
            # short — here's what's missing."
            "headlines": [
                # Loss framing (anchored to the 18% stat)
                "Tool Alone = 18% Lost",
                "Already Pricing? Still Short.",
                "Most STRs Lose 18% Revenue",
                # Question hook
                "Is Your Tool Enough?",
                "Pricing Tool Missing Money?",
                # Specific lift / direct-address
                "Add 24% Above Your Tool",
                "Hosts See +20% to +75%",
                "STR Hosts: Earn 18% More",
                # Differentiator (compliance-safe)
                "Strategy Your Tool Can't Ship",
                "Real Humans Behind Pricing",
                "Pricing Tools + Strategist",
                # Authority + offer
                "Talk to Federico Direct",
                "Free 30-Min Strategy Review",
                "Real STR Strategist · $320/mo",
                "Founder-Led Revenue Strategy",
            ],
            "descriptions": [
                "Already on a pricing tool? You're 24% short. We extract what your algorithm misses.",
                "Tools set prices. We build the strategy that makes them work. +24% lift across portfolio.",
                "Talk to Federico — real STR revenue strategist. Free 30 min. Works alongside any tool.",
                "Pair your pricing tool with a real strategist. Comp tracking + calendar. $320/mo flat.",
            ],
            "path1": "compare",
            "path2": "strategy",
        },
    },
]

# Sitelinks (account-level, applied to all campaigns)
SITELINKS = [
    {
        "text": "See Our Process",
        "final_url": "https://www.revfactor.io/#process",
        "description1": "How RevFactor builds revenue",
        "description2": "Step-by-step strategy approach",
    },
    {
        "text": "Meet The Founder",
        "final_url": "https://www.revfactor.io/about",
        "description1": "Founder-led STR consulting",
        "description2": "From Federico Zimerman",
    },
    {
        "text": "Schedule Strategy Call",
        "final_url": "https://www.revfactor.io/#schedule",
        "description1": "Free 30-minute call",
        "description2": "Talk to a strategist",
    },
    {
        "text": "The +24% Story",
        "final_url": "https://www.revfactor.io/blog/dynamic-pricing-str-beginners-guide",
        "description1": "Why strategy beats algorithm",
        "description2": "Documented revenue lift",
    },
]

CALLOUTS = [
    "+24% vs comp set",
    "$320/mo per property",
    "Free 30-min call",
    "Founder-led service",
    "Top hosts +20-75% lift",
    "Volume discounts",
]

# Geographic targeting: US only
LOCATION_GEO_TARGETS = ["2840"]  # Google's geo target ID for United States

# Language targeting: English
LANGUAGE_CRITERIA = ["1000"]  # English
