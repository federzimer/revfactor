// Vercel serverless function — Discovery-call qualifier capture.
//
// Two paths land here (Host path bypasses this endpoint and goes to Cal.com):
//   1. has_property = false               (no property yet)
//   2. has_property = true, is_pm = true  (property management company)
//
// Required env vars (Vercel project settings → Environment Variables):
//   SUPABASE_URL                — same as newsletter endpoint
//   SUPABASE_SERVICE_ROLE_KEY   — same as newsletter endpoint
//   RESEND_API_KEY              — Resend API key (revfactor.io sending domain)
//   DISCOVERY_NOTIFY_TO         — comma-separated recipient list, all paths
//                                 (default: aaron@procloser.ai)
//   DISCOVERY_NOTIFY_TO_PM      — comma-separated recipient list, PM path only
//                                 (default: Federico + Gaston at blackbirdhm.com)
//                                 PM-path emails fan out to NOTIFY_TO ∪ NOTIFY_TO_PM.
//   DISCOVERY_NOTIFY_FROM       — sender (default: onboarding@resend.dev)
//
// Deliverability note: revfactor.io DNS records for Resend are LIVE on Namecheap
// (DKIM resend._domainkey, SPF MX feedback-smtp.us-east-1.amazonses.com on send,
//  SPF TXT v=spf1 include:amazonses.com ~all on send — verified live 2026-06-05).
// While DEFAULT_NOTIFY_FROM is still onboarding@resend.dev, Resend restricts
// delivery to the Resend account owner only. External recipients
// (federico@blackbirdhm.com, gaston@blackbirdhm.com) won't receive notifications
// until DISCOVERY_NOTIFY_FROM is switched to a revfactor.io sender — e.g.
// "RevFactor Discovery <notifications@revfactor.io>" — and Resend's domain
// verification button has been clicked in their dashboard.

export const config = { runtime: 'edge' };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const DEFAULT_NOTIFY_TO = 'aaron@procloser.ai';
const DEFAULT_NOTIFY_TO_PM = 'Federico Zimerman <federico@blackbirdhm.com>, Gaston Corbalan <gaston@blackbirdhm.com>';
const DEFAULT_NOTIFY_FROM = 'RevFactor Discovery <onboarding@resend.dev>';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const email = String(body?.email || '').trim().toLowerCase();
  const hasProperty = body?.hasProperty === true;
  const isPM = body?.isPM === true;
  const source = String(body?.source || 'modal').slice(0, 50);
  const pageUrl = body?.pageUrl ? String(body.pageUrl).slice(0, 500) : null;
  const portfolioUrl = typeof body?.portfolioUrl === 'string' && body.portfolioUrl.trim()
    ? body.portfolioUrl.trim().slice(0, 500)
    : null;
  const propertyCountRaw = body?.propertyCount;
  const propertyCount = Number.isFinite(propertyCountRaw) && propertyCountRaw >= 0 && propertyCountRaw <= 100000
    ? Math.floor(propertyCountRaw)
    : null;

  if (!EMAIL_RX.test(email) || email.length > 254) {
    return json({ error: 'invalid_email' }, 400);
  }
  // hasProperty must be a real boolean; isPM only matters when hasProperty=true
  if (typeof body?.hasProperty !== 'boolean') {
    return json({ error: 'invalid_qualifier' }, 400);
  }
  // PM path requires portfolio URL + property count
  if (hasProperty && isPM) {
    if (!portfolioUrl) {
      return json({ error: 'portfolio_link_required' }, 400);
    }
    if (propertyCount == null) {
      return json({ error: 'property_count_required' }, 400);
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null;

  const insert = await fetch(`${url}/rest/v1/discovery_leads`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify([{
      email,
      has_property: hasProperty,
      is_pm: hasProperty ? isPM : null,
      portfolio_url: hasProperty && isPM ? portfolioUrl : null,
      property_count: hasProperty && isPM ? propertyCount : null,
      source,
      page_url: pageUrl,
      ip,
      user_agent: userAgent,
    }]),
  });

  if (!insert.ok) {
    const text = await insert.text().catch(() => '');
    console.error('discovery_leads insert failed', insert.status, text);
    return json({ error: 'storage_failed' }, 502);
  }

  // Notify Aaron + Federico. Non-blocking on the response body — log + 200 on failure
  // so the user still gets confirmation even if the email fan-out hiccups.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const path = !hasProperty ? 'no_property' : 'property_manager';
    const subject = !hasProperty
      ? `RevFactor lead (no property yet) — ${email}`
      : `RevFactor lead (PM company) — ${email}`;
    const lines: string[] = [
      `Path: ${path}`,
      `Email: ${email}`,
      `Has property: ${hasProperty ? 'yes' : 'no'}`,
      `Is PM company: ${hasProperty ? (isPM ? 'yes' : 'no') : 'n/a (no property)'}`,
      ...(hasProperty && isPM ? [
        `Properties under management: ${propertyCount != null ? propertyCount : 'n/a'}`,
        `Portfolio link: ${portfolioUrl || 'n/a'}`,
      ] : []),
      `Source: ${source}`,
      `Page: ${pageUrl || 'n/a'}`,
      `IP: ${ip || 'n/a'}`,
      `User-Agent: ${userAgent || 'n/a'}`,
      `Time: ${new Date().toISOString()}`,
    ];
    const text = lines.join('\n');
    const html = `<table style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#3F261F;">`
      + lines.map((l) => {
          const [k, ...rest] = l.split(': ');
          return `<tr><td style="padding:4px 14px 4px 0;color:#76574C;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:4px 0;"><strong>${escapeHtml(rest.join(': '))}</strong></td></tr>`;
        }).join('')
      + `</table>`;

    const baseTo = (process.env.DISCOVERY_NOTIFY_TO || DEFAULT_NOTIFY_TO)
      .split(',').map((s) => s.trim()).filter(Boolean);
    const pmTo = hasProperty && isPM
      ? (process.env.DISCOVERY_NOTIFY_TO_PM || DEFAULT_NOTIFY_TO_PM)
          .split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    // De-dupe in case the same address is listed in both env vars.
    const to = Array.from(new Set([...baseTo, ...pmTo]));
    const from = process.env.DISCOVERY_NOTIFY_FROM || DEFAULT_NOTIFY_FROM;

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text, html }),
      });
      if (!r.ok) {
        const errText = await r.text().catch(() => '');
        console.error('resend notify failed', r.status, errText);
      }
    } catch (e) {
      console.error('resend notify threw', e);
    }
  } else {
    console.warn('discovery-lead: RESEND_API_KEY not set; skipped notification');
  }

  return json({ ok: true });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
