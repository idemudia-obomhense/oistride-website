// OIStride — minimal server-side Supabase REST helpers.
//
// No @supabase/supabase-js dependency on purpose, so these functions have
// zero npm dependencies (Node 18+ on Vercel has global fetch already).
// Uses the SERVICE ROLE key, which bypasses Row Level Security entirely —
// that's required here because webhooks and the initialize endpoint act on
// enrollment rows without a logged-in browser session to satisfy the
// existing "auth.uid() = user_id" RLS policies. Treat this key with the
// same care as the Paystack secret key: server-side env var only, never
// sent to the browser, never committed.

const SUPABASE_URL = "https://vtksigpknclznngtjhgg.supabase.co";
// Same public anon key already hardcoded in assets/js/supabase-config.js —
// safe to duplicate (it's designed to be exposed client-side; RLS is what
// actually protects the data), only used here to satisfy Supabase Auth's
// /auth/v1/user endpoint, which requires an apikey header alongside the
// user's own access token.
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a3NpZ3BrbmNsem5uZ3RqaGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDg3MzMsImV4cCI6MjEwMTYyNDczM30.8HHLv9fgWCZ2tIhjLhiqIOaRj9rxOP7Q8QS9ZpQ1WFc";

function requireServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel -> Project -> Settings -> Environment Variables (Project -> Settings -> API in Supabase has the value, under 'service_role' — keep it secret, it bypasses Row Level Security)."
    );
  }
  return key;
}

// Verifies a Supabase access token (the one the browser holds after
// sign-in) and returns the authenticated user, or null if the token is
// missing/invalid/expired. This is how server-side code confirms "who is
// this request really from" without trusting a client-supplied user id.
async function getUserFromAccessToken(accessToken) {
  if (!accessToken) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

// Upsert (insert-or-update) an enrollments row, keyed on the table's
// unique(user_id, program_slug, cohort_start_date) constraint (Brief #7 —
// widened from just (user_id, program_slug) so a second enrollment for a
// different cohort creates a new row instead of overwriting the first
// one's payment history). Used instead of a plain UPDATE so this is safe
// even if the row wasn't created earlier in the sign-up flow for some
// reason. Every caller must include cohort_start_date in `fields` (even
// as null) for the conflict target to actually match the intended row —
// omitting it entirely defaults to null on the attempted insert, which
// silently misses a row that already has a real cohort date.
async function upsertEnrollment(fields) {
  const key = requireServiceRoleKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?on_conflict=user_id,program_slug,cohort_start_date`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase upsert failed (${res.status}): ${text}`);
  }
  const rows = await res.json();
  return rows[0] || null;
}

// A user can now have more than one enrollment row per program (Brief #7
// — one per cohort), so this is no longer guaranteed to return a single
// row. Ordered most-recent-first and capped at 1 so behavior stays
// deterministic (the most recent enrollment wins) rather than depending
// on whatever order Postgres happens to return. There's no cohort-aware
// "pay the balance for cohort X specifically" API yet (that's the My
// Account "Pay Now" flow, not built), so this is a reasonable stand-in
// until that exists — most people will only ever have one open balance.
async function getEnrollment(userId, programSlug) {
  const key = requireServiceRoleKey();
  const url = `${SUPABASE_URL}/rest/v1/enrollments?user_id=eq.${encodeURIComponent(userId)}&program_slug=eq.${encodeURIComponent(programSlug)}&select=*&order=created_at.desc&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase read failed (${res.status}): ${text}`);
  }
  const rows = await res.json();
  return rows[0] || null;
}

// Brief #10 — the true last line of defense against a duplicate charge:
// even if every client-side guard is somehow bypassed, paystack-initialize
// still won't start a new 'full'/'deposit' transaction for a program +
// cohort the user has already completed. Scoped to the exact cohort (not
// "any cohort ever completed") so a legitimately different cohort isn't
// blocked — matches the client-side hasCompletedEnrollment in auth.js.
async function hasCompletedEnrollmentForCohort(userId, programSlug, cohortStartDate) {
  const key = requireServiceRoleKey();
  let url = `${SUPABASE_URL}/rest/v1/enrollments?user_id=eq.${encodeURIComponent(userId)}&program_slug=eq.${encodeURIComponent(programSlug)}&status=eq.completed&select=id&limit=1`;
  url += cohortStartDate
    ? `&cohort_start_date=eq.${encodeURIComponent(cohortStartDate)}`
    : `&cohort_start_date=is.null`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase read failed (${res.status}): ${text}`);
  }
  const rows = await res.json();
  return rows.length > 0;
}

// Aggregate-only: returns a plain count of enrollments for a program +
// cohort, never the underlying rows, so this is safe to expose via a
// public "spots left" endpoint. 'started' (signed up, hasn't paid yet)
// and 'completed' (paid, either plan) both count as a taken seat.
//
// Uses `Prefer: count=exact` + the Content-Range response header, NOT
// `select=count()` — Supabase's hosted PostgREST has aggregate functions
// disabled by default ("Use of aggregate functions is not allowed", 400),
// which is what was silently breaking this in production (Brief #8).
// limit=1 keeps the response body tiny; Content-Range still reports the
// full matched count regardless of the limit.
async function countActiveEnrollments(programSlug, cohortStartDate) {
  const key = requireServiceRoleKey();
  const url = `${SUPABASE_URL}/rest/v1/enrollments?program_slug=eq.${encodeURIComponent(programSlug)}&cohort_start_date=eq.${encodeURIComponent(cohortStartDate)}&status=in.(started,completed)&select=id&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase count failed (${res.status}): ${text}`);
  }
  const contentRange = res.headers.get("content-range") || "";
  const total = contentRange.split("/")[1];
  return total && total !== "*" ? parseInt(total, 10) : 0;
}

module.exports = { getUserFromAccessToken, upsertEnrollment, getEnrollment, countActiveEnrollments, hasCompletedEnrollmentForCohort };
