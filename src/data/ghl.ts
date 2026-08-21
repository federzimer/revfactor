/**
 * GoHighLevel (LeadConnector) widget endpoints: single source of truth.
 *
 * All three discovery-call destinations live in GHL (white-labeled at
 * links.revfactor.io). form_embed.js must be loaded on the parent page for
 * GHL iframes to auto-resize (it bundles iframe-resizer and sets
 * iframe.style.height directly, so never impose fixed heights on GHL iframes).
 */
export const GHL_ORIGIN = 'https://links.revfactor.io';

export const GHL_FORM_NO_LISTING = `${GHL_ORIGIN}/widget/form/SUQXaS425Xuw41mNz3sh`;
export const GHL_FORM_PM = `${GHL_ORIGIN}/widget/form/bEBHJS1TYGvMd92gaafL`;
export const GHL_BOOKING = `${GHL_ORIGIN}/widget/booking/lArwJ0BFe3TYOsCYHfet`;

export const GHL_EMBED_SCRIPT = `${GHL_ORIGIN}/js/form_embed.js`;

/** Query-param keys forwarded into GHL widget URLs so the CRM record carries
 *  campaign attribution. GHL reads UTMs off the iframe URL itself. */
const FORWARDED = (k: string) =>
  k.startsWith('utm_') || k.startsWith('gad_') || k === 'gclid' || k === 'msg';

/**
 * Append forwarded tracking params to a GHL widget URL. Current-URL params
 * win; sessionStorage `rf_attr` (first-touch attribution, written by
 * BaseLayout) fills in keys lost to prior navigation. SSR-safe.
 */
export function withTrackingParams(base: string): string {
  if (typeof window === 'undefined') return base;
  const out = new URLSearchParams();
  try {
    const attr = JSON.parse(sessionStorage.getItem('rf_attr') || 'null');
    if (attr && typeof attr === 'object') {
      for (const [k, v] of Object.entries(attr)) {
        if (FORWARDED(k) && typeof v === 'string') out.set(k, v);
      }
    }
  } catch {
    /* attribution blob is best-effort */
  }
  for (const [k, v] of new URLSearchParams(window.location.search)) {
    if (FORWARDED(k)) out.set(k, v);
  }
  const qs = out.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * GHL BOOKING widgets don't use form_embed.js's resize path (that script
 * only binds iframe-resizer to iframes that announce 'iframeLoaded', which
 * forms do and booking widgets don't). Booking widgets instead post
 * ['highlevel.setHeight', { height }] arrays. Handle those ourselves,
 * locating the emitting iframe by its contentWindow.
 */
declare global {
  interface Window {
    __rfGhlResizeHandler?: boolean;
  }
}

function ensureGhlResizeHandler(): void {
  if (window.__rfGhlResizeHandler) return;
  window.__rfGhlResizeHandler = true;
  window.addEventListener('message', (e: MessageEvent) => {
    if (!Array.isArray(e.data) || e.data[0] !== 'highlevel.setHeight') return;
    const h = Number(e.data[1]?.height);
    if (!Number.isFinite(h) || h <= 0 || h > 3000) return;
    for (const f of document.querySelectorAll<HTMLIFrameElement>(`iframe[src^="${GHL_ORIGIN}"]`)) {
      if (f.contentWindow === e.source) {
        f.style.height = `${h}px`;
        break;
      }
    }
  });
}

/**
 * Idempotently inject GHL's form_embed.js into the page. Called on demand
 * from every component that mounts a GHL iframe, so the 34KB script stays
 * off pages that never open a widget. form_embed.js has its own internal
 * double-init guards, but avoid duplicate tags anyway.
 */
export function loadGhlEmbedScript(): void {
  if (typeof document === 'undefined') return;
  ensureGhlResizeHandler();
  if (document.querySelector(`script[src="${GHL_EMBED_SCRIPT}"]`)) return;
  const s = document.createElement('script');
  s.src = GHL_EMBED_SCRIPT;
  s.async = true;
  document.head.appendChild(s);
}
