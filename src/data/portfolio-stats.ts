/**
 * Portfolio stats: SINGLE SOURCE OF TRUTH for site-wide numbers.
 *
 * Update here, then run `python3 scripts/update_portfolio_stats.py` to
 * propagate to MDX/Astro prose that can't import this file directly.
 *
 * Last update: 2026-06-09 (Federico pricing refresh: flat $350, no
 * volume scale; onboarding $150; child listing $50)
 */

export const PORTFOLIO_STATS = {
  properties: 198,
  states: 24,
  markets: 67,
  revparLiftPct: 24, // +24% RevPAR vs comp set
  flatFee: 350, // flat $350/mo per property, 1–5 properties (was $320 sliding to $256)
  onboardingFee: 150, // one-time per property (was $125)
  childListingFee: 50, // child listing add-on, $/mo (was $35)
  enterpriseThreshold: 5, // properties past this point = custom enterprise pricing
} as const;

/**
 * Display strings: used in React/Astro components.
 * MDX prose carries these as literal text and is kept in sync by the
 * update_portfolio_stats.py script.
 */
export const STAT_LABELS = {
  propertiesShort: '198',
  propertiesLong: '198 listings',
  propertiesPhrase: '198 short-term rentals',
  marketsShort: '67',
  marketsLong: '67 markets',
  marketsHero: '67 US-WIDE',
  statesShort: '24',
  statesLong: '24 U.S. states',
  revparLift: '+24%',
  revparLiftPhrase: '+24% RevPAR lift vs. comp set',
  flatFeePhrase: 'Flat $350/month per property',
  flatFeeShort: '$350',
  onboardingPhrase: '$150 one-time onboarding per property',
} as const;
