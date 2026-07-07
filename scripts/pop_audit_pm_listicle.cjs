// L — Run a Page Optimizer Pro report on the PM listicle for a second
// opinion alongside the seo-toolkit audit. POP's proprietary score is the
// one signal seo-toolkit can't replicate.
const fs = require('fs');
const path = require('path');

// Requires POP_API_KEY in the environment — see ~/.config/flightdeck/revfactor-ads.env
const POP_API_KEY = process.env.POP_API_KEY;
if (!POP_API_KEY) {
  console.error('Missing POP_API_KEY env var — source ~/.config/flightdeck/revfactor-ads.env');
  process.exit(1);
}
const TARGET_URL = 'https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/';
const KEYWORD = 'best airbnb property managers';
const LOCATION = 'United States';
const LANGUAGE = 'english';

async function call(endpoint, body) {
  const res = await fetch(`https://app.pageoptimizer.pro${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: POP_API_KEY, ...body }),
  });
  return res.json();
}

async function poll(taskId, label) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`https://app.pageoptimizer.pro/api/task/${taskId}/results/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data?.status === 'COMPLETED' || data?.status === 'SUCCESS' || data?.completed) return data;
    if (data?.status === 'FAILED' || data?.error) throw new Error(`${label} failed: ${JSON.stringify(data)}`);
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`${label} timed out after 5 min`);
}

(async () => {
  console.log(`POP audit: ${TARGET_URL}`);
  console.log(`Keyword: "${KEYWORD}"`);

  // Step 1: get-terms
  console.log('Step 1: get-terms…');
  const step1 = await call('/api/expose/get-terms/', {
    targetUrl: TARGET_URL,
    keyword: KEYWORD,
    locationName: LOCATION,
    targetLanguage: LANGUAGE,
  });
  if (!step1.taskId) { console.error('get-terms response:', step1); process.exit(1); }
  console.log(`  taskId: ${step1.taskId}`);
  const terms = await poll(step1.taskId, 'get-terms');
  console.log('\n  prepareId:', terms?.results?.prepareId || terms?.prepareId);

  const prepareId = terms?.results?.prepareId || terms?.prepareId;
  const lsaPhrases = terms?.results?.lsaPhrases || terms?.lsaPhrases || [];
  const variations = terms?.results?.variations || terms?.variations || [];

  // Step 2: create-report
  console.log('\nStep 2: create-report…');
  const step2 = await call('/api/expose/create-report/', {
    targetUrl: TARGET_URL,
    keyword: KEYWORD,
    locationName: LOCATION,
    targetLanguage: LANGUAGE,
    prepareId,
    lsaPhrases,
    variations,
  });
  if (!step2.taskId) { console.error('create-report response:', step2); process.exit(1); }
  console.log(`  taskId: ${step2.taskId}`);
  const report = await poll(step2.taskId, 'create-report');
  console.log(`\n  reportId: ${report?.results?.reportId || report?.reportId}`);

  const reportData = report?.results || report;
  const out = path.resolve(__dirname, '../tests/_artifacts/pop-pm-listicle-2026-05-16.json');
  fs.writeFileSync(out, JSON.stringify(reportData, null, 2));
  console.log(`\nReport written to ${out}`);
  console.log(`Page score: ${reportData?.pageScore ?? '?'}`);
  console.log(`Word count: ${reportData?.wordCount ?? '?'}`);
  console.log(`Competitor avg word count: ${reportData?.competitorAvgWordCount ?? '?'}`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
