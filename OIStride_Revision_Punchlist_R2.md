# OIStride Website — Revision Punch List (Round 2)

Source: live screenshot review by Jed. Each item is a discrete, unambiguous fix. Grouped by type, not by page, so nothing gets missed.

---

## 1. Brand color — CRITICAL, site-wide

The current accent (`--indigo: #4F46E5`) is **not** the logo's actual color. Pull the exact blue from the approved logo file (`OIStride_Logo_Final.svg` — navy blue in the icon and "OI" text, approx `#223889`) and replace `--indigo` everywhere with that exact value. Generate a lighter tint of the same blue for hover/active states (don't invent an unrelated lighter purple). This affects every button, link, and accent across every page — check all of them after the swap, not just the homepage.

## 2. Navigation — active state + home

- Add an active/current-page indicator to the nav (Programs / Consulting / About / FAQ) — underline, bold, or filled pill, whichever matches the design system — so visitors always know which page they're on.
- Confirm the logo (top-left) always links back to `index.html` from every page. If it doesn't currently, fix it — that's the primary "way home" affordance.

## 3. Split "PM & Product Mastery" into two separate programs — STRUCTURAL CHANGE

Project Management and Product Management are **two distinct cohorts**, not one combined program. Restructure:
- Retire the single `program-pm-mastery.html` combined page.
- Create `program-project-management.html` — its own cohort (dates, curriculum, pricing, certificate).
- Create `program-product-management.html` — its own cohort (dates, curriculum, pricing, certificate).
- Update every place that currently links to the old combined program: homepage program grid, nav dropdown, footer links, featured deep-dive section.
- Follow the 10Alytics/SmartHub pattern referenced earlier — each specialization gets its own card and its own page, the way "Become a Data Analyst" and "Become a Business Analyst" are separate, not merged.

## 4. Homepage must show real sub-services, not just track teasers

Under each track section on the homepage, list the actual named services — e.g. under Career Acceleration, show "Land Your First Tech Job," "Interview Mastery & Job Search Strategy," "Find Your Path in Tech" as visible items, not a single generic blurb. Visitors should see what's inside each track without clicking through.

## 5. Copy — remove all em-dash ("—") stylistic formatting

The eyebrow-style labels and bullet formatting using "—" (e.g. "GROW — Career Acceleration," dash-prefixed list items) read as AI-generated filler. Remove the "—" character from all labels/eyebrows/bullets site-wide. Replace with plain labels, or a small icon/dot if a visual marker is needed — not a dash.

## 6. Every service/program needs full detail before purchase — no exceptions

Right now only the (soon-to-be-split) PM Mastery page has real depth (facts table, curriculum, certificate). Every individual service — the 3 Career Acceleration services, the 3 AI Fluency services, and both new Project/Product Management cohorts — needs the same treatment, matching 10Alytics/SmartHub course-page depth:
- What's included (specific, not vague)
- Format (sessions, length, cadence)
- Full session-by-session or module breakdown
- Who it's for
- FAQ specific to that service

No service should be sellable off a two-line card description alone.

## 7. Card/page flow — "View Program" first, "Enroll Now" at the bottom

Every program/service card's primary, most visible action should be **"View Program"** (→ the full detail page from #6). "Enroll Now" should NOT be the first thing offered on a card — it belongs at the **bottom of the detail page**, after the visitor has read everything. Right now some cards jump straight to "Enroll & Pay" with no detail step in between — fix this ordering everywhere: card → View Program (detail page, full info) → Enroll Now (bottom, after curriculum/FAQ).

## 8. Copy — rewrite vague service descriptions

For each of the 6 individual services, write specific, concrete copy describing exactly what it teaches/delivers — no vague marketing language, but also not overwhelming. Example: "Land Your First Tech Job" copy should clearly state what's covered (LinkedIn overhaul specifics, CV rebuild specifics, portfolio coaching specifics) rather than a generic one-line summary.

## 9. Installment terms — 70/30 split, not 3 monthly payments

Replace every instance of "Pay Monthly" / "3 monthly payments" with a **70/30 installment**: 70% due to enroll, 30% due later (confirm exact timing — before cohort start, or before completion — with Jed before finalizing copy). This affects:
- The price-toggle component (`Pay in Full` / `Pay Monthly` → `Pay in Full` / `70/30 Installment`) on both new Project/Product Management pages
- The "Or split into 3 monthly payments at checkout" note under Career/AI service pricing → "Or pay 70% now, 30% later"
- `checkout.html`'s pricing summary panel

## 10. Checkout page — visual alignment check

Flagged as possibly misaligned — awaiting a specific screenshot from Jed to confirm the exact issue before fixing.

## 11. Confirm "See Full Curriculum" actually lands on curriculum content

On the homepage's featured program section, verify the "See Full Curriculum" link scrolls/navigates to an actual, visible curriculum breakdown on the target page — not just the top of the page.

---

## Suggested build order

1. Brand color swap (#1) — fastest, highest visual impact, touches every page
2. Nav active state + home link confirmation (#2)
3. Em-dash cleanup (#5) — quick, mechanical
4. Split Project/Product Management into two programs (#3) — biggest structural piece, do before building out full detail content so it's not duplicated
5. Build out full detail sections for all 6 services + 2 new cohort pages (#6, #7, #8)
6. Installment terms correction (#9)
7. Homepage sub-service visibility (#4)
8. Checkout alignment fix once screenshot is provided (#10)
9. Curriculum-link verification (#11)
