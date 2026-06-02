# Revenue Check Funnel Notes

## Current paths

### My property is live
Purpose: low-friction analyzer for existing Airbnb listings.

Inputs:
- Airbnb listing URL
- Owner/operator role
- Property count
- Approx annual revenue, optional
- Desired help: delegate pricing, DIY, or consulting

CTA:
- Analyze My Listing

Lead route:
- `live_property_analyzer`

Next build:
- Connect the CTA to lead storage.
- Run listing URL validation server-side.
- Generate the preview report before showing any calendar.

### I'm launching soon
Purpose: launch prep for people who already own or are under contract.

Inputs:
- Under contract or already owned
- Launch readiness: needs renovation/redesign or ready to launch
- Estimated launch timeline
- Management plan

CTA routes:
- Build Launch Plan
- Get Launch Checklist
- Get Redesign Checklist

Lead routes:
- `launch_plan`
- `launch_checklist`
- `redesign_checklist`

Next build:
- Turn the launch plan into a scored checklist.
- Only show scheduling after the launch plan confirms near-term timing and pricing-control fit.

### I'm evaluating a property
Purpose: paid underwriting product for buyers with a specific property in mind.

Inputs:
- Property address or listing link
- Deal stage
- Decision timing
- Report type

Report options:
- Quick revenue screen
- Full underwriting report
- Operator review

Lead route:
- `paid_underwriting_report`

Next build:
- Add checkout/deposit.
- Define report pricing and turnaround.
- Connect property data to AirROI / comps workflow.

### I'm still researching
Purpose: education and nurture for people without a specific property ready.

CTA routes:
- Free investor checklist
- Paid STR investment playbook

Lead routes:
- `research_free_checklist`
- `research_paid_playbook`

Next build:
- Connect resource delivery.
- Add a follow-up sequence for people who later move into underwriting or launch.

## Backend needed

- Lead table with path, route tag, contact fields, captured context, and created timestamp.
- Optional payment intent table for paid underwriting and paid resources.
- Email automation hooks for checklist, playbook, analyzer received, launch plan received, and underwriting next steps.
- Admin view or Slack/email notification for high-intent leads.

## Important funnel rule

Do not offer a call at the top of the funnel. Calls should appear only after the path proves the lead has a property, timing, and a reason RevFactor can help.
