---
type: Reference Concept
title: ADR vs RevPAR for Airbnb Hosts
description: Definitions of ADR and RevPAR and why RevPAR is the metric that actually runs short-term rental revenue.
resource: https://www.revfactor.io/blog/adr-vs-revpar-airbnb-hosts/
tags: [adr, revpar, str-metrics, airbnb]
timestamp: 2026-06-23T00:00:00Z
---

# ADR vs RevPAR

- **ADR (Average Daily Rate):** the average nightly price for booked nights. It measures price, not how full you are.
- **RevPAR (Revenue Per Available Rental night):** revenue divided by all available nights, booked or not. It combines price and occupancy into one number.

A high ADR with low occupancy can still mean weak RevPAR. RevPAR is the metric that reflects how well a listing converts available nights into revenue, which is why RevFactor optimizes for it rather than chasing nightly rate alone. See [dynamic pricing for STR](/okf/dynamic-pricing.md).
