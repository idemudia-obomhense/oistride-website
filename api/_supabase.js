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
// existing unique(user_id, program_slug) constraint. Used instead of a
// plain UPDATE so this is safe even if the row wasn't created earlier in
// the sign-up flow for some reason.
async function upsertEnrollment(fields) {
  const key = requireServiceRoleKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?on_conflict=user_id,program_slug`, {
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

async function getEnrollment(userId, programSlug) {
  const key = requireServiceRoleKey();
  const url = `${SUPABASE_URL}/rest/v1/enrollments?user_id=eq.${encodeURIComponent(userId)}&program_slug=eq.${encodeURIComponent(programSlug)}&select=*`;
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

module.exports = { getUserFromAccessToken, upsertEnrollment, getEnrollment };
