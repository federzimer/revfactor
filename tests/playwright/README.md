# Playwright tests — qa-flow-tester skill

This directory holds end-to-end functional tests for user-facing flows in this project.

## Setup (one-time, when you write the first test)

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Copy the config + spec template from the skill:

```bash
cp ~/.claude/skills/qa-flow-tester/templates/playwright.config.js ./playwright.config.js
cp ~/.claude/skills/qa-flow-tester/templates/example.spec.js ./tests/playwright/specs/<flow-name>.spec.js
```

## Run

```bash
npx playwright test --reporter=list
```

Artifacts produced (gitignored):
- `tests/playwright/reports/.../video.webm` — full session recording
- `tests/playwright/screenshots/*.png` — per-step stills

## What to test

See [`~/.claude/skills/qa-flow-tester/SKILL.md`](../../../.claude/skills/qa-flow-tester/SKILL.md) for the decision tree and recipes:
- Forms / multi-step forms / signup
- Lead-gen quizzes / calculators / scan tools
- Checkout / payment (Stripe test mode)
- Booking widgets / scheduler embeds
- Newsletter signup with double opt-in (chain via Gmail MCP)

## Working example

`/Users/aaronwhittaker/Claude/cynthiastayscurated/tests/playwright/specs/travel-quote.spec.js` is the live-tested reference — copy its patterns (error collection, screenshot helper, real-submit gate via `ALLOW_REAL_SUBMIT` env).
