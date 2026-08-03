# OIStride Website — Revision Punch List (Round 3)

Builds on Round 2. New findings from live screenshots.

---

## 1. CRITICAL BUG — sections rendering twice on multiple pages

Confirmed on screenshots across several pages, same underlying bug, not separate issues:
- PM/Project Management page: "Ready to build real PM skill?" closing CTA renders twice in a row, each with its own buttons
- About page: "Ready to see if OIStride fits you?" renders twice
- AI Fluency & Building page: "Ready to build something real?" renders twice
- Career Acceleration page: the "This may not be the right fit if—" box appears to duplicate/overflow into an empty box beneath it

**Action:** find the root cause once (likely a shared component/include being rendered twice, or a copy-paste duplication in the page template) rather than deleting the duplicate block on each page individually — check if this pattern exists on every other page too before calling it fixed.

## 2. Program duration — 8 weeks, fixed, not a range

The cohort is a fixed **8-week** program. The individual Project/Product Management detail page already says "8 weeks" correctly. Check the homepage's track-card teaser and any other summary copy — anywhere it says "6–8 week" or similar range, fix to "8-week" / "8 weeks."

## 3. Product Management does not exist as real content yet

Only **Project Management** (Agile PM) has a built, real curriculum right now. When splitting into two programs (per Round 2, item #3):

- **Project Management** → gets the full real page. Reuse everything already built for the current "PM Mastery" page (curriculum, facts table, certificate, FAQ, pricing, cohort selector) — that content IS the Project Management program, just rename/re-route it correctly.
- **Product Management** → build a simple **"Coming Soon"** page only. No fabricated curriculum, no pricing, no cohort dates, no Enroll button. Just: program name, one line explaining it's in development, and a way to register interest (email capture or "notify me" — no hard sell). Do not populate this with placeholder curriculum content — wait for real material from Jed before building it out further.

## 4. Project Management is the one live, paid, active cohort

Confirm Project Management is the program carrying: live cohort dates, spots-left tracker, Enroll & Pay, installment pricing. Product Management has none of this until real content exists (see #3).

## 5. Real service descriptions for the 3 Career Acceleration services

Replace vague one-line blurbs with real depth, per Jed's direction:

- **Land Your First Tech Job:** Everything that prepares someone to land their first tech role — CV-building knowledge and technique, portfolio-building technique, and the full picture of what's needed to go from application to offer. Write this out properly, specific and concrete, not generic.
- **Interview Mastery & Job Search Strategy:** Real strategy and technique to actually pass interviews, plus practical job-search strategy — not just "mock interviews," but what specifically is taught and practiced.
- **Find Your Path in Tech:** For people who are unsure or confused about direction — a personalized, guided walkthrough of tech career tracks leading to a concrete roadmap. Written for someone who doesn't yet know what they want, not someone who's already decided.

Keep each description real and specific, but not overwhelming — this was explicitly requested twice.

---

## Deferred (not yet resolved, do not act on)

- Whether "Talk to a career coach first" stays on the Career Acceleration service cards — Jed's original comment on this wasn't fully clear and he's asked to set it aside for now. Do not remove or change this yet.

---

## Suggested build order (adds to Round 2's order)

1. Fix the duplication bug first — it's cosmetic-critical and likely one root cause across many pages
2. Rename/re-route current PM Mastery content to Project Management
3. Build the Product Management "Coming Soon" page
4. Write and insert real copy for the 3 Career Acceleration services
5. Fix the 8-week duration language wherever it's still a range
6. Continue with the rest of Round 2's list
