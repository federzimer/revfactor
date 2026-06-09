// Vercel serverless function — Revenue Check lead capture → email notification (Resend).
// Every revenue-check form submission emails the team so no lead is lost.
//
// Required env vars (set in Vercel project settings):
//   RESEND_API_KEY  — Resend API key whose account owns the verified LEAD_FROM domain.
//   LEAD_FROM       — verified sender, e.g. "RevFactor Revenue Check <leads@revfactor.io>".
//                     revfactor.io must be VERIFIED in Resend first (DNS at Namecheap).
//                     Interim verified option: "RevFactor Revenue Check <leads@send.thriveagency.com>"
//   LEAD_TO         — comma-separated recipients. Defaults to Fede + Gaston (below).
//
// Notes:
//   - replyTo is set to the lead's email so the team can respond directly.
//   - LOCAL copy of api/revenue-check-lead.ts as an Astro endpoint so the full
//     flow (capture -> email) runs under `astro dev`. Env read via import.meta.env.

import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const DEFAULT_TO = 'federico@blackbirdhm.com,corbalan.gaston@gmail.com';

// Human-readable labels for the lead-route tags emitted by RevenueCheckFlow.jsx.
const TAG_LABELS: Record<string, string> = {
  live_property_analyzer: 'Live property — revenue analyzer',
  launch_plan: 'Launching — launch plan',
  launch_checklist: 'Launching — launch checklist (nurture)',
  redesign_checklist: 'Launching — redesign checklist (nurture)',
  paid_underwriting_report: 'Underwriting — paid report',
  research_free_checklist: 'Researching — free checklist',
  research_paid_playbook: 'Researching — paid playbook',
};

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const from = import.meta.env.LEAD_FROM || process.env.LEAD_FROM;
  if (!apiKey || !from) {
    return json({ error: 'server_misconfigured' }, 500);
  }
  const to = (import.meta.env.LEAD_TO || process.env.LEAD_TO || DEFAULT_TO)
    .split(',')
    .map((address: string) => address.trim())
    .filter(Boolean);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 254).toLowerCase();
  const phone = clean(body?.phone, 40);
  const tag = clean(body?.tag, 60) || 'revenue_check';
  const formTitle = clean(body?.formTitle, 160);
  const context = clean(body?.context, 1000);

  if (!EMAIL_RX.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }
  if (!name) {
    return json({ error: 'missing_name' }, 400);
  }

  const routeLabel = TAG_LABELS[tag] || tag;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ua = request.headers.get('user-agent')?.slice(0, 300) || '';

  const subject = `New Revenue Check lead — ${name} (${routeLabel})`;

  const html = renderEmail({ name, email, phone, routeLabel, tag, formTitle, context, ip, ua });
  const text = renderText({ name, email, phone, routeLabel, formTitle, context });

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject,
      html,
      text,
    }),
  });

  if (!send.ok) {
    const detail = await send.text().catch(() => '');
    console.error('resend send failed', send.status, detail);
    return json({ error: 'send_failed' }, 502);
  }

  return json({ ok: true });
}

function renderEmail(d: {
  name: string;
  email: string;
  phone: string;
  routeLabel: string;
  tag: string;
  formTitle: string;
  context: string;
  ip: string;
  ua: string;
}): string {
  const row = (label: string, value: string) =>
    value
      ? `<tr>
           <td style="padding:8px 0;color:#8F6E62;font:700 11px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:1.5px;width:160px;vertical-align:top;">${esc(label)}</td>
           <td style="padding:8px 0;color:#3F261F;font:400 15px/1.5 Helvetica,Arial,sans-serif;">${esc(value)}</td>
         </tr>`
      : '';

  return `<!doctype html><html><body style="margin:0;background:#DDDAD3;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#E8E6E1;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#13342D;padding:22px 28px;">
      <div style="color:#A8BBA3;font:700 9px/1 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:3px;">RevFactor · Revenue Check</div>
      <div style="color:#E8E6E1;font:400 26px/1.2 Georgia,serif;margin-top:8px;">New lead captured</div>
    </td></tr>
    <tr><td style="padding:24px 28px;">
      <div style="display:inline-block;background:#5D6D59;color:#E8E6E1;font:700 10px/1 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;padding:8px 12px;border-radius:999px;">${esc(d.routeLabel)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid rgba(63,38,31,0.12);">
        ${row('Name', d.name)}
        ${row('Email', d.email)}
        ${row('Phone', d.phone)}
        ${row('Form', d.formTitle)}
        ${row('Lead route', d.tag)}
        ${row('Captured context', d.context)}
      </table>
    </td></tr>
    <tr><td style="padding:0 28px 24px;">
      <div style="color:#8F6E62;font:400 11px/1.5 Helvetica,Arial,sans-serif;border-top:1px solid rgba(63,38,31,0.12);padding-top:14px;">
        Reply to this email to reach ${esc(d.name)} directly.${d.ip ? ` · IP ${esc(d.ip)}` : ''}
      </div>
    </td></tr>
  </table></body></html>`;
}

function renderText(d: {
  name: string;
  email: string;
  phone: string;
  routeLabel: string;
  formTitle: string;
  context: string;
}): string {
  return [
    'New Revenue Check lead',
    '----------------------',
    `Route:   ${d.routeLabel}`,
    `Name:    ${d.name}`,
    `Email:   ${d.email}`,
    d.phone ? `Phone:   ${d.phone}` : '',
    d.formTitle ? `Form:    ${d.formTitle}` : '',
    d.context ? `Context: ${d.context}` : '',
    '',
    'Reply to this email to reach the lead directly.',
  ]
    .filter(Boolean)
    .join('\n');
}

function clean(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
