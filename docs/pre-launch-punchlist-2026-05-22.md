# RevFactor pre-launch punch list — 2026-05-22

**Branch:** `cluster-builds-2026-05-15`
**Latest commit:** `963f45c` (round 8 ship + Muskan reply)
**Staging:** https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/

---

## ✅ Closed today (round 8 — commit `2b6d661`)

- Jurisdiction → Austin, TX (Travis County) in `/terms/`
- Federico podcast schema — 4 verified URLs added to `Person.sameAs` + hyperlinked in author-card bio (No Vacancy Ep 155, Life of Flow Ep 93, Crafted Stays, STR Like The Best Ep 54)
- Awning §6.4 — prepended RedAwning acquisition note (April 2024)
- Rented §6.7 — prepended TravelNet → Track rebrand note
- Resend setup doc written ([docs/resend-sending-domain-setup-2026-05-21.md](docs/resend-sending-domain-setup-2026-05-21.md))
- Google Ads invite doc written ([docs/google-ads-invite-federico-2026-05-22.md](docs/google-ads-invite-federico-2026-05-22.md)) — API was permission-denied, UI walkthrough provided
- Mobile QA M1 (thumbnail proportions) + M2 (filler-card position) verified on iPhone 14
- Muskan round-8 reply drafted ([docs/muskan-round8-reply-2026-05-22.md](docs/muskan-round8-reply-2026-05-22.md))

---

## 🔴 Open — Aaron

### 1. Add DNS records to Namecheap (Resend sending domain)
Without these, the Discovery Call API endpoint can't send notifications from `notifications@revfactor.io`. Full step-by-step at [docs/resend-sending-domain-setup-2026-05-21.md](docs/resend-sending-domain-setup-2026-05-21.md). **~10 min hands-on + 5–60 min propagation.**

### 2. Paste `RESEND_API_KEY` into Vercel env vars
After step 1 verifies. Vercel → revfactor project → Settings → Environment Variables → add `RESEND_API_KEY` with the value from `security find-generic-password -a "$USER" -s resend -w`. Tick Production + Preview + Development. Redeploy. **~2 min.**

### 3. Invite Fede to Google Ads (UI)
API path was permission-denied on `access_role`. 2-min UI walkthrough at [docs/google-ads-invite-federico-2026-05-22.md](docs/google-ads-invite-federico-2026-05-22.md). Email: `federico@blackbirdhm.com` · Role: **Admin** · Customer: `5342635272`.

### 4. Send Fede the client permission spreadsheet + featured-client list + video cuts
- Spreadsheet: [docs/fede-client-permissions-2026-05-21.xlsx](docs/fede-client-permissions-2026-05-21.xlsx) — 14 clients with permission columns.
- Featured-client list + video cuts from the 2026-05-21 Fireflies call — Fede needs the source material to attach when requesting permissions.

### 5. Confirm `hello@revfactor.io` contact email on legal pages
Currently used across `/privacy/`, `/terms/`, `/cookies/`. Confirm or swap to a different inbox before production launch.

### 6. Decide AI Persona path (Fede's Claude / Codex access to RevFactor brain)
Three options sketched in [docs/funnel-roadmap-2026-05-21.md](docs/funnel-roadmap-2026-05-21.md):
- (a) Shared private repo mirroring the `cynthia-shared` pattern (`axw4319/revfactor-brain`)
- (b) Claude Project shared to Fede's `@blackbirdhm.com` account
- (c) Both — repo for code-use, Project for conversational-use

Pick one and I'll build it.

---

## 🟡 Open — Federico

### 7. Confirm "Catchup with the Carlyles" actual show URL
Research couldn't find a podcast by that name with a Federico episode. Possible typo in the bio. Send the real show URL or confirm we should drop the reference permanently.

### 8. Build v2 funnel logic in fork + notify Aaron for QA
Per the 2026-05-21 call, Fede owns the v2 funnel build (90-day investment-intent question, delegate-vs-self-manage qualifier, calculator integration, service video, testimonials, investment-guide drip). Build in a fork; ping Aaron when ready for integration QA.

---

## Vercel + Resend verify (smoke test after steps 1 + 2)

```bash
curl -sS -X POST "https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/api/discovery-lead" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test+nopath@revfactor.io",
    "hasProperty": false,
    "source": "smoke-test",
    "pageUrl": "https://www.revfactor.io/"
  }'
```

Expected: `{"ok":true}` HTTP 200, then within ~5 sec a notification email arrives at both `notifications@revfactor.io` and `federico@blackbirdhm.com` from `notifications@revfactor.io`.
