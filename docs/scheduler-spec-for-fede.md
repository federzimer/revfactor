# RevFactor scheduler — analytics + iframe spec

**For:** Federico Zimerman
**App:** schedule.revfactor.io (Next.js scheduler)
**Date:** 2026-05-11 (updated 2026-05-13 — P0 item identified)
**Estimated work:** 20-30 minutes

---

## 🚨 TL;DR — what we need from you

**P0 — critical, every booking is currently invisible to Google Ads:**

1. **Post a booking-confirmed message to the parent window** when `setStep('confirmed')` runs. **This is the single highest-priority item in this entire spec.** Audit on 2026-05-13 confirmed the scheduler app posts ZERO messages to the parent — which means every booking since launch has been invisible to Google Ads conversion tracking, GA4, and our PostHog funnel. The fix is a 5-line code change (full snippet in section §4).

**P1 — analytics observability, ships with P0:**

2. **Install PostHog** in the scheduler app (one project, same token as the marketing site) — full code in §1
3. **Fire 7 events** as visitors move through the booking flow — full table in §2

**P2 — embed polish, nice-to-have:**

4. **Post iframeHeight on every step transition** so the parent modal auto-resizes (the parent listener exists and is forgiving — accepts several shapes; see §4)
5. **Hide the in-iframe "rf. SCHEDULER" header when in embed mode** (only when accessed from inside the marketing-site modal)
6. **Remove the embed page's `py-12` top padding** (or make it conditional on `?embed=true`)

---

## Why we're asking

**Two blind spots, both closable by you:**

**1. (P0) Conversion tracking is fundamentally broken.**
Audit on 2026-05-13 confirmed that schedule.revfactor.io sends no postMessages to the parent window — not on load, not on date click, not on booking confirmation. The parent page (www.revfactor.io and the PPC pages) has a listener that fires the Google Ads conversion pixel and GA4 event when it receives a booking-confirmed message. Since you never send one, **every booking since launch has been invisible to Google Ads.** Our dashboards show 0 conversions despite real visitors completing real bookings on your calendar. This is the single most important item in this spec.

**2. (P1) PostHog session recordings can't see inside the iframe.**
We installed PostHog on the main marketing site last week and the data is already paying off — we know exactly which CTAs visitors click, where they bounce, and how the modal performs. But:

**PostHog session recordings on the parent site can't capture anything inside the schedule.revfactor.io iframe.** This is a browser security default — scripts on one origin can't read the DOM of another origin. So when we watch a session replay of a visitor opening the schedule modal, the calendar area shows up as a blank rectangle even though the visitor sees and interacts with it normally.

Current data on the funnel:

| Signal | Last 7 days |
|---|---|
| Schedule modal opens | 14 |
| Schedule modal dismissals | 11 |
| Strategy calls booked | **0** |
| One visitor opened the modal | **5 separate times**, dismissed all 5 |

Visitors are actively trying to book and bailing inside the calendar. We need to know exactly where they're getting stuck — date selection? Time slots? Form fields? Validation errors? The only way to answer that is to instrument the scheduler app itself.

---

## 1. PostHog installation

### Install
```bash
npm install posthog-js
```

### Create `app/posthog-provider.tsx`
```tsx
'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

if (typeof window !== 'undefined') {
  posthog.init('phc_zEZzbgTKvzYMic6AkYegUNuCe9E78avUoHMArNP7fcSp', {
    api_host: 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    session_recording: { maskAllInputs: false }, // we want to see what they type
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

### Wrap the app — edit `app/layout.tsx`
```tsx
import { PHProvider } from './posthog-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PHProvider>{children}</PHProvider>
      </body>
    </html>
  );
}
```

That's it for setup. The token is **public** and safe in the client bundle.

---

## 🚨 1.5 — Post the booking-confirmed message to parent (P0)

**This is the highest-priority change in the entire spec.** Without this, every booking is invisible to Google Ads conversion tracking even after you install PostHog.

Inside your `setStep('confirmed')` handler — right after the booking API responds successfully, BEFORE you render the confirmation UI:

```ts
// signal the parent (www.revfactor.io) that a booking just happened
// so it can fire Google Ads conversion + GA4 event + PostHog event
if (typeof window !== 'undefined' && window.parent !== window) {
  window.parent.postMessage({
    type: 'scheduler_booking_confirmed',
    booked: true,
    value: 250,        // booking value in USD for conversion attribution
    currency: 'USD',
    date_iso: selectedDate,
    slot_iso: selectedSlot,
  }, '*');  // targetOrigin '*' is fine — parent listener whitelists by message shape
}

// also call posthog inside the iframe so you get the event in your project too
posthog.capture('scheduler_booking_confirmed', {
  value: 250,
  currency: 'USD',
  date_iso: selectedDate,
  slot_iso: selectedSlot,
});
```

**What the parent does when it receives this message** ([BaseLayout.astro:124](https://github.com/federzimer/revfactor/blob/main/src/layouts/BaseLayout.astro)):
1. Fires `gtag('event', 'conversion', { send_to: 'AW-18106897053/WkHxCOKD46McEJ2lhbpD', value: 1500, currency: 'USD' })` — registers the Google Ads conversion
2. Fires `gtag('event', 'strategy_call_booked', ...)` — GA4 event
3. Fires `posthog.capture('strategy_call_booked', ...)` — site-side PostHog event
4. Sets a session flag so it doesn't double-fire

The listener is forgiving — it'll accept any of these message shapes so you have some flexibility:
- `{ type: 'scheduler_booking_confirmed' }` ✅ (what's in the spec — preferred)
- `{ type: 'booking_confirmed' }` ✅
- `{ type: 'bookingSuccessful' }` ✅ (Cal.com legacy format)
- `{ booked: true }` ✅
- `{ confirmed: true }` ✅

Pick whichever is cleanest in your codebase.

### Verifying the fix works

After deploying:
1. Make a test booking on https://www.revfactor.io/airbnb-pricing-strategy
2. Open browser DevTools → Console → confirm you see no errors after clicking Confirm Booking
3. Open Network tab → look for a request to `https://www.google-analytics.com/g/collect?...en=conversion` — that's the conversion firing
4. Wait 24-48h → check Google Ads conversion column starts incrementing

---

## 2. Events to capture

| Event | Where to fire | Properties |
|---|---|---|
| `scheduler_loaded` | `useEffect` on `/embed` page mount | `{ embed: true, ref: document.referrer }` |
| `scheduler_date_selected` | onDateClick handler | `{ date_iso, days_out_from_today }` |
| `scheduler_time_selected` | onSlotClick handler | `{ slot_iso, slots_visible_count, host_name }` |
| `scheduler_form_started` | First `onChange` in any field | `{ field_name }` |
| `scheduler_form_submitted` | Form submit, before API call | `{ has_phone, has_listing_url, notes_length }` |
| `scheduler_booking_confirmed` | Inside `setStep('confirmed')` — **the most important one** | `{ value: 250, currency: 'USD', date_iso, slot_iso }` |
| `scheduler_error` | Any API failure or validation error | `{ error_type, step }` |

### Example: the conversion event
```ts
// inside setStep('confirmed'), after the booking API responds successfully
posthog.capture('scheduler_booking_confirmed', {
  value: 250,
  currency: 'USD',
  date_iso: selectedDate,
  slot_iso: selectedSlot,
  host_name: assignedHost?.name,
});
```

Once this fires reliably, we can build a real funnel:
**modal_opened → scheduler_loaded → date_selected → time_selected → form_started → form_submitted → booking_confirmed**

And finally see where each drop happens.

---

## 3. CSS / layout changes for the embed page

The marketing site (www.revfactor.io) embeds your scheduler via iframe in two places: (a) the `ScheduleModal` triggered by the navbar "Free Strategy Call" button, and (b) the `#schedule` section on PPC landing pages. The parent currently does some hacky clipping to make the iframe look clean inside the modal. These changes remove the hacks and let the iframe blend cleanly.

### 3a. Conditional embed mode
Detect when the page is being embedded and adjust:

```tsx
// in your /embed route
'use client';
import { useEffect, useState } from 'react';

export default function EmbedPage() {
  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    // Either rely on the route being /embed, or accept ?embed=true
    setIsEmbed(window.self !== window.top);
  }, []);

  return (
    <div className={isEmbed ? 'p-0' : 'py-12'}>
      {!isEmbed && <PageHeader />}
      <SchedulerWidget />
    </div>
  );
}
```

### 3b. Remove the outer `py-12` top padding in embed mode
Right now the embed page wraps everything in `py-12` (48px top/bottom). The parent modal compensates with `marginTop: -38px to -48px`. If you make `py-12` conditional on `!isEmbed`, the parent can drop those clipping hacks.

### 3c. Hide the inline "rf. SCHEDULER" header in embed mode
Inside the modal, the parent is going to remove its own "Schedule your strategy call" header (already done — shipped today) and let yours read as the authoritative one. **Don't hide yours by default** — keep it visible.

But on the PPC landing pages, the surrounding section has its own header already, so the duplicate "rf. SCHEDULER — Book a 15-minute discovery call with our team" creates visual noise. **Consider:** add `?compact=true` URL param that hides just the badge ("SCHEDULER" pill) but keeps the "Book a 15-minute discovery call with our team" h1. Optional — your call.

### 3d. Transparent or pure white body background in embed mode
The modal panel is white (`#FFFFFF`). Currently the iframe body has a slightly off-color tone that gives it an "embedded" look. Either:
```css
/* in embed mode */
body, html { background: transparent; }
```
Or set it to `#FFFFFF`. Either works.

### 3e. No outer scrollbar
Parent already handles overflow with the iframe wrapper. Inside the iframe:
```css
/* embed mode only */
html, body { overflow: hidden; }
```
The scheduler's own steps (form, etc.) can still scroll if needed via their own container.

---

## 4. The iframe postMessage contract

You're already posting `iframeHeight` via postMessage — we use it on the marketing site to auto-resize the panel as the user moves through date → time → form → confirmed. Please don't change the shape; the parent depends on it.

### What the parent expects you to post
```js
window.parent.postMessage({ iframeHeight: <number> }, '*');
```

The parent listener accepts any of these shapes (so you have some flexibility):
```js
e.data.iframeHeight
  ?? e.data.height
  ?? e.data.data?.height
  ?? e.data.data?.iframeHeight
```

### When to post

Every time the content height changes:
- On initial mount
- On step transition (date → time → form → confirmed)
- On form expansion (when validation errors push the form taller)
- On window resize (if your layout responds to that)

### Height bounds

- Heights are clamped to `400 < h < 1600` on the parent (anything outside is ignored)
- The parent currently subtracts 38-48px to clip your `py-12` top padding. **Once you ship 3b above, this clipping goes away.** Let me know when 3b is live so I can drop the clipping on the parent side.

### What we'll do once postMessage is reliable

The parent's modal panel auto-resizes to your posted height. So the panel will:
- Open at ~720px on date step
- Grow to ~820px on time step
- Grow to ~900px on form step (taller because of fields)
- Maybe shrink to ~500px on confirmed step

Result: no scrollbars, no awkward empty space, panel hugs your content per step. Clean.

---

## 5. Credentials summary

```
Project: Default project (id 412677)
Public token: phc_zEZzbgTKvzYMic6AkYegUNuCe9E78avUoHMArNP7fcSp
API host: https://us.posthog.com
Dashboard: https://us.posthog.com/project/412677
```

This token is **public** — safe in the client bundle. It's a write-only ingestion key; it can't read data from PostHog.

---

## 6. When you're done

Drop me a quick message with which items shipped (especially #2 and #3b). I'll then:

1. Verify session recording is capturing the iframe content
2. Build the modal_opened → scheduler_loaded → date_selected → time_selected → form_started → form_submitted → booking_confirmed funnel report
3. Send you findings from the first 24-48h of data
4. Drop the parent-side `marginTop:-38px` clipping hacks once your embed page no longer has `py-12`

If anything in this spec is unclear or you'd prefer a different shape (different event names, different property keys, different breakpoints), tell me — I'll adjust the parent side to match whatever's cleanest on your end.

Thanks,
Aaron
