// OIStride — Supabase project config
// Project URL + anon key below. Still needed before auth will work end to end:
//
// 1. Run supabase/schema.sql in the SQL Editor (Project -> SQL Editor -> New query)
// 2. Auth -> URL Configuration -> add this site's URL to Redirect URLs
//    (needed for the password-reset email link to land on reset-password.html)
//
// The anon key is safe to expose client-side — it only grants what your
// Row Level Security policies allow (see supabase/schema.sql).

const SUPABASE_URL = "https://vtksigpknclznngtjhgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0a3NpZ3BrbmNsem5uZ3RqaGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDg3MzMsImV4cCI6MjEwMTYyNDczM30.8HHLv9fgWCZ2tIhjLhiqIOaRj9rxOP7Q8QS9ZpQ1WFc";
