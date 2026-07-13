// Shared helper — forward captured leads to the Blackbird Hub pipeline.
// Contract from Gaston's "Pipeline Integration" PDF (2026-07-13):
//   POST https://hub.revfactor.io/api/webhooks/new-lead
//   Headers: Content-Type: application/json, x-webhook-secret: HUB_WEBHOOK_SECRET
//   Body: { email (required), full_name?, project_name?, phone?, lead_source?,
//           scheduled_date?, timezone?, location?, description?, external_ref?,
//           attribution?: { canonical utm/click-id keys + any extra } }
//   201 = created, 200 deduped=true = active lead already exists, 400/401 = bad input/secret.
//
// Attribution is sent as a nested object (Gaston's preferred structured path,
// replacing the old description=blob). The Hub promotes ten canonical keys to
// their own columns (utm_source, utm_medium, utm_campaign, utm_content,
// utm_term, gclid, msclkid, fbclid, referrer, landing_page) and preserves any
// other key (gbraid, wbraid, msg, has_property, is_pm, properties, portfolio, …)
// in attribution_extra — so we forward everything and nothing is dropped.
//
// Best-effort by design: never throws, ~5s timeout, failures logged only —
// the visitor's form submission must never block on the Hub being up.
//
// Required env var (Vercel project settings): HUB_WEBHOOK_SECRET

const HUB_ENDPOINT = 'https://hub.revfactor.io/api/webhooks/new-lead';

export interface HubLead {
  email: string;
  lead_source: string;
  full_name?: string;
  project_name?: string;
  phone?: string;
  location?: string;
  description?: string;
  timezone?: string;
  external_ref?: string;
  attribution?: Record<string, string>;
}

// Canonical attribution keys the Hub promotes to columns. The client stores the
// landing URL under `landing`; the Hub's canonical key is `landing_page`, so we
// remap it here. All other keys pass through verbatim (extras -> attribution_extra).
const CANONICAL = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'msclkid', 'fbclid', 'referrer', 'landing_page'];
const PASSTHROUGH_EXTRA = ['msg', 'gbraid', 'wbraid', 'gad_source', 'page'];

// Build the structured attribution object from the client blob (sessionStorage
// 'rf_attr') plus any server-known extras (qualifier answers, page URL).
// Allowlisted keys only, values length-capped — never trust the browser.
export function buildAttribution(
  raw: unknown,
  extra?: Record<string, string | number | null | undefined>,
): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  const src = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  // client blob stores landing URL as `landing` -> canonical `landing_page`
  if (typeof src.landing === 'string' && src.landing.trim() && !src.landing_page) {
    out.landing_page = String(src.landing).trim().slice(0, 300);
  }
  for (const k of [...CANONICAL, ...PASSTHROUGH_EXTRA]) {
    const v = src[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 300);
  }
  // server-known extras (qualifiers, page) — kept in attribution_extra by the Hub
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== null && v !== undefined && String(v).trim()) out[k] = String(v).trim().slice(0, 300);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export async function forwardLeadToHub(lead: HubLead): Promise<void> {
  const secret = process.env.HUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('hub-lead: HUB_WEBHOOK_SECRET not set; skipped forward');
    return;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const r = await fetch(HUB_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify(lead),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (r.status === 201 || r.status === 200) {
      return; // created or deduped — both fine
    }
    const text = await r.text().catch(() => '');
    console.error('hub-lead: forward failed', r.status, text.slice(0, 300));
  } catch (e) {
    console.error('hub-lead: forward threw', e);
  }
}
