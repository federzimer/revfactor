import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  Clock,
  Flame,
  Hammer,
  Moon,
  Shield,
  SlidersHorizontal,
  Star,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react';

const paths = [
  {
    id: 'live',
    title: 'My property is live',
    text: 'You have an active listing, booking history, and want to know if RevFactor can improve performance.',
    icon: Building2,
  },
  {
    id: 'launching',
    title: "I'm launching soon",
    text: 'You already own or are under contract on a property you plan to launch.',
    icon: Hammer,
  },
  {
    id: 'underwriting',
    title: "I'm evaluating a property",
    text: 'You have a property in mind and want a paid underwriting report before you offer or commit.',
    icon: Calculator,
  },
  {
    id: 'researching',
    title: "I'm still researching",
    text: 'You are learning markets, comparing ideas, or not ready to analyze a specific property yet.',
    icon: BookOpen,
  },
];

const launchStatusOptions = [
  ['under_contract', "I'm under contract", 'You are closing soon and need the launch path.'],
  ['owned', 'I already own it', 'You control the property and are preparing to launch.'],
];

const launchManagerOptions = [
  ['self_delegate', 'I will self-manage and want pricing handled', 'Best fit for RevFactor launch support.'],
  ['self_diy', 'I will self-manage and learn pricing myself', 'Better for a guide, audit, or tool.'],
  ['property_manager', 'I will work with a property manager', 'Pricing control may sit with them.'],
  ['undecided', "I'm not sure yet", 'Route to launch education first.'],
];

const underwritingStageOptions = [
  ['found_property', 'I found a property', 'You have an address, listing, or deal package to evaluate.'],
  ['before_offer', "I'm preparing an offer", 'You want to know what the property can support before you move.'],
  ['comparing', "I'm comparing a few options", 'You want help deciding which property deserves deeper diligence.'],
];

const underwritingReportOptions = [
  ['quick', 'Quick revenue screen', 'A lean estimate to decide if the deal is worth pursuing.'],
  ['full', 'Full underwriting report', 'Revenue range, comp position, assumptions, and launch notes.'],
  ['operator', 'Operator review', 'For buyers who also want feedback on setup, amenities, and management fit.'],
];

const resourceCards = [
  {
    label: 'Free resource',
    title: 'STR Investor Readiness Checklist',
    text: 'A practical checklist for deciding whether a short-term rental is worth pursuing before you need a revenue manager.',
  },
  {
    label: 'Paid resource',
    title: 'STR Investment Playbook',
    text: 'A deeper guide for underwriting, furnishing, launch planning, and setting up the property for revenue upside.',
  },
];

const captureConfigs = {
  liveAnalyzer: {
    eyebrow: 'Revenue analyzer',
    title: 'Send your listing for review.',
    text: 'We will use the Airbnb listing to build the first revenue snapshot and decide whether deeper booking data is worth asking for.',
    cta: 'Request Listing Review',
    successTitle: 'Listing review captured.',
    successText: 'Next step: this lead would receive the initial analyzer result before any calendar is shown.',
    tag: 'live_property_analyzer',
    fields: ['name', 'email', 'phone'],
  },
  launchPlan: {
    eyebrow: 'Launch plan',
    title: 'Get the launch plan started.',
    text: 'We will turn the launch stage, timeline, and management plan into the right checklist or launch pricing prep.',
    cta: 'Request Launch Plan',
    successTitle: 'Launch plan request captured.',
    successText: 'Next step: this lead would receive launch prep before any call is offered.',
    tag: 'launch_plan',
    fields: ['name', 'email', 'phone'],
  },
  launchChecklist: {
    eyebrow: 'Launch checklist',
    title: 'Send the launch resource.',
    text: 'This keeps the lead warm with a practical setup checklist until timing, readiness, and pricing control are clearer.',
    cta: 'Get Launch Checklist',
    successTitle: 'Launch resource captured.',
    successText: 'Next step: send the checklist and keep them in a launch nurture sequence.',
    tag: 'launch_checklist',
    fields: ['name', 'email'],
  },
  redesignChecklist: {
    eyebrow: 'Redesign checklist',
    title: 'Plan the redesign around revenue.',
    text: 'Send a resource focused on layout, amenities, and design decisions that affect short-term rental performance.',
    cta: 'Get Redesign Checklist',
    successTitle: 'Redesign resource captured.',
    successText: 'Next step: send the redesign checklist and invite a deeper review once the launch timeline is clearer.',
    tag: 'redesign_checklist',
    fields: ['name', 'email'],
  },
  underwritingReport: {
    eyebrow: 'Paid underwriting',
    title: 'Start the paid underwriting report.',
    text: 'Collect contact details before checkout or deposit so the property, report type, and decision timing stay attached to the lead.',
    cta: 'Continue To Report',
    successTitle: 'Underwriting request captured.',
    successText: 'Next step: route this to payment, deposit, or manual review depending on the report type.',
    tag: 'paid_underwriting_report',
    fields: ['name', 'email', 'phone'],
  },
  researchFree: {
    eyebrow: 'Free resource',
    title: 'Send the investor checklist.',
    text: 'Capture the lead and send the free checklist for people who are still learning or shopping.',
    cta: 'Send Free Checklist',
    successTitle: 'Checklist request captured.',
    successText: 'Next step: send the free resource and follow up when they have a property in mind.',
    tag: 'research_free_checklist',
    fields: ['name', 'email'],
  },
  researchPaid: {
    eyebrow: 'Paid resource',
    title: 'Send the investment playbook.',
    text: 'Capture buyer intent for the paid STR investment resource.',
    cta: 'Continue To Playbook',
    successTitle: 'Playbook interest captured.',
    successText: 'Next step: route this to the paid guide checkout or waitlist.',
    tag: 'research_paid_playbook',
    fields: ['name', 'email'],
  },
};

function getAnnualRevenueScore(value) {
  const number = Number(String(value).replace(/[$,]/g, ''));
  if (!Number.isFinite(number)) return 0;
  if (number >= 80000) return 22;
  if (number >= 50000) return 16;
  if (number >= 30000) return 10;
  return 4;
}

function parseMoney(value) {
  const number = Number(String(value).replace(/[$,]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function normalizeAirbnbUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      helper: 'Paste the public Airbnb guest listing link.',
    };
  }

  let url;
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Please paste a valid Airbnb listing URL.',
    };
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (!host.includes('airbnb.')) {
    const blockedHost = host.includes('vrbo') ? 'VRBO' : 'direct booking';
    return {
      isValid: false,
      normalizedUrl: '',
      error: `Please use the Airbnb guest listing link, not a ${blockedHost} link.`,
    };
  }

  const roomMatch = url.pathname.match(/\/rooms\/(\d+)/i);
  if (roomMatch?.[1]) {
    return {
      isValid: true,
      normalizedUrl: `https://www.airbnb.com/rooms/${roomMatch[1]}`,
      helper: 'This looks like a public Airbnb listing.',
    };
  }

  const hostingMatch = url.pathname.match(/\/hosting\/listings\/(?:editor\/)?(\d+)/i);
  if (hostingMatch?.[1]) {
    return {
      isValid: true,
      normalizedUrl: `https://www.airbnb.com/rooms/${hostingMatch[1]}`,
      helper: 'We converted your Airbnb hosting link to the public guest listing URL.',
    };
  }

  return {
    isValid: false,
    normalizedUrl: '',
    error: 'Please use a public Airbnb link like https://www.airbnb.com/rooms/123456789.',
  };
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-[12px] font-bold uppercase tracking-[1.7px] text-[#76574C]">
      {label}
      {children}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`min-h-11 rounded-[8px] border border-[#3F261F]/12 bg-white/65 px-3 text-[14px] normal-case tracking-normal text-[#3F261F] outline-none transition-colors placeholder:text-[#8F6E62]/60 focus:border-[#13342D]/50 disabled:cursor-not-allowed disabled:bg-[#DDDAD3]/45 ${className}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="min-h-11 rounded-[8px] border border-[#3F261F]/12 bg-white/65 px-3 text-[14px] normal-case tracking-normal text-[#3F261F] outline-none transition-colors focus:border-[#13342D]/50"
    />
  );
}

function PillButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-left text-[12px] font-bold uppercase tracking-[1.6px] transition-all duration-200 ${
        active
          ? 'border-[#13342D] bg-[#13342D] text-[#E8E6E1]'
          : 'border-[#3F261F]/15 bg-white/45 text-[#3F261F] hover:border-[#13342D]/40'
      }`}
    >
      {children}
    </button>
  );
}

function ChoiceCard({ active, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] border p-4 text-left transition-all duration-200 ${
        active
          ? 'border-[#13342D] bg-[#13342D] text-[#E8E6E1]'
          : 'border-[#3F261F]/12 bg-white/45 text-[#3F261F] hover:border-[#13342D]/35 hover:bg-white/70'
      }`}
    >
      <span className="block text-[14px] font-bold leading-[1.25]">{title}</span>
      <span className={`mt-2 block text-[12px] leading-[1.55] ${active ? 'text-[#E8E6E1]/75' : 'text-[#76574C]'}`}>
        {text}
      </span>
    </button>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div>
      <p className="mb-3 text-[9px] font-bold uppercase tracking-[3px] text-[#7A8B76]">{eyebrow}</p>
      <h2
        className="text-[42px] leading-[1.04] text-[#3F261F]"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
      >
        {title}
      </h2>
      {text && <p className="mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#76574C]">{text}</p>}
    </div>
  );
}

function NextStepPanel({ eyebrow = 'Next step', title, text, children }) {
  return (
    <aside className="rounded-[8px] border border-[#3F261F]/12 bg-white/65 p-5 shadow-[0_18px_60px_rgba(22,25,16,0.08)]">
      <p className="text-[9px] font-bold uppercase tracking-[2.5px] text-[#76574C]">{eyebrow}</p>
      <h3
        className="mt-3 text-[32px] leading-[1.05] text-[#13342D]"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
      >
        {title}
      </h3>
      <p className="mt-4 text-[14px] leading-[1.65] text-[#76574C]">{text}</p>
      {children && <div className="mt-5">{children}</div>}
    </aside>
  );
}

function LiveReportPreview({ details }) {
  const baseAnnualRevenue = details?.annualRevenueUnknown ? 58102 : parseMoney(details?.annualRevenue) || 58102;
  const [revenueMode, setRevenueMode] = useState('unconfirmed');
  const [adjustedRevenue, setAdjustedRevenue] = useState(String(baseAnnualRevenue));
  const [monthsLive, setMonthsLive] = useState('6');
  const adjustedValue = parseMoney(adjustedRevenue) || baseAnnualRevenue;
  const annualRevenue =
    revenueMode === 'partial'
      ? Math.round((adjustedValue / Math.max(1, Number(monthsLive) || 1)) * 12)
      : revenueMode === 'adjusted'
        ? adjustedValue
        : baseAnnualRevenue;
  const annualLift = Math.round(annualRevenue * 0.08);
  const monthlyLift = Math.round(annualLift / 12);
  const projected = annualRevenue + annualLift;
  const confidenceLabel =
    revenueMode === 'confirmed' ? 'Owner-confirmed baseline' : revenueMode === 'partial' ? 'Partial-year projection' : revenueMode === 'adjusted' ? 'Owner-adjusted baseline' : 'AirROI estimate';
  const listing = details?.listingUrl || 'https://www.airbnb.com/rooms/1029127048442041204';
  const seasonality = [
    ['May', 78],
    ['Jun', 116],
    ['Jul', 162],
    ['Aug', 92],
    ['Sep', 112],
    ['Oct', 114],
    ['Nov', 54],
    ['Dec', 60],
    ['Jan', 49],
    ['Feb', 63],
    ['Mar', 77],
    ['Apr', 16],
  ];
  const marketSignals = [
    [Clock, 'Booking window', '50', 'days', 'avg lead time'],
    [Moon, 'Stay length', '3.9', 'nights', 'avg per booking'],
    [BarChart3, 'Supply', '11', 'listings', '+22% YoY'],
    [Flame, 'Seasonality', '913%', '', 'Jul 25 -> Apr 26'],
    [SlidersHorizontal, 'Min nights', '2', 'avg', 'across market'],
  ];
  const insights = [
    [Clock, 'Guests book ~50 days ahead -- a mid-window market. Use pacing reviews every 2 weeks to defend ADR as peak dates approach.'],
    [Moon, 'Typical stay: 3.9 nights -- weekend-dominant market. Set 2-night minimums for Thu-Sun; 1-night for gap-night mid-week fills.'],
    [BarChart3, 'Supply up 22% in the last year -- new competition is entering fast. Photo/listing optimization is critical to defend conversion rate.'],
    [Flame, 'Extreme seasonality: peak RevPAR is 913% above low season. Event-based pricing is the single highest-leverage revenue lever here.'],
    [SlidersHorizontal, 'Market-wide minimum nights average 2 -- standard weekend-minimum market.'],
  ];

  function handleRevenueModeChange(mode) {
    setRevenueMode(mode);
    if (mode === 'partial') {
      setMonthsLive('6');
      setAdjustedRevenue(String(Math.round(baseAnnualRevenue / 2)));
    }
    if (mode === 'adjusted') {
      setAdjustedRevenue(String(baseAnnualRevenue));
    }
  }

  return (
    <div className="mt-6 grid gap-5 bg-[#D9D5CD] p-3 text-[#3F261F] md:p-5">
      <div className="rounded-[16px] bg-white p-4 md:flex md:items-center md:gap-5">
        <img
          src="/images/cabin-hero-1200.webp"
          alt=""
          className="h-40 w-full rounded-[10px] object-cover md:h-36 md:w-56"
        />
        <div className="mt-4 md:mt-0">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF1ED] px-3 py-2 text-[10px] font-bold uppercase tracking-[2px] text-[#5D6D59]">
              <Award className="h-3.5 w-3.5" /> Top performer
            </span>
            <span className="rounded-full bg-[#EEF1ED] px-3 py-2 text-[10px] font-bold uppercase tracking-[2px] text-[#5D6D59]">
              Superhost
            </span>
          </div>
          <h3 className="mt-4 text-[28px] leading-[1.08] text-[#17140F] md:text-[34px]">
            Cozy Private Cabin | Hot Tub, Ski & Outdoor Haven
          </h3>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-[15px] text-[#76574C]">
            <span>3BR</span>
            <span>2BA</span>
            <span>sleeps 8</span>
            <span>Darby, Montana</span>
            <span className="inline-flex items-center gap-1 text-[#5D6D59]"><Star className="h-4 w-4 fill-current" /> 5 (33)</span>
          </p>
          <span className="mt-3 inline-flex rounded-full bg-[#EEF1ED] px-3 py-2 text-[12px] text-[#13342D]">Hot tub</span>
        </div>
      </div>

      <div className="rounded-[16px] border border-[#5D6D59]/20 bg-[#EEF1ED] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#5D6D59]">Estimate basis</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[#76574C]">
              This preview is based on public Airbnb listing data, AirROI-style market signals, and comparable 3BR listings. It may miss direct bookings, owner blocks, PMS adjustments, taxes, fees, and partial-year history.
            </p>
          </div>
          <span className="inline-flex shrink-0 rounded-full bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[2px] text-[#13342D]">
            {confidenceLabel}
          </span>
        </div>
      </div>

      <div className="rounded-[16px] bg-[#08372F] p-6 text-center text-[#E8E6E1] md:p-9">
        <p className="text-[10px] font-bold uppercase tracking-[5px] text-[#A8BBA3]">Potential revenue increase</p>
        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-[58px] leading-none md:text-[74px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {currency(monthlyLift)}<span className="text-[#A8BBA3]">+</span>
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[4px] text-[#A8BBA3]">Per month</p>
          </div>
          <div className="border-[#A8BBA3]/20 md:border-l">
            <p className="text-[58px] leading-none md:text-[74px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {currency(annualLift)}<span className="text-[#A8BBA3]">+</span>
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[4px] text-[#A8BBA3]">Per year</p>
          </div>
        </div>
        <p className="mt-8 text-[36px] italic leading-[1.1]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          You're a top performer -- protect & expand it
        </p>
        <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-[1.7] text-[#E8E6E1]/80">
          Your listing is outpacing similar 3BR hot-tub properties by 145%. The risk now is regression as the comp set adjusts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[12px] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#8F6E62]">Your listing</p>
          <p className="mt-3 text-[38px] leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{currency(annualRevenue)}</p>
          <p className="mt-3 text-[13px] text-[#76574C]">$269 avg · 47.9% occ</p>
        </div>
        <div className="rounded-[12px] bg-[#963D3D] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-white/75">3BR in Darby</p>
          <p className="mt-3 text-[38px] leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$23,717</p>
          <p className="mt-3 text-[13px] text-white/75">$250 avg · 43.0% occ · 11 comps</p>
        </div>
        <div className="rounded-[12px] bg-[#08372F] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#A8BBA3]">Potential with RevFactor</p>
          <p className="mt-3 text-[38px] leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{currency(projected)}</p>
          <p className="mt-3 text-[13px] text-[#A8BBA3]">+8% baseline lift</p>
        </div>
      </div>

      <div className="rounded-[16px] bg-white p-5 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#76574C]">Revenue confirmation</p>
            <h4
              className="mt-2 text-[30px] leading-[1.05] text-[#3F261F]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              Does this revenue look right?
            </h4>
            <p className="mt-3 max-w-2xl text-[14px] leading-[1.65] text-[#76574C]">
              The opportunity only matters if the baseline is close. Confirm it, adjust it, or tell us if this listing has not been live for a full year.
            </p>
          </div>
          <div className="rounded-[8px] bg-[#F7F6F2] px-4 py-3 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[2px] text-[#8F6E62]">Current baseline</p>
            <p className="mt-1 text-[24px] leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{currency(annualRevenue)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['confirmed', 'My revenue looks correct', 'Use this as the baseline for the review.'],
            ['adjusted', 'Adjust revenue', 'Enter the actual trailing 12-month number.'],
            ['partial', "I don't have a full year yet", 'Annualize the current performance carefully.'],
          ].map(([id, title, text]) => (
            <ChoiceCard
              key={id}
              active={revenueMode === id}
              title={title}
              text={text}
              onClick={() => handleRevenueModeChange(id)}
            />
          ))}
        </div>

        {(revenueMode === 'adjusted' || revenueMode === 'partial') && (
          <div className="mt-5 grid gap-4 rounded-[12px] border border-[#3F261F]/10 bg-[#F7F6F2] p-4 md:grid-cols-2">
            <Field label={revenueMode === 'partial' ? 'Revenue so far' : 'Actual annual revenue'}>
              <Input value={adjustedRevenue} onChange={(event) => setAdjustedRevenue(event.target.value)} placeholder="$58,102" />
            </Field>
            {revenueMode === 'partial' ? (
              <Field label="Months live">
                <Select value={monthsLive} onChange={(event) => setMonthsLive(event.target.value)}>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="9">9 months</option>
                  <option value="11">11 months</option>
                </Select>
              </Field>
            ) : (
              <div className="rounded-[8px] border border-[#5D6D59]/20 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5D6D59]">Updated opportunity</p>
                <p className="mt-2 text-[14px] leading-[1.6] text-[#76574C]">
                  The preview now uses your owner-supplied revenue instead of the AirROI estimate.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Public-data estimate', 'AirROI and listing signals are strong, but booking-source coverage may vary.'],
            ['Direct bookings may be missing', 'Owner website, repeat guest, and off-platform reservations can understate performance.'],
            [revenueMode === 'partial' ? 'Partial-year notice' : 'Full-year confidence', revenueMode === 'partial' ? 'This annualizes current production and should be reviewed against seasonality.' : 'Confidence improves with PMS data or an Airbnb earnings export.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[8px] border border-[#3F261F]/10 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#76574C]">{title}</p>
              <p className="mt-2 text-[13px] leading-[1.55] text-[#76574C]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] bg-white p-5 md:p-7">
        <div className="grid gap-6 md:grid-cols-[150px_1fr] md:items-center">
          <div className="grid h-32 w-32 place-items-center rounded-full border-[7px] border-[#5D6D59] text-center text-[#5D6D59]">
            <div>
              <p className="text-[42px] leading-none">A+</p>
              <p className="text-[10px] font-bold tracking-[2px]">96/100</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#76574C]">Pricing health index</p>
            <p className="mt-3 text-[14px] leading-[1.7] text-[#76574C]">
              RevFactor's three-pillar scoring framework, modeled on Federico's Interest / Reliability / Positioning methodology.
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {[
            ['Interest', 100, 'Reviews · Superhost · trust'],
            ['Reliability', 100, 'Guest rating · consistency'],
            ['Positioning', 88, 'ADR · occupancy vs market'],
          ].map(([label, score, note]) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[2px]">
                <span>{label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E8E6E1]">
                <div className="h-full rounded-full bg-[#5D6D59]" style={{ width: `${score}%` }} />
              </div>
              <p className="mt-2 text-[12px] text-[#76574C]">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] bg-white p-5 md:p-7">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[10px] bg-[#EEF1ED] text-[#5D6D59]">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#76574C]">Market intelligence</p>
            <p className="mt-1 text-[14px] text-[#76574C]">Live demand signals for <strong>Darby, Montana.</strong></p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {marketSignals.map(([Icon, label, value, suffix, note]) => (
            <div key={label} className="rounded-[12px] border border-[#3F261F]/10 bg-[#F7F6F2] p-4">
              <Icon className="h-5 w-5 text-[#5D6D59]" />
              <p className="mt-4 text-[9px] font-bold uppercase tracking-[2px] text-[#76574C]">{label}</p>
              <p className="mt-3 text-[30px] leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {value} <span className="text-[13px]">{suffix}</span>
              </p>
              <p className="mt-3 text-[12px] text-[#8F6E62]">{note}</p>
            </div>
          ))}
        </div>
        <div className="mt-7">
          <div className="mb-3 flex justify-between text-[10px] font-bold uppercase tracking-[3px] text-[#76574C]">
            <span>12-month RevPAR seasonality</span>
            <span>Peak $162 · Low $16</span>
          </div>
          <div className="flex h-52 items-end gap-2 rounded-[12px] bg-[#F7F6F2] px-4 pb-8 pt-6">
            {seasonality.map(([month, value]) => (
              <div key={month} className="flex h-full flex-1 flex-col justify-end">
                <div
                  className={`rounded-t-[6px] ${month === 'Jul' ? 'bg-[#5D6D59]' : month === 'Apr' ? 'bg-[#963D3D]' : 'bg-[#BCA8A0]'}`}
                  style={{ height: `${Math.max(8, (value / 162) * 100)}%` }}
                />
                <span className="mt-2 text-center text-[11px] text-[#76574C]">{month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {insights.map(([Icon, text]) => (
            <div key={text} className="flex gap-3 rounded-[8px] border border-[#3F261F]/10 bg-white p-4 text-[14px] leading-[1.55]">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#5D6D59]" />
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] bg-white p-5 md:p-7">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[10px] bg-[#EEF1ED] text-[#5D6D59]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#76574C]">Revenue management playbook</p>
            <p className="mt-1 text-[16px]">2 rules fired on your listing. Stacked combined upside: <strong>~14%</strong> annually.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {[
            [Flame, 'Capture the seasonality swing', 'High impact', '+8% annual', 'Your market has a 913% RevPAR swing between peak and low dates. Most hosts price flat and leave peak money on the table.', 'Set peak-month rates 30-50% above base. Identify local events and price premium weekends 90+ days out.'],
            [Zap, 'Enable Instant Book to lift conversion', 'Medium impact', '+6% annual', "Instant Book is disabled on your listing. Airbnb's algorithm rewards Instant Book with higher placement, and guests convert faster.", 'Enable Instant Book with guest requirements. You control who books -- you just remove the friction.'],
          ].map(([Icon, title, impact, liftText, body, action]) => (
            <div key={title} className="rounded-[12px] border border-[#3F261F]/10 bg-[#F7F6F2] p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#F0E7E5] text-[#963D3D]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[22px] leading-[1.1]">{title}</h4>
                    <span className="rounded-full bg-[#EADFDB] px-3 py-1 text-[9px] font-bold uppercase tracking-[2px] text-[#963D3D]">{impact}</span>
                    <span className="rounded-full bg-[#E6E9E2] px-3 py-1 text-[9px] font-bold text-[#5D6D59]">{liftText}</span>
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.65] text-[#76574C]">{body}</p>
                  <div className="mt-4 rounded-[8px] border border-[#3F261F]/10 bg-white p-4 text-[14px] leading-[1.6]">
                    <span className="mr-2 font-bold uppercase tracking-[2px] text-[#5D6D59]">Action</span>
                    {action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] italic leading-[1.6] text-[#8F6E62]">
          These rules are derived from AirROI-style market data and RevFactor's revenue management methodology. Implementation impact varies by market conditions and execution.
        </p>
      </div>

      <div className="rounded-[16px] bg-white p-5 md:p-7">
        <div className="flex gap-4">
          <Shield className="mt-1 h-8 w-8 shrink-0 text-[#5D6D59]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#76574C]">Top performer strategy</p>
            <p className="mt-3 text-[20px] leading-[1.6]">
              You're positioned well on pricing. RevFactor's edge for top performers: event-based pricing for peak demand windows, daily competitive monitoring to defend rate when new listings undercut you, and pacing-based adjustments that capture the 15-20% margins software alone misses.
            </p>
            <p className="mt-5 border-t border-[#3F261F]/10 pt-4 text-[12px] font-bold uppercase tracking-[3px] text-[#76574C]">
              Case studies &nbsp; Kate Henry: +75% in one month · Kassidy & Erin Warren: +20% monthly · Zoey Berghoff: $30k single booking
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] bg-[#4A261D] p-8 text-center text-[#E8E6E1] md:p-12">
        <h3 className="text-[40px] leading-[1.05]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}>
          Ready to defend & extend this performance?
        </h3>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7] text-[#E8E6E1]/75">
          We'll walk through your specific gap, market opportunities, and exactly how RevFactor would close it.
        </p>
        <button
          type="button"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#E8E6E1] px-7 py-4 text-[10px] font-bold uppercase tracking-[2px] text-[#13342D]"
        >
          Request Revenue Review <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#76574C]">About these projections</p>
        <p className="mx-auto mt-3 max-w-3xl text-[12px] italic leading-[1.7] text-[#8F6E62]">
          Figures shown are estimates derived from live market data, comparable listings, and RevFactor client averages. They are not guarantees of future revenue. Actual results vary by property, seasonality, local market dynamics, guest demand, and operational execution.
        </p>
        <p className="mt-3 break-words text-[11px] text-[#8F6E62]">Listing reviewed: {listing}</p>
      </div>
    </div>
  );
}

function LeadCaptureModal({ config, context, details, initialSubmitted = false, onClose }) {
  const [submitted, setSubmitted] = useState(initialSubmitted);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17140F]/55 px-4 py-6">
      <div
        className={`max-h-[calc(100vh-48px)] w-full overflow-y-auto rounded-[8px] border border-[#E8E6E1]/30 bg-[#E8E6E1] p-5 shadow-[0_24px_80px_rgba(18,20,15,0.28)] md:p-7 ${
          submitted && config.tag === 'live_property_analyzer' ? 'max-w-6xl' : 'max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[2.5px] text-[#7A8B76]">{config.eyebrow}</p>
            <h2
              className="mt-3 text-[34px] leading-[1.05] text-[#3F261F]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              {submitted ? config.successTitle : config.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#3F261F]/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[1.8px] text-[#3F261F]"
          >
            Close
          </button>
        </div>

        {submitted ? (
          config.tag === 'live_property_analyzer' ? (
            <LiveReportPreview details={details} />
          ) : (
            <div className="mt-6 rounded-[8px] border border-[#5D6D59]/20 bg-[#5D6D59]/10 p-5">
              <p className="text-[14px] leading-[1.65] text-[#76574C]">{config.successText}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[2px] text-[#5D6D59]">
                Lead route: {config.tag}
              </p>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <p className="text-[14px] leading-[1.65] text-[#76574C]">{config.text}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.includes('name') && (
                <Field label="Name">
                  <Input required placeholder="Your name" />
                </Field>
              )}
              {config.fields.includes('email') && (
                <Field label="Email">
                  <Input required type="email" placeholder="you@email.com" />
                </Field>
              )}
              {config.fields.includes('phone') && (
                <Field label="Phone">
                  <Input type="tel" placeholder="Optional" />
                </Field>
              )}
            </div>
            {context && (
              <div className="rounded-[8px] border border-[#3F261F]/10 bg-white/55 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#76574C]">Captured context</p>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#76574C]">{context}</p>
              </div>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#13342D] px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-[#E8E6E1]"
            >
              {config.cta} <ArrowRight className="h-4 w-4" />
            </button>
            {config.tag === 'live_property_analyzer' && (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#13342D]/25 px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-[#13342D]"
              >
                Preview Sample Report <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function LivePath({ openCapture }) {
  const [listingUrl, setListingUrl] = useState('');
  const [role, setRole] = useState('owner_self');
  const [intent, setIntent] = useState('delegate');
  const [propertyCount, setPropertyCount] = useState('1');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [annualRevenueUnknown, setAnnualRevenueUnknown] = useState(false);

  const listingStatus = useMemo(() => normalizeAirbnbUrl(listingUrl), [listingUrl]);

  const internalScore = useMemo(() => {
    let total = 24;
    if (listingStatus.isValid) total += 16;
    if (!annualRevenueUnknown) total += getAnnualRevenueScore(annualRevenue);
    if (role === 'owner_self') total += 24;
    if (role === 'owner_pm') total -= 8;
    if (role === 'operator') total += 4;
    if (intent === 'delegate') total += 22;
    if (intent === 'diy') total += 4;
    if (intent === 'consulting') total -= 8;
    if (Number(propertyCount) >= 2) total += 6;
    return Math.max(0, Math.min(total, 100));
  }, [annualRevenue, annualRevenueUnknown, intent, listingStatus.isValid, propertyCount, role]);

  const canAnalyze = listingStatus.isValid && internalScore >= 48;

  function panelCopy() {
    if (!listingUrl.trim()) {
      return {
        title: 'Start with the Airbnb link.',
        text: 'The analyzer needs the guest-side Airbnb listing so we can identify the property and build the right market comparison.',
      };
    }
    if (!listingStatus.isValid) {
      return {
        title: 'Use the Airbnb guest listing.',
        text: listingStatus.error || 'We need the public Airbnb listing URL before we can analyze the property.',
      };
    }
    if (canAnalyze && role === 'owner_self' && intent === 'delegate') {
      return {
        title: 'Run the analyzer first.',
        text: 'Next we would analyze the listing, comps, amenities, and available booking data before showing any call option.',
      };
    }
    if (role === 'owner_pm') {
      return {
        title: 'Start with a revenue check.',
        text: 'If you already work with a property manager, RevFactor is usually not the first layer to add. The next step is understanding whether pricing is actually separate from management.',
      };
    }
    if (role === 'operator') {
      return {
        title: 'Portfolio pricing is a different path.',
        text: 'Co-hosts and property managers may still be a fit, but the economics are different and usually need a premium or portfolio arrangement.',
      };
    }
    if (intent === 'diy') {
      return {
        title: 'Use the self-service path.',
        text: 'If you want to learn pricing yourself, the better next step is a paid audit, guide, or tool instead of a free call.',
      };
    }
    return {
      title: 'Continue to the analyzer.',
      text: 'The next step is a listing analysis and revenue snapshot. The calendar stays hidden until after the analyzer has enough context.',
    };
  }

  const copy = panelCopy();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[8px] border border-[#3F261F]/12 bg-white/55 p-5 md:p-7">
          <SectionHeading
            eyebrow="Live property"
            title="Tell us how your property is managed."
            text="This path is for live properties with real booking history. We are looking for owners who want pricing handled for them, not an open-ended strategy discussion."
          />

          <div className="mt-7 grid gap-5">
            <Field label="Airbnb listing URL">
              <Input
                value={listingUrl}
                onChange={(event) => setListingUrl(event.target.value)}
                placeholder="https://www.airbnb.com/rooms/..."
                aria-invalid={listingUrl.trim() && !listingStatus.isValid ? 'true' : 'false'}
              />
              {listingUrl.trim() && listingStatus.normalizedUrl && listingStatus.normalizedUrl !== listingUrl.trim() && (
                <div className="rounded-[8px] border border-[#5D6D59]/20 bg-[#5D6D59]/10 px-3 py-2 text-[12px] normal-case leading-[1.55] tracking-normal text-[#5D6D59]">
                  {listingStatus.helper} Analyzer URL: {listingStatus.normalizedUrl}
                </div>
              )}
              {listingUrl.trim() && listingStatus.error && (
                <div className="rounded-[8px] border border-[#8B3A3A]/20 bg-[#8B3A3A]/10 px-3 py-2 text-[12px] normal-case leading-[1.55] tracking-normal text-[#8B3A3A]">
                  {listingStatus.error}
                </div>
              )}
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Which best describes you?">
                <Select value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="owner_self">Owner, I self-manage</option>
                  <option value="owner_pm">Owner, I work with a property manager</option>
                  <option value="operator">Co-host / property manager</option>
                </Select>
              </Field>
              <Field label="Properties">
                <Select value={propertyCount} onChange={(event) => setPropertyCount(event.target.value)}>
                  <option value="1">1 property</option>
                  <option value="2">2-4 properties</option>
                  <option value="5">5+ properties</option>
                </Select>
              </Field>
            </div>

            <Field label="Approx annual revenue">
              <Input
                value={annualRevenue}
                onChange={(event) => setAnnualRevenue(event.target.value)}
                placeholder="$65,000"
                disabled={annualRevenueUnknown}
                className={annualRevenueUnknown ? 'opacity-55' : undefined}
              />
            </Field>
            <label className="flex items-center gap-3 rounded-[8px] border border-[#3F261F]/10 bg-white/45 px-3 py-3 text-[14px] leading-[1.45] text-[#3F261F]">
              <input
                type="checkbox"
                checked={annualRevenueUnknown}
                onChange={(event) => {
                  setAnnualRevenueUnknown(event.target.checked);
                  if (event.target.checked) setAnnualRevenue('');
                }}
              />
              I don't know my annual revenue
            </label>
            {annualRevenueUnknown && (
              <p className="-mt-2 text-[12px] leading-[1.55] text-[#76574C]">
                That's ok. We can start with the Airbnb listing and estimate the opportunity before asking for deeper booking data.
              </p>
            )}

            <div>
              <p className="mb-3 text-[12px] font-bold uppercase tracking-[1.7px] text-[#76574C]">What are you looking for?</p>
              <div className="flex flex-wrap gap-2">
                <PillButton active={intent === 'delegate'} onClick={() => setIntent('delegate')}>Delegate pricing</PillButton>
                <PillButton active={intent === 'diy'} onClick={() => setIntent('diy')}>Learn to DIY</PillButton>
                <PillButton active={intent === 'consulting'} onClick={() => setIntent('consulting')}>Consulting only</PillButton>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#5D6D59]/20 bg-[#5D6D59]/10 p-4">
              <p className="text-[12px] font-bold uppercase tracking-[1.7px] text-[#5D6D59]">Data needed now</p>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#76574C]">
                Just the Airbnb listing. If the analyzer finds meaningful upside, we can ask for deeper supporting data later.
              </p>
            </div>
          </div>
        </div>

        <NextStepPanel title={copy.title} text={copy.text}>
          {canAnalyze ? (
            <button
              type="button"
              onClick={() =>
                openCapture(
                  'liveAnalyzer',
                  `Listing: ${listingStatus.normalizedUrl || listingUrl}. Role: ${role}. Goal: ${intent}. Properties: ${propertyCount}.`,
                  {
                    listingUrl: listingStatus.normalizedUrl || listingUrl,
                    role,
                    intent,
                    propertyCount,
                    annualRevenue,
                    annualRevenueUnknown,
                  }
                )
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#13342D] px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-[#E8E6E1]"
            >
              Analyze My Listing <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="rounded-[8px] bg-[#DDDAD3]/70 p-4 text-[13px] leading-[1.6] text-[#76574C]">
              We would continue with a revenue snapshot, resource, paid audit, or follow-up instead of showing the calendar here.
            </div>
          )}
        </NextStepPanel>
      </div>
    </>
  );
}

function LaunchingPath({ openCapture }) {
  const [propertyStatus, setPropertyStatus] = useState('under_contract');
  const [readiness, setReadiness] = useState('ready');
  const [timeline, setTimeline] = useState('0-90');
  const [managerPlan, setManagerPlan] = useState('self_delegate');

  const nearTerm = timeline === '0-90' || timeline === '3-6';
  const readyForReview = readiness === 'ready' && nearTerm && managerPlan === 'self_delegate';
  const needsReno = readiness === 'renovation';
  const readinessOptions = [
    {
      id: 'renovation',
      title: 'Needs renovation / redesign',
      text: 'Layout, amenities, and design still need to be planned before launch.',
    },
    {
      id: 'ready',
      title: propertyStatus === 'under_contract' ? 'Ready to launch after closing' : 'Ready to go live',
      text:
        propertyStatus === 'under_contract'
          ? 'Once you close, the property can move quickly into setup and pricing.'
          : 'The property is close enough that launch pricing and availability matter now.',
    },
  ];

  function panelCopy() {
    if (readyForReview) {
      return {
        title: 'Build the launch plan.',
        text: 'You are close enough to launch that pricing, availability, minimum stays, and the first 90 days should be planned together.',
      };
    }
    if (needsReno) {
      return {
        title: 'Plan the redesign around revenue.',
        text: 'Use revenue goals to shape layout, amenities, design, and budget before the property gets launched.',
      };
    }
    if (managerPlan === 'property_manager') {
      return {
        title: 'Clarify pricing control first.',
        text: 'If a property manager will handle pricing, make sure you know whether pricing can be managed separately from operations.',
      };
    }
    if (managerPlan === 'self_diy') {
      return {
        title: 'Use the DIY path.',
        text: 'If you want to learn pricing yourself, a launch guide, paid audit, or self-serve tool is more useful than a service call.',
      };
    }
    if (timeline === '6+') {
      return {
        title: 'Start with launch prep.',
        text: 'You are early enough that a launch checklist and setup plan is more useful than a call right now.',
      };
    }
    if (nearTerm) {
      return {
        title: 'Create a launch prep plan.',
        text: 'You are close enough to start shaping setup priorities, launch assumptions, and the first 90-day pricing plan.',
      };
    }
    return {
      title: 'Get the right launch resource.',
      text: 'Your next step should match ownership, timeline, renovation, and whether you want pricing handled for you.',
    };
  }

  const copy = panelCopy();
  const actionLabel = readyForReview
    ? 'Build Launch Plan'
    : needsReno
      ? 'Get Redesign Checklist'
      : 'Get Launch Checklist';
  const captureKey = readyForReview ? 'launchPlan' : needsReno ? 'redesignChecklist' : 'launchChecklist';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[8px] border border-[#3F261F]/12 bg-white/55 p-5 md:p-7">
        <SectionHeading
          eyebrow="Launching soon"
          title="Build the right launch path."
          text="This path is for properties you already own or are under contract on. If you are still shopping or about to make an offer, start with the research path."
        />

        <div className="mt-7 grid gap-6">
          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[1.7px] text-[#76574C]">Where are you with the property?</p>
            <div className="grid gap-3 md:grid-cols-2">
              {launchStatusOptions.map(([id, title, text]) => (
                <ChoiceCard
                  key={id}
                  active={propertyStatus === id}
                  title={title}
                  text={text}
                  onClick={() => setPropertyStatus(id)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[1.7px] text-[#76574C]">Launch readiness</p>
            <div className="grid gap-3 md:grid-cols-2">
              {readinessOptions.map((item) => (
                <ChoiceCard
                  key={item.id}
                  active={readiness === item.id}
                  title={item.title}
                  text={item.text}
                  onClick={() => setReadiness(item.id)}
                />
              ))}
            </div>
          </div>

          <Field label="Estimated launch timeline">
            <Select value={timeline} onChange={(event) => setTimeline(event.target.value)}>
              <option value="0-90">0-90 days</option>
              <option value="3-6">3-6 months</option>
              <option value="6+">6+ months</option>
            </Select>
          </Field>

          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[1.7px] text-[#76574C]">How will the property be managed?</p>
            <div className="grid gap-3 md:grid-cols-2">
              {launchManagerOptions.map(([id, title, text]) => (
                <ChoiceCard
                  key={id}
                  active={managerPlan === id}
                  title={title}
                  text={text}
                  onClick={() => setManagerPlan(id)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['Revenue prep', 'Estimate market potential before setup decisions get locked.'],
              ['Launch setup', 'Set first rates, availability, minimum stays, and opening strategy.'],
              ['Next step', 'Get the right checklist, estimate, or launch plan based on timing and setup.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[8px] border border-[#3F261F]/10 bg-white/45 p-4">
                <h3 className="font-bold text-[#3F261F]">{title}</h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#76574C]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NextStepPanel title={copy.title} text={copy.text}>
        <button
          type="button"
          onClick={() =>
            openCapture(
              captureKey,
              `Status: ${propertyStatus}. Readiness: ${readiness}. Timeline: ${timeline}. Management: ${managerPlan}.`
            )
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#13342D] px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-[#E8E6E1]"
        >
          {actionLabel} <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-[12px] leading-[1.6] text-[#76574C]">
          {readyForReview
            ? 'The calendar can come after this plan confirms enough revenue upside and setup urgency.'
            : 'This keeps your next step focused on the right kind of help for your stage.'}
        </p>
      </NextStepPanel>
    </div>
  );
}

function UnderwritingPath({ openCapture }) {
  const [stage, setStage] = useState('found_property');
  const [reportType, setReportType] = useState('full');
  const [propertyTarget, setPropertyTarget] = useState('');
  const [timeline, setTimeline] = useState('this_week');

  const hasTarget = propertyTarget.trim().length >= 6;

  function panelCopy() {
    if (!hasTarget) {
      return {
        title: 'Start with the property.',
        text: 'Paste the address, listing link, Zillow link, Airbnb comp, or deal package so the report is tied to a real opportunity.',
      };
    }
    if (reportType === 'quick') {
      return {
        title: 'Run the quick screen.',
        text: 'This should be a lower-friction paid screen that answers whether the property deserves deeper underwriting.',
      };
    }
    if (reportType === 'operator') {
      return {
        title: 'Add operator context.',
        text: 'This report should include revenue range, comp position, launch notes, amenities, and whether RevFactor would make sense after closing.',
      };
    }
    return {
      title: 'Sell the underwriting report.',
      text: 'This is a paid, pre-offer decision product: revenue potential, assumptions, comp context, and what has to be true for the deal to work.',
    };
  }

  const copy = panelCopy();
  const underwritingActionLabel = !hasTarget
    ? 'Add Property First'
    : reportType === 'quick'
      ? 'Start Quick Screen'
      : 'Start Paid Report';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[8px] border border-[#3F261F]/12 bg-white/55 p-5 md:p-7">
        <SectionHeading
          eyebrow="Underwriting"
          title="Evaluate a property before you commit."
          text="This is a separate paid path for people who have a real property in mind and want RevFactor's revenue view before they make an offer, close, or spend on setup."
        />

        <div className="mt-7 grid gap-6">
          <Field label="Property address or listing link">
            <Input
              value={propertyTarget}
              onChange={(event) => setPropertyTarget(event.target.value)}
              placeholder="Address, Zillow link, listing package, or Airbnb comp"
            />
          </Field>

          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[1.7px] text-[#76574C]">Where are you in the deal?</p>
            <div className="grid gap-3 md:grid-cols-3">
              {underwritingStageOptions.map(([id, title, text]) => (
                <ChoiceCard
                  key={id}
                  active={stage === id}
                  title={title}
                  text={text}
                  onClick={() => setStage(id)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Decision timing">
              <Select value={timeline} onChange={(event) => setTimeline(event.target.value)}>
                <option value="this_week">This week</option>
                <option value="2_weeks">Next 2 weeks</option>
                <option value="30_days">Next 30 days</option>
                <option value="early">Still early</option>
              </Select>
            </Field>
            <Field label="Report type">
              <Select value={reportType} onChange={(event) => setReportType(event.target.value)}>
                {underwritingReportOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {underwritingReportOptions.map(([id, title, text]) => (
              <ChoiceCard
                key={id}
                active={reportType === id}
                title={title}
                text={text}
                onClick={() => setReportType(id)}
              />
            ))}
          </div>

          <div className="rounded-[8px] border border-[#5D6D59]/20 bg-[#5D6D59]/10 p-5">
            <h3 className="font-bold text-[#3F261F]">What the report should answer</h3>
            <p className="mt-2 text-[14px] leading-[1.65] text-[#76574C]">
              What can this property reasonably earn, how does it compare to the market, what assumptions are driving the estimate, and what would need to improve before launch?
            </p>
          </div>
        </div>
      </div>

      <NextStepPanel title={copy.title} text={copy.text}>
        <button
          type="button"
          disabled={!hasTarget}
          onClick={() =>
            openCapture(
              'underwritingReport',
              `Property: ${propertyTarget}. Deal stage: ${stage}. Decision timing: ${timeline}. Report type: ${reportType}.`
            )
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#13342D] px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-[#E8E6E1] disabled:cursor-not-allowed disabled:bg-[#8F6E62]/40"
        >
          {underwritingActionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-[12px] leading-[1.6] text-[#76574C]">
          This path should collect payment or a deposit before the deeper analysis, then send qualified buyers into launch planning later.
        </p>
      </NextStepPanel>
    </div>
  );
}

function ResearchingPath({ openCapture }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[8px] border border-[#3F261F]/12 bg-white/55 p-5 md:p-7">
        <SectionHeading
          eyebrow="Researching"
          title="Learn now. Come back when you are property-ready."
          text="If you do not have a property yet, the right outcome is education, resources, and follow-up rather than a pricing call."
        />

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {resourceCards.map((card) => (
            <div key={card.label} className="rounded-[8px] border border-[#3F261F]/10 bg-white/50 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[2.5px] text-[#7A8B76]">{card.label}</p>
              <h3
                className="mt-3 text-[26px] leading-[1.1] text-[#3F261F]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
              >
                {card.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.65] text-[#76574C]">{card.text}</p>
              <button
                type="button"
                onClick={() => openCapture(card.label === 'Free resource' ? 'researchFree' : 'researchPaid', card.title)}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#13342D]/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[1.8px] text-[#13342D]"
              >
                {card.label === 'Free resource' ? 'Get free guide' : 'View paid guide'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[8px] border border-[#5D6D59]/20 bg-[#5D6D59]/10 p-5">
          <h3 className="font-bold text-[#3F261F]">Follow-up path</h3>
          <p className="mt-2 text-[14px] leading-[1.65] text-[#76574C]">
            Capture email, tag as researching, and send a touchpoint in 60 days to see if you found a property or moved under contract.
          </p>
        </div>
      </div>

      <NextStepPanel
        title="No calendar here."
        text="This path should end with the free resource, paid investing resource, and follow-up. The call comes later, when there is a real property to analyze."
      />
    </div>
  );
}

export default function RevenueCheckFlow() {
  const initialLivePreview =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'live-report';
  const [activePath, setActivePath] = useState(initialLivePreview ? 'live' : null);
  const [capture, setCapture] = useState(
    initialLivePreview
      ? {
          config: captureConfigs.liveAnalyzer,
          context: 'Demo preview report from the live-property funnel.',
          details: {
            listingUrl: 'https://www.airbnb.com/rooms/1029127048442041204',
            annualRevenue: '78000',
            annualRevenueUnknown: false,
          },
          initialSubmitted: true,
        }
      : null
  );
  const selectedPath = paths.find((path) => path.id === activePath);
  const ActiveIcon = selectedPath?.icon ?? TrendingUp;

  function openCapture(key, context, details = null) {
    setCapture({ config: captureConfigs[key], context, details });
  }

  return (
    <section className="bg-[#DDDAD3] px-6 pb-20 pt-32 md:px-12 md:pb-28 md:pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[3px] text-[#7A8B76]">Revenue check</p>
            <h1
              className="max-w-3xl text-[56px] leading-[0.98] text-[#3F261F]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              Check your property's revenue upside.
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.75] text-[#76574C]">
              Start with the path that matches where you are. We will only show a call option when it makes sense.
            </p>
          </div>

          <div className="rounded-[8px] border border-[#3F261F]/12 bg-white/55 p-5">
            <div className="mb-4 flex items-center gap-3 text-[#13342D]">
              <ActiveIcon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-[2px]">
                {selectedPath ? selectedPath.title : 'Choose your path'}
              </span>
            </div>
            <p className="text-[14px] leading-[1.65] text-[#76574C]">
              RevFactor is built for owners who want revenue management handled for them. This flow keeps education, underwriting, launch planning, and service-fit conversations separate.
            </p>
          </div>
        </div>

        {!activePath && (
          <div className="mt-10">
            <p className="mb-4 text-[12px] font-bold uppercase tracking-[2px] text-[#76574C]">Where are you right now?</p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {paths.map((path) => {
                const Icon = path.icon;
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setActivePath(path.id)}
                    className="rounded-[8px] border border-[#3F261F]/12 bg-white/55 p-5 text-left text-[#3F261F] transition-all duration-200 hover:border-[#13342D]/35 hover:bg-white/70"
                  >
                    <Icon className="mb-5 h-5 w-5 text-[#5D6D59]" />
                    <h2 className="font-bold">{path.title}</h2>
                    <p className="mt-2 text-[13px] leading-[1.6] text-[#76574C]">{path.text}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePath && (
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setActivePath(null)}
              className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-[#76574C] hover:text-[#3F261F]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change path
            </button>

            {activePath === 'live' && <LivePath openCapture={openCapture} />}
            {activePath === 'launching' && <LaunchingPath openCapture={openCapture} />}
            {activePath === 'underwriting' && <UnderwritingPath openCapture={openCapture} />}
            {activePath === 'researching' && <ResearchingPath openCapture={openCapture} />}
          </div>
        )}
      </div>
      {capture && (
        <LeadCaptureModal
          config={capture.config}
          context={capture.context}
          details={capture.details}
          initialSubmitted={capture.initialSubmitted}
          onClose={() => setCapture(null)}
        />
      )}
    </section>
  );
}
