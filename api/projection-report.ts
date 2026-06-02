export const config = { runtime: 'edge' };

const AIRROI_BASE = 'https://api.airroi.com';

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

const STATE_CODES = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code]),
) as Record<string, string>;

type AirRoiSummary = {
  market?: {
    country?: string;
    region?: string;
    locality?: string;
    district?: string | null;
  };
  occupancy?: number;
  average_daily_rate?: number;
  rev_par?: number;
  revenue?: number;
  booking_lead_time?: number;
  length_of_stay?: number;
  min_nights?: number;
  active_listings_count?: number;
  error?: string;
};

type TimeSeriesRow = {
  date: string;
  avg?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
};

type TimeSeriesResponse = {
  market?: AirRoiSummary['market'];
  results?: TimeSeriesRow[];
  error?: string;
};

type PacingRow = {
  date: string;
  booked_count?: number;
  available_count?: number;
  booked_rate_avg?: number;
  available_rate_avg?: number;
  fill_rate?: number;
};

type PacingResponse = {
  market?: AirRoiSummary['market'];
  results?: PacingRow[];
  error?: string;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const apiKey = process.env.AIRROI_API_KEY;
  if (!apiKey) {
    return json({ error: 'missing_airroi_api_key' }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const address = String(body?.address || '').trim();
  const parsed = parseMarket(address, body?.city, body?.state);
  if (!parsed) {
    return json({
      error: 'market_parse_failed',
      message: 'Use an address that includes city and state, for example "123 Main St, Gatlinburg, TN".',
    }, 400);
  }

  const market = {
    country: 'US',
    region: parsed.region,
    locality: parsed.locality,
  };

  const [summary, adrHistory, occupancyHistory, pacing] = await Promise.all([
    airroi<AirRoiSummary>(apiKey, '/markets/summary', {
      market,
      num_months: 12,
      currency: 'native',
    }),
    airroi<TimeSeriesResponse>(apiKey, '/markets/metrics/average-daily-rate', {
      market,
      num_months: 36,
      currency: 'native',
    }),
    airroi<TimeSeriesResponse>(apiKey, '/markets/metrics/occupancy', {
      market,
      num_months: 36,
    }),
    airroi<PacingResponse>(apiKey, '/markets/metrics/future/pacing', {
      market,
      currency: 'native',
    }),
  ]);

  const airroiError = [summary, adrHistory, occupancyHistory, pacing].find(
    (item) => item && typeof item === 'object' && 'error' in item && item.error,
  );
  if (airroiError) {
    return json({ error: 'airroi_request_failed', detail: airroiError.error }, 502);
  }

  const report = buildReport({
    address,
    brand: sanitizeBrand(body?.brand),
    market,
    parsed,
    summary,
    adrHistory,
    occupancyHistory,
    pacing,
  });

  return json({ ok: true, report });
}

async function airroi<T>(apiKey: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${AIRROI_BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }

  if (!response.ok) {
    return { error: payload?.error || `AirROI returned ${response.status}` } as T;
  }

  return payload as T;
}

function parseMarket(address: string, cityInput?: string, stateInput?: string) {
  const explicitCity = cleanText(cityInput);
  const explicitState = normalizeState(stateInput);
  if (explicitCity && explicitState) {
    return {
      locality: explicitCity,
      stateCode: explicitState,
      region: STATE_NAMES[explicitState],
    };
  }

  if (!address) return null;

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const stateCode = normalizeState(parts[parts.length - 1]);
    const locality = cleanText(parts[parts.length - 2]);
    if (locality && stateCode) {
      return {
        locality,
        stateCode,
        region: STATE_NAMES[stateCode],
      };
    }
  }

  const match = address.match(/([A-Za-z .'-]+)\s+([A-Z]{2})(?:\s+\d{5})?\s*$/);
  if (match) {
    const locality = cleanText(match[1]);
    const stateCode = normalizeState(match[2]);
    if (locality && stateCode) {
      return {
        locality,
        stateCode,
        region: STATE_NAMES[stateCode],
      };
    }
  }

  return null;
}

function normalizeState(value?: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const token = raw
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '')
    .replace(/[^a-zA-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const upper = token.slice(0, 2).toUpperCase();
  if (STATE_NAMES[upper]) return upper;

  return STATE_CODES[token.toLowerCase()] || null;
}

function cleanText(value?: unknown) {
  const cleaned = String(value || '')
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((part) => {
      if (part.length <= 2 && part === part.toUpperCase()) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

function sanitizeBrand(value: unknown) {
  const brand = String(value || 'dual').toLowerCase();
  if (brand === 'blackbird' || brand === 'revfactor' || brand === 'dual') return brand;
  return 'dual';
}

function buildReport(input: {
  address: string;
  brand: string;
  market: { country: string; region: string; locality: string };
  parsed: { locality: string; region: string; stateCode: string };
  summary: AirRoiSummary;
  adrHistory: TimeSeriesResponse;
  occupancyHistory: TimeSeriesResponse;
  pacing: PacingResponse;
}) {
  const adrRows = input.adrHistory.results || [];
  const occRows = input.occupancyHistory.results || [];
  const pacingRows = input.pacing.results || [];
  const summaryAdr = num(input.summary.average_daily_rate);
  const summaryOcc = num(input.summary.occupancy);
  const last12Adr = trailingAverage(adrRows, 'avg', 12);
  const last12Occ = trailingAverage(occRows, 'avg', 12);
  const p25Adr = trailingAverage(adrRows, 'p25', 12) || (summaryAdr ? summaryAdr * 0.82 : 0);
  const p75Adr = trailingAverage(adrRows, 'p75', 12) || (summaryAdr ? summaryAdr * 1.18 : 0);
  const baseAdr = summaryAdr || last12Adr || 0;
  const baseOcc = clamp(summaryOcc || last12Occ || 0, 0.15, 0.9);
  const marketRevenue = input.summary.revenue || annualRevenue(baseAdr, baseOcc);

  const scenarios = [
    {
      label: 'Conservative',
      adr: roundCurrency(p25Adr || baseAdr * 0.82),
      occupancy: roundRate(clamp(baseOcc - 0.06, 0.15, 0.85)),
      note: 'Lower-quartile ADR with softer occupancy.',
    },
    {
      label: 'Market Base',
      adr: roundCurrency(baseAdr),
      occupancy: roundRate(baseOcc),
      note: 'Current AirROI market ADR and occupancy.',
    },
    {
      label: 'Managed Upside',
      adr: roundCurrency(Math.max(p75Adr || 0, baseAdr * 1.1)),
      occupancy: roundRate(clamp(baseOcc + 0.04, 0.18, 0.88)),
      note: 'Upper-quartile ADR with tighter revenue-management execution.',
    },
  ].map((scenario) => ({
    ...scenario,
    monthlyRevenue: roundCurrency(annualRevenue(scenario.adr, scenario.occupancy) / 12),
    annualRevenue: roundCurrency(annualRevenue(scenario.adr, scenario.occupancy)),
  }));

  const monthlyProjection = nextTwelveMonths().map((target) => {
    const adr = seasonalAverage(adrRows, target.month, 'avg') || baseAdr;
    const occ = seasonalAverage(occRows, target.month, 'avg') || baseOcc;
    const revenue = adr * occ * target.days;
    return {
      label: target.label,
      adr: roundCurrency(adr),
      occupancy: roundRate(occ),
      projectedRevenue: roundCurrency(revenue),
    };
  });

  const next90Pacing = windowPacing(pacingRows, 90);
  const totalBase = monthlyProjection.reduce((sum, month) => sum + month.projectedRevenue, 0);
  const totalUpside = totalBase * 1.1;

  return {
    generatedAt: new Date().toISOString(),
    requestedAddress: input.address,
    brand: input.brand,
    market: {
      locality: input.parsed.locality,
      region: input.parsed.region,
      stateCode: input.parsed.stateCode,
      label: `${input.parsed.locality}, ${input.parsed.stateCode}`,
      airroi: input.summary.market || input.market,
    },
    headline: {
      projectedAnnualRevenue: roundCurrency(totalBase || marketRevenue),
      managedUpsideAnnualRevenue: roundCurrency(totalUpside || scenarios[2].annualRevenue),
      projectedMonthlyRevenue: roundCurrency((totalBase || marketRevenue) / 12),
      activeListings: roundWhole(input.summary.active_listings_count),
    },
    marketMetrics: {
      averageDailyRate: roundCurrency(baseAdr),
      occupancy: roundRate(baseOcc),
      revPar: roundCurrency(input.summary.rev_par || baseAdr * baseOcc),
      airroiRevenue: roundCurrency(input.summary.revenue || 0),
      bookingLeadTime: roundOne(input.summary.booking_lead_time),
      lengthOfStay: roundOne(input.summary.length_of_stay),
      minNights: roundOne(input.summary.min_nights),
      activeListings: roundWhole(input.summary.active_listings_count),
    },
    scenarios,
    monthlyProjection,
    next90Pacing,
    insights: buildInsights(baseAdr, baseOcc, next90Pacing, scenarios),
    assumptions: [
      'Projection is market-level because the available AirROI contract here accepts city and state market inputs, not a parcel-level property profile.',
      'Revenue math uses ADR x occupancy x available nights before owner-specific fees, taxes, channel mix, maintenance downtime, and property-level restrictions.',
      'Managed upside is an internal planning range, not a guarantee. Tighten it after bedroom count, amenities, review quality, comp set, and owner constraints are known.',
    ],
    sources: [
      'AirROI /markets/summary, 12-month market summary',
      'AirROI /markets/metrics/average-daily-rate, 36-month ADR history',
      'AirROI /markets/metrics/occupancy, 36-month occupancy history',
      'AirROI /markets/metrics/future/pacing, forward pacing where available',
    ],
  };
}

function trailingAverage(rows: TimeSeriesRow[], field: keyof TimeSeriesRow, count: number) {
  const values = rows
    .slice(-count)
    .map((row) => num(row[field]))
    .filter((value) => value > 0);
  return average(values);
}

function seasonalAverage(rows: TimeSeriesRow[], month: number, field: keyof TimeSeriesRow) {
  const values = rows
    .filter((row) => {
      const parsed = new Date(`${row.date}T00:00:00Z`);
      return parsed.getUTCMonth() + 1 === month;
    })
    .map((row) => num(row[field]))
    .filter((value) => value > 0);
  return average(values);
}

function windowPacing(rows: PacingRow[], days: number) {
  if (!rows.length) return null;
  const now = new Date();
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + days);

  const windowRows = rows.filter((row) => {
    const day = new Date(`${row.date}T00:00:00Z`);
    return day >= startOfDayUtc(now) && day <= end;
  });

  if (!windowRows.length) return null;

  return {
    bookedAdr: roundCurrency(average(windowRows.map((row) => num(row.booked_rate_avg)).filter(Boolean))),
    availableAdr: roundCurrency(average(windowRows.map((row) => num(row.available_rate_avg)).filter(Boolean))),
    fillRate: roundRate(average(windowRows.map((row) => num(row.fill_rate)).filter(Boolean))),
    bookedNightsAvg: roundWhole(average(windowRows.map((row) => num(row.booked_count)).filter(Boolean))),
    availableNightsAvg: roundWhole(average(windowRows.map((row) => num(row.available_count)).filter(Boolean))),
    days: windowRows.length,
  };
}

function buildInsights(baseAdr: number, baseOcc: number, pacing: ReturnType<typeof windowPacing>, scenarios: any[]) {
  const insights = [
    `Market base is ${formatCurrency(baseAdr)} ADR at ${formatPercent(baseOcc)} occupancy.`,
    `The internal managed-upside case implies ${formatCurrency(scenarios[2].annualRevenue)} in annualized revenue before property-specific adjustments.`,
  ];

  if (pacing?.availableAdr && pacing?.bookedAdr) {
    const spread = pacing.availableAdr - pacing.bookedAdr;
    if (Math.abs(spread) >= 10) {
      insights.push(`Forward available ADR is ${formatCurrency(Math.abs(spread))} ${spread > 0 ? 'above' : 'below'} booked ADR over the next ${pacing.days} days.`);
    } else {
      insights.push(`Booked and available ADR are closely aligned over the next ${pacing.days} days.`);
    }
  }

  return insights;
}

function nextTwelveMonths() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1));
    const month = date.getUTCMonth() + 1;
    const days = new Date(Date.UTC(date.getUTCFullYear(), month, 0)).getUTCDate();
    return {
      label: date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      month,
      days,
    };
  });
}

function annualRevenue(adr: number, occupancy: number) {
  return adr * occupancy * 365;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function num(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundCurrency(value: number) {
  return Math.round(num(value));
}

function roundWhole(value: unknown) {
  return Math.round(num(value));
}

function roundRate(value: number) {
  return Math.round(num(value) * 1000) / 1000;
}

function roundOne(value: unknown) {
  const number = num(value);
  return number ? Math.round(number * 10) / 10 : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
