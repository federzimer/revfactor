# GrowthBook A/B testing setup — RevFactor PPC

## Keys

Two distinct GrowthBook keys with very different security profiles:

| Key type | Where it lives | What it can do |
|---|---|---|
| **Admin secret** (server only) | macOS keychain: `security find-generic-password -a "$USER" -s growth-book -w` | Full API access — manage features, create flags, delete data. **Never commit. Never expose to client. Only used for backend automation.** |
| **Client SDK key** (public) | `PUBLIC_GROWTHBOOK_KEY` env var in Vercel + local `.env` | Read-only feature flag delivery to browser. Safe to expose. Aaron grabs from `app.growthbook.io` → SDK Connections page. |

The admin key is in keychain only. To view value when needed:
```bash
security find-generic-password -a "$USER" -s growth-book -w
```

## Local + Vercel env

Add to `.env` (gitignored) AND Vercel project env:
```
PUBLIC_GROWTHBOOK_KEY=<client-sdk-key-from-growthbook-dashboard>
```

`PUBLIC_*` prefix is required for Astro to expose the value to client-side React. The client key is read-only and bound to one project, so exposure is safe.

## Wiring (PPCLanding.jsx)

The component already supports `?v=split` URL override. Once `PUBLIC_GROWTHBOOK_KEY` is set, the SDK takes over and assigns 50/50 traffic to `stacked` vs `split` via cookie (sticky per-visitor).

Code path: `PPCLanding.jsx` → reads `import.meta.env.PUBLIC_GROWTHBOOK_KEY` → if set, fetches feature `ppc_hero_layout` from GrowthBook → uses returned value as `effectiveLayout`. URL param still wins for manual overrides during QA.

## Feature to create in GrowthBook UI

Name: `ppc_hero_layout`
Type: String
Default: `stacked`
Variations:
- 50% → `stacked` (control)
- 50% → `split` (variant)

Track conversion: link the `book_strategy_call` GA4 event back into GrowthBook for stat-sig analysis.
