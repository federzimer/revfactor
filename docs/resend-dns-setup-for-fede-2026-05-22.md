# revfactor.io — 3 DNS records for Resend verification

DNS is at Namecheap (`pdns1.registrar-servers.com`). Add these 3 records to **Domain List → revfactor.io → Advanced DNS**.

---

## Record 1 — DKIM (TXT)

| Field | Value |
|---|---|
| Type | `TXT Record` |
| Host | `resend._domainkey` |
| Value | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDwo+eC3QsI74oFyy/NM0yCsaiV2m6sO/+gQJccO2Z1yb/U9+onlqVzscRgC9QpHQf8ZvmDIumPCYDVQ0oW35vfivdOn7EPOGpBjzenSGOKd+FjhQgtR3LlZM7zL64mQD9UbiMAMQNw8m533g3z6QuiaDovhfDkyuU1o03uHsUdTwIDAQAB` |
| TTL | `Automatic` |

> Paste the value **as one string, no line breaks**. Some Namecheap UIs auto-wrap long values — that's fine, it's stored as one record.

---

## Record 2 — SPF MX (MX)

| Field | Value |
|---|---|
| Type | `MX Record` |
| Host | `send` |
| Mail Server | `feedback-smtp.us-east-1.amazonses.com` |
| Priority | `10` |
| TTL | `Automatic` |

---

## Record 3 — SPF TXT (TXT)

| Field | Value |
|---|---|
| Type | `TXT Record` |
| Host | `send` |
| Value | `v=spf1 include:amazonses.com ~all` |
| TTL | `Automatic` |

---

## After adding

1. Click **Save All Changes** in Namecheap
2. DNS propagation: usually 5–30 min, can take up to 24h
3. Reply to this thread once added — Aaron will trigger Resend's verification check

## Why

The Discovery Call modal on revfactor.io captures leads and emails the team via Resend. Resend won't deliver from `notifications@revfactor.io` until these records are in place. We're temporarily sending from Resend's default domain (`onboarding@resend.dev`) which restricts delivery to one inbox — once these 3 records verify, we switch back to `notifications@revfactor.io` and Fede starts getting notifications directly.

## Source

Records pulled live from Resend on 2026-05-22 (domain id `b597b1c5-7d4a-488b-8d0a-97c5f986f511`, status `not_started` since 2026-05-18).
