// LOCAL Astro endpoint (runs under `astro dev`) that turns a pasted Airbnb
// listing into a real AirROI-backed report for the Revenue Check live path.
// Mirrors the data the existing LiveReportPreview renders — property identity,
// trailing-12-month performance, comp set, ratings, booking settings, and
// market signals — so the report can show real numbers instead of placeholders.
//
// Local-first: reads import.meta.env.AIRROI_API_KEY from the gitignored .env.
// Not wired to Fede's originals; consumed by the local copy of the flow.
import type { APIRoute } from 'astro';

export const prerender = false;

const AIRROI_BASE = 'https://api.airroi.com';

// Fede's approved portfolio-average revenue lift (2026-05-21 call: "24 is a good
// number"). Kept as a labeled assumption, not a per-listing guarantee.
const REVFACTOR_LIFT_PCT = 0.24;

type AnyObj = Record<string, any>;

function parseListingId(input: string): string | null {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (/^\d{6,}$/.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const room = url.pathname.match(/\/rooms\/(\d+)/i);
  if (room?.[1]) return room[1];
  const hosting = url.pathname.match(/\/hosting\/listings\/(?:editor\/)?(\d+)/i);
  if (hosting?.[1]) return hosting[1];
  return null;
}

async function airroiGet<T>(apiKey: string, path: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const res = await fetch(`${AIRROI_BASE}${path}?${qs}`, {
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }
  if (!res.ok) return { error: payload?.error || `AirROI returned ${res.status}` } as T;
  return payload as T;
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.AIRROI_API_KEY || process.env.AIRROI_API_KEY;
  if (!apiKey) return json({ error: 'missing_airroi_api_key' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const id = parseListingId(body?.listingId || body?.listingUrl || '');
  if (!id) {
    return json({ error: 'invalid_listing', message: 'Provide a public Airbnb listing URL or numeric id.' }, 400);
  }

  const subjectResp = await airroiGet<AnyObj>(apiKey, '/listings', { id });
  if (subjectResp?.error || !subjectResp?.listing_info) {
    return json({ error: 'listing_lookup_failed', detail: subjectResp?.error || 'no listing data' }, 502);
  }

  const loc = subjectResp.location_info || {};
  const prop = subjectResp.property_details || {};
  const comparablesResp = await airroiGet<AnyObj>(apiKey, '/listings/comparables', {
    latitude: loc.latitude,
    longitude: loc.longitude,
    bedrooms: prop.bedrooms ?? 0,
    baths: prop.baths ?? 0,
    guests: prop.guests ?? 0,
  });

  const comps: AnyObj[] = Array.isArray(comparablesResp?.listings) ? comparablesResp.listings : [];
  const report = buildReport(id, subjectResp, comps);
  return json({ ok: true, report });
};

function buildReport(id: string, subject: AnyObj, rawComps: AnyObj[]) {
  const info = subject.listing_info || {};
  const host = subject.host_info || {};
  const loc = subject.location_info || {};
  const prop = subject.property_details || {};
  const booking = subject.booking_settings || {};
  const ratings = subject.ratings || {};
  const perf = subject.performance_metrics || {};

  // Comps exclude the subject itself.
  const comps = rawComps.filter((c) => String(c?.listing_info?.listing_id) !== String(id));
  const compPerf = comps.map((c) => c.performance_metrics || {});
  const compRevenue = avg(compPerf.map((p) => num(p.ttm_revenue)).filter((v) => v > 0));
  const compAdr = avg(compPerf.map((p) => num(p.ttm_avg_rate)).filter((v) => v > 0));
  const compOcc = avg(compPerf.map((p) => num(p.ttm_occupancy)).filter((v) => v > 0));
  const compMinNights = avg(comps.map((c) => num(c?.booking_settings?.min_nights)).filter((v) => v > 0));

  const subjRevenue = num(perf.ttm_revenue);
  const lift = Math.round(subjRevenue * REVFACTOR_LIFT_PCT);
  const outperformPct = compRevenue > 0 ? Math.round((subjRevenue / compRevenue - 1) * 100) : 0;

  const amenities: string[] = Array.isArray(prop.amenities) ? prop.amenities : [];
  const topAmenities = pickTopAmenities(amenities);

  return {
    generatedAt: new Date().toISOString(),
    listingId: id,
    listingUrl: `https://www.airbnb.com/rooms/${id}`,
    property: {
      name: info.listing_name || 'Your listing',
      coverPhoto: info.cover_photo_url || '',
      type: info.listing_type || '',
      bedrooms: num(prop.bedrooms),
      beds: num(prop.beds),
      baths: num(prop.baths),
      guests: num(prop.guests),
      locality: loc.locality || '',
      region: loc.region || '',
      locationLabel: [loc.locality, loc.region].filter(Boolean).join(', '),
      superhost: !!host.superhost,
      guestFavorite: !!info.guest_favorite,
      topAmenities,
    },
    ratings: {
      overall: num(ratings.rating_overall),
      reviews: num(ratings.num_reviews),
      cleanliness: num(ratings.rating_cleanliness),
      communication: num(ratings.rating_communication),
      location: num(ratings.rating_location),
      value: num(ratings.rating_value),
    },
    booking: {
      instantBook: booking.instant_book === true ? true : booking.instant_book === false ? false : null,
      minNights: num(booking.min_nights),
      cancellation: booking.cancellation_policy || '',
    },
    performance: {
      annualRevenue: Math.round(subjRevenue),
      adr: Math.round(num(perf.ttm_avg_rate)),
      occupancy: round3(num(perf.ttm_occupancy)),
      revpar: Math.round(num(perf.ttm_revpar)),
      avgMinNights: round1(num(perf.ttm_avg_min_nights)),
    },
    comps: {
      count: comps.length,
      avgRevenue: Math.round(compRevenue),
      avgAdr: Math.round(compAdr),
      avgOccupancy: round3(compOcc),
      avgMinNights: round1(compMinNights),
    },
    opportunity: {
      liftPct: REVFACTOR_LIFT_PCT,
      annualLift: lift,
      monthlyLift: Math.round(lift / 12),
      projectedAnnual: Math.round(subjRevenue + lift),
      outperformPct, // real subject-vs-comp delta (can be negative)
    },
    disclaimer:
      'Estimates derived from public Airbnb listing data and AirROI market signals. Not a guarantee of future revenue; actual results vary by property, seasonality, demand, and execution.',
  };
}

function pickTopAmenities(amenities: string[]): string[] {
  const priority = ['Hot tub', 'Pool', 'View', 'Lake', 'Waterfront', 'EV charger', 'Fireplace', 'Sauna', 'Pet', 'Wifi'];
  const found: string[] = [];
  for (const p of priority) {
    const hit = amenities.find((a) => a.toLowerCase().includes(p.toLowerCase()));
    if (hit && !found.includes(hit)) found.push(hit);
    if (found.length >= 3) break;
  }
  return found.length ? found : amenities.slice(0, 3);
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round1(v: number) { return Math.round(num(v) * 10) / 10; }
function round3(v: number) { return Math.round(num(v) * 1000) / 1000; }

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
