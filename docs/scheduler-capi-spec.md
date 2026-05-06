# Server-side Google Ads conversion (CAPI) — for the scheduler

Drop-in spec for `revfactor-scheduler` to fire a server-side conversion to
Google Ads when `setStep('confirmed')` runs. Closes the iOS-attribution
gap (~30-40% of paid converters lose attribution to ITP cookie caps).

## What it solves

The browser-side gtag (already firing inside the iframe) handles ~60-70%
of conversions. The remaining 30-40% — primarily iOS Safari users —
have their cookies stripped before Google Ads matches the booking back
to the original click. Server-side conversion uploads with the `gclid`
guarantee attribution regardless of cookie state.

## Required env vars

```bash
# Google Ads API auth (Aaron will share via secure channel)
GOOGLE_ADS_DEVELOPER_TOKEN=TAVLprDp4xahVBF66z1o6Q
GOOGLE_ADS_CLIENT_ID=152523812982-3j77m5uccj54n2pd82675qffullhsshl.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=<Aaron will provide>
GOOGLE_ADS_REFRESH_TOKEN=<Aaron will provide>
GOOGLE_ADS_LOGIN_CUSTOMER_ID=8226967901
GOOGLE_ADS_CUSTOMER_ID=5342635272
GOOGLE_ADS_CONVERSION_ACTION_ID=7591215586  # Strategy Call Booked
```

## Node.js implementation

Add to your scheduler backend (assuming Next.js API routes or
similar). Library: `npm i google-ads-api`.

```ts
// src/lib/google-ads-conversion.ts
import { GoogleAdsApi } from "google-ads-api";

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
});

interface ConversionInput {
  gclid: string;            // from URL params at booking time
  bookingId: string;        // dedupes against browser-side gtag
  conversionDateTime?: Date; // defaults to now
  value?: number;           // defaults to $1000 (matches existing gtag)
}

/**
 * Fires a server-side Google Ads conversion. Idempotent against the
 * browser-side gtag — Google dedupes by order_id (bookingId).
 *
 * Skip silently if no gclid (organic / direct / non-Google traffic).
 */
export async function fireGoogleAdsConversion(input: ConversionInput) {
  if (!input.gclid) return { skipped: "no_gclid" };

  const fmt = (d: Date) =>
    `${d.toISOString().slice(0, 19).replace("T", " ")}+00:00`;

  try {
    const result = await customer.conversionUploads.uploadClickConversions(
      [
        {
          conversion_action: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${process.env.GOOGLE_ADS_CONVERSION_ACTION_ID}`,
          gclid: input.gclid,
          conversion_date_time: fmt(input.conversionDateTime ?? new Date()),
          conversion_value: input.value ?? 1000,
          currency_code: "USD",
          order_id: input.bookingId,
        },
      ],
      { partial_failure: true }
    );
    return { ok: true, result };
  } catch (e) {
    console.error("[google-ads-conversion] upload failed:", e);
    return { ok: false, error: e };
  }
}
```

## Where to call it

Inside the booking-confirmation handler, alongside the existing
browser-side gtag call. Pseudocode of the relevant `setStep('confirmed')`
flow:

```ts
async function onBookingConfirmed(booking) {
  // ... existing code ...

  // Browser-side gtag (already there, keep it)
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "book_strategy_call", { /* existing payload */ });
  }

  // NEW: server-side conversion ping
  const gclid = new URLSearchParams(window.location.search).get("gclid");
  if (gclid) {
    // Hit your own backend endpoint, which calls fireGoogleAdsConversion
    fetch("/api/conversions/google-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gclid,
        bookingId: booking.id,
        value: 1000,
      }),
    }).catch(() => { /* swallow — browser-side already attempted */ });
  }
}
```

API route (`src/pages/api/conversions/google-ads.ts` or App Router
equivalent):

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { fireGoogleAdsConversion } from "@/lib/google-ads-conversion";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { gclid, bookingId, value } = req.body;
  if (!gclid || !bookingId) return res.status(400).json({ error: "missing fields" });

  const result = await fireGoogleAdsConversion({ gclid, bookingId, value });
  return res.status(result.ok ? 200 : 500).json(result);
}
```

## Important notes

- **`partial_failure: true`** — never throws on a single bad conversion;
  just logs the failure. Lets one bad upload not kill the booking flow.
- **Validate-only mode** for testing: pass `validate_only: true` in the
  options to confirm the request shape without recording. Strongly
  recommended for the first 5-10 bookings before going live.
- **Latency**: doesn't have to be synchronous with the booking confirm.
  Google accepts conversions up to **90 days late**. Async / queued is
  fine.
- **Don't worry about double-firing**: Google dedupes by `order_id`
  (we send `booking.id`). If both the browser gtag and server-side
  ping land for the same booking, only one is counted.
- **`gclid` can be missing**: organic, direct, social, non-Google paid
  (Meta) traffic won't have it. Skip the call when it's absent.

## What changes after deploy

- iOS Safari converters that lost their cookie before booking will be
  attributed correctly.
- Smart Bidding's optimization signal becomes ~30% richer.
- The `Conversions` column in Google Ads reports will start matching
  Cal.com / actual booked-call counts more closely.

## Aaron's checklist for handoff

- [ ] Drop the env vars into your `.env` (or wherever your scheduler
      reads its secrets) via secure channel — NOT email/Slack
- [ ] Install `google-ads-api` package
- [ ] Add the lib + API route
- [ ] Run `validate_only: true` for first 5 bookings — confirm no
      validation errors
- [ ] Flip to live mode
- [ ] Aaron verifies in Google Ads Conversions report within 24-48h
      that conversion counts increase

## Reference

- Conversion Action ID: `7591215586` (Strategy Call Booked)
- Customer ID: `5342635272` (RevFactor.io)
- MCC: `8226967901` (Demand Gen MCC)
- Browser-side gtag (already firing): inside scheduler chunk
  `241-76e503c73f4abe78.js`, `gtag("event","book_strategy_call",{...})`
- Aaron's Telegram for diagnostics: `7701444125` (chat with Grace bot)
