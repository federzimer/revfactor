import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

/**
 * QualifierGate — 2-question pre-booking qualifier.
 *
 *   Q1: "Do you have a short-term rental property?"
 *       No  → email capture (no call) → done
 *       Yes → Q2
 *   Q2: "Are you a property management company or a self-host?"
 *       PM   → email capture (no call) → done
 *       Host → onQualified() → parent unmounts QualifierGate + mounts Cal.com
 *
 * Submissions to non-host paths POST to /api/discovery-lead which inserts
 * into public.discovery_leads and emails Aaron + Federico via Resend.
 */
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export default function QualifierGate({ onQualified, onClose }) {
  // Steps: 'q1' | 'q2' | 'email' | 'submitting' | 'done'
  const [step, setStep] = useState('q1');
  const [hasProperty, setHasProperty] = useState(null);
  const [isPM, setIsPM] = useState(null);
  const [email, setEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [propertyCount, setPropertyCount] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [portfolioError, setPortfolioError] = useState(null);
  const [propertyCountError, setPropertyCountError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const cardRef = useRef(null);

  const animateIn = useCallback(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    animateIn();
  }, [step, animateIn]);

  const goToEmail = useCallback(() => {
    setStep('email');
  }, []);

  const submit = useCallback(async () => {
    const e = email.trim().toLowerCase();
    const isPMPath = hasProperty === true && isPM === true;
    const portfolio = portfolioUrl.trim();
    const countStr = propertyCount.trim();
    const countNum = countStr ? Number(countStr) : NaN;

    let hasError = false;
    if (!EMAIL_RX.test(e)) {
      setEmailError('Please enter a valid email.');
      hasError = true;
    } else {
      setEmailError(null);
    }
    if (isPMPath) {
      if (!portfolio) {
        setPortfolioError('Please add a link to your listings, profile, or portfolio.');
        hasError = true;
      } else {
        setPortfolioError(null);
      }
      if (!Number.isFinite(countNum) || countNum < 1) {
        setPropertyCountError('Please enter how many properties you manage.');
        hasError = true;
      } else {
        setPropertyCountError(null);
      }
    } else {
      setPortfolioError(null);
      setPropertyCountError(null);
    }
    if (hasError) return;

    setServerError(null);
    setStep('submitting');

    try {
      const res = await fetch('/api/discovery-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          hasProperty,
          isPM,
          portfolioUrl: isPMPath ? portfolio : null,
          propertyCount: isPMPath ? Math.floor(countNum) : null,
          source: 'modal',
          pageUrl: typeof window !== 'undefined' ? window.location.href : null,
          attribution: (() => {
            try { return JSON.parse(sessionStorage.getItem('rf_attr') || 'null'); } catch { return null; }
          })(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setServerError(data.error || 'Something went wrong. Please try again.');
        setStep('email');
        return;
      }
      window.posthog?.capture('discovery_lead_captured', {
        has_property: hasProperty,
        is_pm: isPM,
        property_count: isPMPath ? Math.floor(countNum) : null,
        has_portfolio_url: isPMPath,
        path: !hasProperty ? 'no_property' : 'pm',
      });
      // Google Ads conversion — Discovery Lead Captured (Secondary, $75)
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-18106897053/MT8ACNTnqbEcEJ2lhbpD',
          value: 75.0,
          currency: 'USD',
        });
        window.gtag('event', 'generate_lead', {
          path: !hasProperty ? 'no_property' : 'pm',
        });
      }
      setStep('done');
    } catch (err) {
      setServerError('Network error. Please try again.');
      setStep('email');
    }
  }, [email, hasProperty, isPM, portfolioUrl, propertyCount]);

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
            data-umami-event="qualifier-q1-yes"
            onClick={() => { setHasProperty(true); setStep('q2'); }}
          >
            Yes, I do
          </button>
          <button
            type="button"
            className="qg-btn qg-btn-secondary"
            data-umami-event="qualifier-q1-no"
            onClick={() => { setHasProperty(false); goToEmail(); }}
          >
            Not yet
          </button>
        </div>
        <button type="button" className="qg-close-text" onClick={onClose}>Cancel</button>
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
            data-umami-event="qualifier-q2-host"
            onClick={() => { setIsPM(false); onQualified({ hasProperty: true, isPM: false }); }}
          >
            I'm a self-host
          </button>
          <button
            type="button"
            className="qg-btn qg-btn-secondary"
            data-umami-event="qualifier-q2-pm"
            onClick={() => { setIsPM(true); goToEmail(); }}
          >
            Property management company
          </button>
        </div>
        <button type="button" className="qg-back-text" onClick={() => setStep('q1')}>← Back</button>
        <QualifierStyles />
      </div>
    );
  }

  // Email capture (no-property OR PM paths)
  if (step === 'email' || step === 'submitting') {
    const isNoProperty = !hasProperty;
    return (
      <div ref={cardRef} className="qg-card">
        <p className="qg-kicker">
          {isNoProperty ? 'DISCOVERY · STAY CLOSE' : 'DISCOVERY · PARTNERSHIP'}
        </p>
        <h3 className="qg-title">
          {isNoProperty
            ? 'Price your first listing right from day one.'
            : 'Let\'s talk partnership.'}
        </h3>
        <p className="qg-sub">
          {isNoProperty
            ? 'Most first-time hosts undercut by 15-30% the first 90 days because they don\'t know what their market actually pays. Drop your email and we\'ll send the getting-started pricing playbook (market reads, rate benchmarks, first-90-days strategy) — plus a heads-up when our pre-property service launches. The Rev Journal lands in your inbox in the meantime.'
            : 'Federico will reach out to walk through how RevFactor\'s revenue layer plugs into a PM portfolio — pricing strategy, calendar, length-of-stay, channel mix. We work alongside the operations team you already run.'}
        </p>
        <form
          className="qg-form"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="qg-input"
            disabled={step === 'submitting'}
            aria-label="Email address"
            aria-invalid={emailError ? 'true' : 'false'}
          />
          {emailError && <p className="qg-error">{emailError}</p>}
          {!isNoProperty && (
            <>
              <input
                type="url"
                inputMode="url"
                required
                placeholder="Listings, profile, or portfolio link"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="qg-input"
                disabled={step === 'submitting'}
                aria-label="Listings, profile, or portfolio link"
                aria-invalid={portfolioError ? 'true' : 'false'}
              />
              {portfolioError && <p className="qg-error">{portfolioError}</p>}
              <input
                type="number"
                inputMode="numeric"
                required
                min="1"
                step="1"
                placeholder="How many properties do you manage?"
                value={propertyCount}
                onChange={(e) => setPropertyCount(e.target.value)}
                className="qg-input"
                disabled={step === 'submitting'}
                aria-label="Number of properties under management"
                aria-invalid={propertyCountError ? 'true' : 'false'}
              />
              {propertyCountError && <p className="qg-error">{propertyCountError}</p>}
            </>
          )}
          {serverError && <p className="qg-error">{serverError}</p>}
          <button
            type="submit"
            className="qg-btn qg-btn-primary qg-btn-full"
            data-umami-event={isNoProperty ? 'qualifier-email-no-property' : 'qualifier-email-pm'}
            disabled={step === 'submitting'}
          >
            {step === 'submitting' ? 'Sending…' : (isNoProperty ? 'Keep me posted' : 'Get in touch')}
          </button>
        </form>
        <button
          type="button"
          className="qg-back-text"
          onClick={() => setStep(isNoProperty ? 'q1' : 'q2')}
          disabled={step === 'submitting'}
        >
          ← Back
        </button>
        <QualifierStyles />
      </div>
    );
  }

  // Done
  return (
    <div ref={cardRef} className="qg-card qg-card-done">
      <div className="qg-checkmark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 className="qg-title">You're in.</h3>
      <p className="qg-sub">
        {!hasProperty
          ? 'Pricing playbook on the way. The Rev Journal will land in your inbox when something interesting drops, and we\'ll flag you the moment the pre-property service ships.'
          : 'Federico will reach out within one business day. Talk soon.'}
      </p>
      <button
        type="button"
        className="qg-btn qg-btn-secondary qg-btn-full"
        onClick={onClose}
      >
        Close
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
      .qg-card-done { text-align: center; padding-top: 48px; }
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
      .qg-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .qg-input {
        width: 100%;
        padding: 14px 16px;
        border: 1px solid #C8C4BC;
        border-radius: 12px;
        background: #FAFAF7;
        color: #3F261F;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        outline: none;
        transition: border-color 160ms ease;
      }
      .qg-input:focus {
        border-color: #13342D;
        background: #FFFFFF;
      }
      .qg-error {
        font-size: 12px;
        color: #8B3A3A;
        margin: -4px 0 0;
      }
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
      .qg-checkmark {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        background: #5D6D59;
        color: #E8E6E1;
        margin: 0 auto 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qg-checkmark svg { width: 26px; height: 26px; }
    `}</style>
  );
}
