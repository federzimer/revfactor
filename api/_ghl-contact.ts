// Shared helper: add newsletter signups to GoHighLevel (links.revfactor.io CRM)
// so the team can send newsletters and drip emails from GHL.
//
// Flow (LeadConnector API v2, Version 2021-07-28):
//   1. POST /contacts/upsert {locationId, email}: creates the contact or returns
//      the existing one. No tags/source in this call, because upsert REPLACES
//      tags and source on an existing contact (a client who subscribes would
//      lose their "client" tag).
//   2. New contact only: PUT /contacts/{id} {source}.
//   3. POST /contacts/{id}/tags: additive, existing tags are kept.
//
// Best-effort by design: never throws, ~5s timeout per call, failures logged
// only. The visitor's signup must never block on GHL being up.
//
// Required env vars (Vercel project settings): GHL_PIT_TOKEN, GHL_LOCATION_ID

const GHL_API = 'https://services.leadconnectorhq.com';

export interface GhlContact {
  email: string;
  tags: string[];
  source: string;
}

async function ghl(path: string, method: string, token: string, body?: unknown): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const r = await fetch(`${GHL_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await r.text().catch(() => '');
    if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timer);
  }
}

export async function addContactToGhl(contact: GhlContact): Promise<void> {
  const token = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    console.warn('ghl-contact: GHL_PIT_TOKEN or GHL_LOCATION_ID not set; skipped');
    return;
  }
  try {
    const up = await ghl('/contacts/upsert', 'POST', token, { locationId, email: contact.email });
    const id = up?.contact?.id;
    if (!id) throw new Error('upsert returned no contact id');
    if (up.new) {
      await ghl(`/contacts/${id}`, 'PUT', token, { source: contact.source });
    }
    if (contact.tags.length) {
      await ghl(`/contacts/${id}/tags`, 'POST', token, { tags: contact.tags });
    }
  } catch (e) {
    console.error('ghl-contact: add failed', e);
  }
}
