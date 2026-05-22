/**
 * Portfolio stats — SINGLE SOURCE OF TRUTH for site-wide numbers.
 *
 * Update here, then run `python3 scripts/update_portfolio_stats.py` to
 * propagate to MDX/Astro prose that can't import this file directly.
 *
 * Last update: 2026-05-22 (FIFA launch session)
 */

export const PORTFOLIO_STATS = {
  properties: 198,
  states: 24,
  markets: 67,
  revparLiftPct: 24, // +24% RevPAR vs comp set
  flatFeeBase: 320,
  flatFeeScale: 256,
  onboardingFee: 125,
} as const;

/**
 * Display strings — used in React/Astro components.
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
} as const;
