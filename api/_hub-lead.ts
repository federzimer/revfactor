// Shared helper — forward captured leads to the Blackbird Hub pipeline.
// Spec from Gaston (2026-07-09 email, "Quick Question for Business Listings" thread):
//   POST https://hub.revfactor.io/api/webhooks/new-lead
//   Headers: Content-Type: application/json, x-webhook-secret: HUB_WEBHOOK_SECRET
//   Body: { email (required), lead_source, full_name?, phone?, location?, description?, timezone? }
//   201 = created, 200 deduped=true = active lead already exists, 400/401 = bad input/secret.
//
// Best-effort by design: never throws, ~5s timeout, failures are logged only —
// the visitor's form submission must never block on the Hub being up.
//
// Required env var (Vercel project settings): HUB_WEBHOOK_SECRET

const HUB_ENDPOINT = 'https://hub.revfactor.io/api/webhooks/new-lead';

export interface HubLead {
  email: string;
  lead_source: string;
  full_name?: string;
  phone?: string;
  location?: string;
  description?: string;
  timezone?: string;
}

// Sanitize the client-supplied attribution blob (sessionStorage 'rf_attr',
// set by the BaseLayout inline script) into a compact "k=v; k=v" string.
// Allowlisted keys only, values length-capped — never trust the browser.
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'msclkid', 'msg', 'referrer', 'landing'];

export function formatAttribution(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const parts: string[] = [];
  for (const k of ATTR_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim()) {
      parts.push(`${k}=${v.trim().slice(0, 200)}`);
    }
  }
  return parts.join('; ');
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
