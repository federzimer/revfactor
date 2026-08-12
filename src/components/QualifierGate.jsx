import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { GHL_FORM_NO_LISTING, GHL_FORM_PM, withTrackingParams, loadGhlEmbedScript } from '../data/ghl.ts';

/**
 * QualifierGate — 2-question pre-booking qualifier.
 *
 *   Q1: "Do you have a short-term rental property?"
 *       No  → GHL "no listing" form (email capture, no call)
 *       Yes → Q2
 *   Q2: "Are you a property management company or a self-host?"
 *       PM   → GHL partnership form (portfolio details, Federico follows up)
 *       Host → onQualified() → parent unmounts QualifierGate + mounts the
 *              GHL booking widget
 *
 * Non-host paths embed GoHighLevel forms (src/data/ghl.ts) — submissions
 * land directly in the GHL CRM. The old /api/discovery-lead endpoint is
 * dormant, not deleted.
 */

// GHL form iframes announce a submission to the parent via postMessage
// arrays where data[0] is the action. 'set-sticky-contacts' fires on submit
// (community-documented; requires Sticky Contacts enabled on the form).
// Extensible list in case GHL ships new message variants.
const LEAD_MESSAGE_TYPES = ['set-sticky-contacts'];

export default function QualifierGate({ onQualified, onClose }) {
  // Steps: 'q1' | 'q2' | 'form'
  const [step, setStep] = useState('q1');
  const [hasProperty, setHasProperty] = useState(null);
  const [isPM, setIsPM] = useState(null);
  const cardRef = useRef(null);

  const animateIn = useCallback(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    animateIn();
  }, [step, animateIn]);

  const goToForm = useCallback(() => {
    setStep('form');
  }, []);

  const isNoProperty = !hasProperty;

  // Compute once per branch so the iframe src doesn't churn across renders.
  const formSrc = useMemo(
    () => withTrackingParams(isNoProperty ? GHL_FORM_NO_LISTING : GHL_FORM_PM),
    [isNoProperty]
  );

  // While the GHL form is mounted: load form_embed.js (auto-resize) and
  // listen for the submission message to fire lead tracking parity —
  // PostHog + Umami + the $75 Google Ads conversion the old first-party
  // form used to fire on POST success.
  useEffect(() => {
    if (step !== 'form') return;
    loadGhlEmbedScript();
    const path = isNoProperty ? 'no-property' : 'pm';
    const onMsg = (e) => {
      if (!Array.isArray(e.data) || !LEAD_MESSAGE_TYPES.includes(e.data[0])) return;
      if (window.__rfLeadFired) return;
      window.__rfLeadFired = true;
      window.posthog?.capture('discovery_lead_captured', {
        has_property: hasProperty,
        is_pm: isPM,
        path: isNoProperty ? 'no_property' : 'pm',
      });
      window.rfTrack?.('lead-captured', { path });
      // Google Ads conversion — Discovery Lead Captured (Secondary, $75)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-18106897053/MT8ACNTnqbEcEJ2lhbpD',
          value: 75.0,
          currency: 'USD',
        });
        window.gtag('event', 'generate_lead', {
          path: isNoProperty ? 'no_property' : 'pm',
        });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [step, isNoProperty, hasProperty, isPM]);

  // Q1 — has property
  if (step === 'q1') {
    return (
      <div ref={cardRef} className="qg-card">
        <p className="qg-kicker">DISCOVERY · STEP 1 OF 2</p>
        <h3 className="qg-title">Do you have a short-term rental property?</h3>
        <p className="qg-sub">RevFactor is a managed revenue-management service. Let's make sure we're a fit before we put a meeting on your calendar.</p>
        <div className="qg-buttons">
          <button
            type="button"
            className="qg-btn qg-btn-primary"
            data-umami-event="qualifier-step"
            data-umami-event-step="q1"
            data-umami-event-answer="yes"
            onClick={() => { setHasProperty(true); setStep('q2'); }}
          >
            Yes, I do
          </button>
          <button
            type="button"
            className="qg-btn qg-btn-secondary"
            data-umami-event="qualifier-step"
            data-umami-event-step="q1"
            data-umami-event-answer="no"
            onClick={() => { setHasProperty(false); goToForm(); }}
          >
            Not yet
          </button>
        </div>
        <button
          type="button"
          className="qg-close-text"
          data-umami-event="qualifier-step"
          data-umami-event-step="q1"
          data-umami-event-answer="cancel"
          onClick={onClose}
        >
          Cancel
        </button>
        <QualifierStyles />
      </div>
    );
  }

  // Q2 — PM vs self-host
  if (step === 'q2') {
    return (
      <div ref={cardRef} className="qg-card">
        <p className="qg-kicker">DISCOVERY · STEP 2 OF 2</p>
        <h3 className="qg-title">Are you a property management company or a self-host?</h3>
        <p className="qg-sub">Different fit. Self-hosts get a Discovery Call. Property management companies — we'd love to talk partnership.</p>
        <div className="qg-buttons">
          <button
            type="button"
            className="qg-btn qg-btn-primary"
            data-umami-event="qualifier-step"
            data-umami-event-step="q2"
            data-umami-event-answer="host"
            onClick={() => { setIsPM(false); onQualified({ hasProperty: true, isPM: false }); }}
          >
            I'm a self-host
          </button>
          <button
            type="button"
            className="qg-btn qg-btn-secondary"
            data-umami-event="qualifier-step"
            data-umami-event-step="q2"
            data-umami-event-answer="pm"
            onClick={() => { setIsPM(true); goToForm(); }}
          >
            Property management company
          </button>
        </div>
        <button
          type="button"
          className="qg-back-text"
          data-umami-event="qualifier-step"
          data-umami-event-step="q2"
          data-umami-event-answer="back"
          onClick={() => setStep('q1')}
        >
          ← Back
        </button>
        <QualifierStyles />
      </div>
    );
  }

  // GHL form (no-property OR PM paths) — the form carries its own heading
  // and thank-you screen; form_embed.js auto-resizes the iframe.
  return (
    <div ref={cardRef} className="qg-card">
      <p className="qg-kicker">
        {isNoProperty ? 'DISCOVERY · STAY CLOSE' : 'DISCOVERY · PARTNERSHIP'}
      </p>
      <iframe
        src={formSrc}
        id={isNoProperty ? 'ghl-form-no-listing' : 'ghl-form-pm'}
        title={isNoProperty ? 'Stay close to RevFactor' : 'Partner with RevFactor'}
        data-ghl-form={isNoProperty ? 'no-listing' : 'pm'}
        scrolling="no"
        style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: 420 }}
      />
      <button
        type="button"
        className="qg-back-text"
        data-umami-event="qualifier-step"
        data-umami-event-step="form"
        data-umami-event-answer="back"
        onClick={() => setStep(isNoProperty ? 'q1' : 'q2')}
      >
        ← Back
      </button>
      <QualifierStyles />
    </div>
  );
}

function QualifierStyles() {
  return (
    <style>{`
      .qg-card {
        padding: 36px 32px 32px;
        font-family: Helvetica, Arial, sans-serif;
        color: #3F261F;
      }
      .qg-kicker {
        font-weight: 700;
        font-size: 9px;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        color: #5D6D59;
        margin: 0 0 14px;
      }
      .qg-title {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-weight: 500;
        font-size: clamp(24px, 3.4vw, 32px);
        line-height: 1.15;
        color: #3F261F;
        margin: 0 0 12px;
        letter-spacing: 0.3px;
      }
      .qg-sub {
        font-size: 14px;
        line-height: 1.55;
        color: #76574C;
        margin: 0 0 24px;
      }
      .qg-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      @media (min-width: 480px) {
        .qg-buttons { flex-direction: row; }
      }
      .qg-btn {
        flex: 1;
        padding: 14px 22px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform 160ms ease, background 180ms ease, color 180ms ease;
      }
      .qg-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
      .qg-btn:hover:not(:disabled) { transform: translateY(-1px); }
      .qg-btn-primary {
        background: #13342D;
        color: #E8E6E1;
      }
      .qg-btn-primary:hover:not(:disabled) { background: #1E4A40; }
      .qg-btn-secondary {
        background: #FFFFFF;
        color: #3F261F;
        border-color: #C8C4BC;
      }
      .qg-btn-secondary:hover:not(:disabled) { border-color: #3F261F; }
      .qg-btn-full { width: 100%; flex: none; }
      .qg-back-text, .qg-close-text {
        background: none;
        border: 0;
        margin: 18px 0 0;
        padding: 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #8F6E62;
        cursor: pointer;
        transition: color 160ms ease;
      }
      .qg-back-text:hover, .qg-close-text:hover { color: #3F261F; }
    `}</style>
  );
}
