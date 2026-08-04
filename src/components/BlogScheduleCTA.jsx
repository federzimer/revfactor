import { useState } from 'react';
import ScheduleModal from './ScheduleModal';

/* Tiny client island for blog post bottom CTA — opens the schedule modal
   instead of routing to /review. */
export default function BlogScheduleCTA({ label = 'schedule a Discovery Call →' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { window.posthog?.capture('schedule_modal_opened', { source: 'blog' }); window.rfTrack?.('schedule-cta-click', { source: 'blog-bottom', page: location.pathname }); setOpen(true); }}
        className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#E8E6E1] text-[#13342D] font-bold uppercase text-[10px] tracking-[2px] rounded-full hover:bg-white transition-colors duration-200 cursor-pointer"
      >
        {label}
      </button>
      {open && <ScheduleModal onClose={() => setOpen(false)} />}
    </>
  );
}
