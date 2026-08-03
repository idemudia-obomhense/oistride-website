# OIStride Website — Handoff Notes

Static HTML/CSS/JS marketing site for OIStride (Obomhense "Jed" Idemudia's practice-led training company). Built in a Claude.ai chat sandbox — this is the handoff point to continue in Claude Code with real Git/deployment.

## What this is

A multi-page front-end prototype. **No backend yet** — forms are demo-only (JS redirects to thank-you.html, nothing is actually submitted/emailed/charged). See "What's NOT done" below before treating anything as production-ready.

## Structure

```
index.html                  Homepage (NOT yet reworked with latest flow — see below)
program-pm-mastery.html      PM & Product Mastery cohort — flagship program
program-career.html          Career Acceleration track (3 services)
program-ai.html              AI Fluency & Building track (3 services)
checkout.html                Unified checkout for all programs (?program=slug)
brochure-pm-mastery.html     Email-gated brochure download
book-a-call.html             Consultation booking (Calendly placeholder + fallback form)
about.html                   Mission/vision, journey timeline, founder bio
consulting.html               Consulting offerings (lightweight, Phase 1 scope)
contact.html                  Contact form
faq.html                      FAQ
thank-you.html                Shared confirmation page (?type=payment|brochure|call)
assets/css/style.css          All styles, design tokens at top of file
assets/js/main.js             Mobile nav, scroll reveal, FAQ accordion, price toggle, demo form redirect
assets/img/                   Logo files (light + dark variants)
assets/downloads/             Real PM Mastery brochure PDF
```

## Design system (already locked in — don't redesign, extend)

- Colors: `--navy: #14183B` (primary/dark), `--indigo: #4F46E5` (accent/CTA), `--bg-soft: #F8F9FE`
- Type: Manrope ExtraBold (headings), Inter (body) — loaded via Google Fonts
- Radius: 20px (`--radius`), 12px for small elements (`--radius-sm`)
- Full token list at the top of `assets/css/style.css`

## Current flow logic (as of this handoff)

- **Every program/service** → direct "Enroll & Pay" → `checkout.html?program=<slug>` → `thank-you.html?type=payment`
- **"Book a Free Consultation"** is a secondary, optional path everywhere (nav, footer, soft links under pricing) — never a required gate before payment
- **PM Mastery only** has a cohort-month selector + spots-left bar (rotates monthly — Nov/Dec/Jan currently hardcoded, needs to become dynamic or manually updated each month)
- Brochure download (`brochure-pm-mastery.html`) is email-gated, then delivers the real PDF from `assets/downloads/`

## What's NOT done yet

1. **Homepage (`index.html`) hasn't been reworked** to match the latest flow/inspiration pass — it still reflects an earlier iteration. This is the next thing to build.
2. **No real payment processor.** Checkout is a static form. Needs Stripe and/or Paystack integration.
3. **No real form backend.** Nothing is actually emailed or stored anywhere.
4. **No Calendly embed** — `book-a-call.html` has a placeholder container with instructions.
5. **No CMS/admin panel.** All content edits currently require editing HTML directly.
6. **Placeholder content still in place:** `[ Price ]` throughout, cohort dates are hardcoded examples, case-study proof points, trust-bar numbers, testimonials, founder photo. See the full PRD (`OIStride_Website_PRD_v2.md`) §17 and §26 for the content-gathering checklist — **do not launch with invented statistics.**
7. **Career/AI service pages** currently show one flat price per service — a tiered pricing structure (single session / multi-session package) was discussed as a possible improvement, not yet built.

## Reference documents (not in this folder — provided separately)

- `OIStride_Website_PRD_v2.md` — full product spec, phasing plan, content checklist
- `OIStride_CAC_Business_Profile.docx` — company overview (source of About page copy)
- `OIStride_Slide_Template.pptx` — brand deck template (same design tokens)
- Brand kit (logo/icon SVGs, Google Meet backdrop) — separate delivery

## Suggested next steps in Claude Code

1. `git init`, commit this as the baseline
2. Rework `index.html` to match the current flow/design pass
3. Wire a real form backend (even a simple one) before connecting payments
4. Add Stripe/Paystack to `checkout.html`
5. Replace all `[ Price ]` and placeholder content once real figures are provided
