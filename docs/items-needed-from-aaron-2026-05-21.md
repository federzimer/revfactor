# Items I need from you — Aaron — 2026-05-21

Ranked by what's blocking the next deploy. Pin a slack thread or reply inline.

---

## 🔴 Blocking the Discovery Call flow going fully live

### 1. RESEND_API_KEY in Vercel (required before notifications fire)
- **Where:** Vercel → revfactor project → Settings → Environment Variables.
- **Variable:** `RESEND_API_KEY`
- **Value:** the Resend API key for the `revfactor.io` verified domain.
- **Without it:** leads still save to Supabase `discovery_leads` table, but no email goes to you/Fede.
- **Action:** paste the key into Vercel and redeploy `cluster-builds-2026-05-15`. I can also fire test variations once the key is set (or share it locally so I can fire them from my machine).

### 2. Confirm sender & recipient defaults are right
- Default sender (`DISCOVERY_NOTIFY_FROM`): `RevFactor <notifications@revfactor.io>` — confirm or swap.
- Default recipients (`DISCOVERY_NOTIFY_TO`): `notifications@revfactor.io, federico@blackbirdhm.com` — confirm or add CC list.

---

## 🟡 Needed this week to ship to production

### 3. Federico to send verified podcast / press URLs
Per the round-5 audit, Muskan flagged that the Federico-bio name-drops (Natalie Palmer Ep 155, Life of Flow, Catchup with the Carlyles, Craft Stays, STR Like The Best) need canonical episode URLs. I need:
- Spotify / Apple Podcasts / YouTube link for each appearance
- LinkedIn URL (already in schema, sanity-check)
- Any press / media mentions you can produce

Will hyperlink the body-copy mentions + feed them into the Person schema's `sameAs` array.

### 4. Privacy / Terms jurisdiction confirmation (legal pages)
Both legal pages currently say **Florida / Miami-Dade County** as the governing law. Confirm:
- Operating entity (LLC name + state of incorporation)
- Email contact (currently `hello@revfactor.io` — confirm or swap)
- Sender name on the Muskan reply / Discovery emails — your name or Fede's box?

### 5. Client permission collection (delegated to Fede)
I built [docs/fede-client-permissions-2026-05-21.xlsx](docs/fede-client-permissions-2026-05-21.xlsx) for Fede — 14 clients + permission columns + an "ask template" sheet. **From you:**
- Send the spreadsheet to Fede (it's the file I just opened).
- Send Fede the **list of featured clients + the video cuts** you mentioned on the 2026-05-21 call so he has source material to attach when he reaches out.
- Confirm any client on the list who's off-limits or in a sensitive contract status.

---

## 🟢 Strategic / mid-term

### 6. Add Federico as admin in Google Ads
Per the 2026-05-21 call. You said you'd walk him through the verification process. Once he's verified I can hand off the campaign-management thread to him.

### 7. Decide on the "host-without-property" offering
The new no-property email-capture copy promises "*Short courses, market reads, getting-started playbooks — drop your email and we'll let you know when it ships.*" That's now a real expectation we're setting. **Need:**
- Is this a product Fede is actually building?
- Or do we route those captured emails into a different drip (referrals to brokers / CPAs / "wait until you have a property" educational sequence)?

Until you decide, leads in that bucket sit in Supabase with no follow-up.

### 8. AI Persona — how should Fede access the brain?
Per the call, you want Claude (and/or Codex) trained on RevFactor's content so Fede can use it. Two paths:
- **(a) Shared Git repo** mirroring the `cynthia-shared` pattern — a private repo (`axw4319/revfactor-brain` or similar) with podcasts / TikToks / IG transcripts / brand docs that auto-syncs to Fede's machine. Fede points Claude / Codex at the folder.
- **(b) Claude Projects (web)** — upload the corpus into a Claude Project and share with Fede's `@blackbirdhm.com` account.
- **(c) Both — repo for code use, Projects for conversational use.**

Tell me which path and I'll set it up.

### 9. Sign off the new pre-property copy
The No-property email-capture screen now reads:

> **Kicker:** DISCOVERY · STAY CLOSE
> **Title:** We're building something for hosts before they own.
> **Body:** Short courses, market reads, getting-started playbooks for the pre-property stretch. Drop your email and we'll let you know when it ships — or come back when your first property is live. The Rev Journal lands in your inbox in the meantime.
> **Button:** Keep me posted

Confirm this is the message you want, or send edits.

---

## Status snapshot

| Item | Owner | Status |
|---|---|---|
| Discovery Call qualifier code | Aaron | ✅ shipped (`04a0e40`) |
| Stats refresh (+24% / 198 / 67) | Aaron | ✅ shipped (in flight to commit) |
| Email previews for review | Aaron | ✅ saved in [docs/discovery-call-previews/](docs/discovery-call-previews/) and opened locally |
| Client permission xlsx for Fede | Aaron | ✅ at [docs/fede-client-permissions-2026-05-21.xlsx](docs/fede-client-permissions-2026-05-21.xlsx) |
| RESEND_API_KEY in Vercel | **Aaron** | 🔴 needed |
| Privacy/Terms jurisdiction | **Aaron / Fede** | 🟡 needed |
| Federico funnel branch | Federico | ⏳ pending |
| Google Ads admin handoff | Aaron | 🟢 mid-term |
| AI Persona setup decision | **Aaron** | 🟢 needs direction |
