# Correction to commit e0dd976

That commit message states:

> "They are already profiled in our own vendor listicle. Nobody had checked
>  whether they advertise."

**The first sentence is wrong.** Pricing By Mira is not profiled in any published
page. `grep -rniE "mira" src/content/ src/pages/ src/data/` returns nothing.

What is actually true: they were added as a *candidate* to
`scripts/capture_vendor_visuals.cjs` and `capture_vendor_logos.cjs` in May 2026,
which is why `public/photos/blog/vendor-screenshots/pricing-by-mira*.{png,webp}`
exists. They were never written into the listicle.

How the error happened: the claim was inferred from the presence of the screenshot
file, not read from the content. A captured asset proves a vendor was *considered*,
never that it *shipped*. That is the proxy-instead-of-source failure mode.

The substantive finding is unaffected: they have been a known name in our research
pipeline since May while running paid ads on our positioning since June 1.

The shared Google Doc has been corrected.
