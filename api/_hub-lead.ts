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
