// Vercel serverless function — newsletter signup → Supabase.
// Required env vars (set in Vercel project settings):
//   SUPABASE_URL              — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service-role JWT (server-side only, never exposed)
// Required Supabase schema:
//   create table public.subscribers (
//     id uuid default gen_random_uuid() primary key,
//     email text unique not null,
//     source text default 'journal',
//     created_at timestamptz default now(),
//     ip inet,
//     user_agent text
//   );

export const config = { runtime: 'edge' };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

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
  const source = String(body?.source || 'journal').slice(0, 50);
  if (!EMAIL_RX.test(email) || email.length > 254) {
    return json({ error: 'invalid_email' }, 400);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null;

  const upsert = await fetch(`${url}/rest/v1/subscribers`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify([{ email, source, ip, user_agent: userAgent }]),
  });

  if (!upsert.ok && upsert.status !== 409) {
    const text = await upsert.text().catch(() => '');
    console.error('supabase insert failed', upsert.status, text);
    return json({ error: 'storage_failed' }, 502);
  }

  return json({ ok: true });
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
