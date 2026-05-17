// Daily Peec.ai brand-visibility snapshot for RevFactor.
//
// Pulls the 30-day visibility report for the RevFactor Peec project, diffs
// against yesterday's snapshot, and posts a digest to Slack when the
// brand picks up (or loses) a tracked prompt. State persists at
// $STATE_DIR/peec_snapshot.json (defaults to ./state when running locally).
//
// Required env vars:
//   PEEC_API_KEY        — Peec X-API-Key
//   PEEC_PROJECT_ID     — RevFactor project ID
//   SLACK_WEBHOOK_URL   — incoming webhook (optional; logs to stdout if absent)
//   STATE_DIR           — directory for snapshot JSON (defaults to ./state)
//
// Render: cron schedule recommended `0 13 * * *` (8am CT / 13:00 UTC DST).
const fs   = require('fs');
const path = require('path');

const PEEC_KEY     = process.env.PEEC_API_KEY;
const PROJECT_ID   = process.env.PEEC_PROJECT_ID || 'or_be14dba6-461f-4a09-8926-ebf75b550157';
const SLACK_URL    = process.env.SLACK_WEBHOOK_URL || '';
const STATE_DIR    = process.env.STATE_DIR || path.resolve(__dirname, '../state');
const BRAND_NAME   = 'RevFactor';
const LOOKBACK_DAYS = 30;

if (!PEEC_KEY) { console.error('Missing PEEC_API_KEY env var'); process.exit(1); }

fs.mkdirSync(STATE_DIR, { recursive: true });
const SNAPSHOT_FILE = path.join(STATE_DIR, 'peec_snapshot.json');

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchReport() {
  const end = new Date();
  const start = new Date(end.getTime() - LOOKBACK_DAYS * 86400 * 1000);
  const url = `https://api.peec.ai/customer/v1/reports/brands?project_id=${PROJECT_ID}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-API-Key': PEEC_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: fmt(start),
      end_date: fmt(end),
      dimensions: ['prompt_id'],
    }),
  });
  if (!res.ok) throw new Error(`Peec API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data || [];
}

async function fetchPromptText() {
  const url = `https://api.peec.ai/customer/v1/prompts?project_id=${PROJECT_ID}`;
  const res = await fetch(url, { headers: { 'X-API-Key': PEEC_KEY } });
  if (!res.ok) return new Map();
  const data = await res.json();
  const m = new Map();
  for (const p of data.data || []) {
    const text = (p.messages?.[0]?.content || '').slice(0, 120);
    m.set(p.id, text);
  }
  return m;
}

function summarize(rows) {
  // Aggregate per brand
  const byBrand = {};
  for (const r of rows) {
    const b = r.brand?.name || 'unknown';
    if (!byBrand[b]) byBrand[b] = { mentions: 0, sov: 0, prompts: new Set() };
    byBrand[b].mentions += r.mention_count || 0;
    byBrand[b].sov      += r.share_of_voice || 0;
    if ((r.mention_count || 0) > 0) byBrand[b].prompts.add(r.prompt.id);
  }

  // Per-prompt for RevFactor specifically
  const rfPrompts = {};
  for (const r of rows) {
    if (r.brand?.name?.toLowerCase() === BRAND_NAME.toLowerCase()) {
      rfPrompts[r.prompt.id] = {
        mentions: r.mention_count || 0,
        sov: r.share_of_voice || 0,
      };
    }
  }

  return { byBrand, rfPrompts };
}

async function postSlack(text) {
  if (!SLACK_URL) { console.log('[no-slack]', text); return; }
  await fetch(SLACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

(async () => {
  console.log(`[${new Date().toISOString()}] Peec snapshot start (project ${PROJECT_ID})`);

  const [rows, promptText] = await Promise.all([fetchReport(), fetchPromptText()]);
  const summary = summarize(rows);

  // Load prior snapshot
  let prior = null;
  if (fs.existsSync(SNAPSHOT_FILE)) {
    try { prior = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')); } catch {}
  }

  // RevFactor headline
  const rfBrand = summary.byBrand[BRAND_NAME] || { mentions: 0, sov: 0, prompts: new Set() };
  const rfNow = {
    mentions: rfBrand.mentions,
    sov: rfBrand.sov,
    promptCount: rfBrand.prompts.size,
    prompts: [...rfBrand.prompts],
  };

  const today = fmt(new Date());
  const totalPrompts = Object.values(summary.byBrand).reduce((acc, b) => Math.max(acc, b.prompts.size), 0);

  let header = `📊 *RevFactor Peec snapshot — ${today}*`;
  let body = `\n*RevFactor*: ${rfNow.mentions} mentions · ${(rfNow.sov*100).toFixed(2)}% SoV · ${rfNow.promptCount}/${totalPrompts || 75} prompts`;

  // Diff vs prior
  if (prior?.revfactor) {
    const dM = rfNow.mentions - prior.revfactor.mentions;
    const dSov = ((rfNow.sov - prior.revfactor.sov) * 100).toFixed(2);
    const priorSet = new Set(prior.revfactor.prompts || []);
    const nowSet = new Set(rfNow.prompts);
    const gained = [...nowSet].filter(p => !priorSet.has(p));
    const lost = [...priorSet].filter(p => !nowSet.has(p));

    body += `\n_vs ${prior.date}_: ${dM >= 0 ? '+' : ''}${dM} mentions · ${dSov >= 0 ? '+' : ''}${dSov}pp SoV`;
    if (gained.length) {
      body += `\n\n🆕 *Gained visibility on ${gained.length} prompt${gained.length === 1 ? '' : 's'}:*`;
      for (const pid of gained.slice(0, 10)) {
        body += `\n  • ${promptText.get(pid) || pid}`;
      }
    }
    if (lost.length) {
      body += `\n\n📉 *Lost visibility on ${lost.length} prompt${lost.length === 1 ? '' : 's'}:*`;
      for (const pid of lost.slice(0, 10)) {
        body += `\n  • ${promptText.get(pid) || pid}`;
      }
    }
  } else {
    body += `\n_(first run — no diff yet)_`;
  }

  // Top 5 competitors for context
  const sorted = Object.entries(summary.byBrand)
    .sort(([, a], [, b]) => b.mentions - a.mentions)
    .slice(0, 5);
  body += `\n\n*Top 5 competitors by mentions:*`;
  for (const [name, s] of sorted) {
    body += `\n  ${name}: ${s.mentions} mentions, ${(s.sov*100).toFixed(2)}% SoV, ${s.prompts.size} prompts`;
  }

  await postSlack(header + body);

  // Persist new snapshot
  const snap = {
    date: today,
    revfactor: rfNow,
    competitors: Object.fromEntries(
      Object.entries(summary.byBrand).map(([k, v]) => [k, { mentions: v.mentions, sov: v.sov, promptCount: v.prompts.size }])
    ),
  };
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snap, null, 2));
  console.log(`[done] snapshot written to ${SNAPSHOT_FILE}`);
})().catch((e) => {
  console.error('[error]', e.message);
  postSlack(`⚠️ Peec snapshot failed: ${e.message}`).finally(() => process.exit(1));
});
