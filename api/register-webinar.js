// POST /api/register-webinar
// Body: { webinarSlug, name, email, phone?, occupation?, howHeard? }
//
// Brief #27 — writes to public.webinar_registrations using the service
// role key (no public insert RLS policy, same reasoning as
// newsletter_subscribers: this is the only writer). Fires two
// best-effort emails afterward, a confirmation to the registrant and a
// notification to Jed, each wrapped in its own try/catch so a Resend
// hiccup can never turn an otherwise-successful registration into an
// error the visitor sees.
//
// Brief #28 — also mirrors the registration to Jed's Google Sheet via
// an Apps Script webhook, same best-effort principle: its own
// try/catch plus an explicit timeout (via AbortController), so a slow
// or unreachable webhook can never hang or fail a registration that
// already succeeded once the Supabase write above completes.

const { insertWebinarRegistration } = require("./_supabase");
const { sendEmail } = require("./_resend");
const { wrapEmail, escapeHtml } = require("./_email-templates");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Brief #28 — Jed's Google Apps Script webhook, mirroring registrations
// into his Google Sheet. WEBINAR_SHEET_SECRET is added directly in
// Vercel's environment variables (never hardcoded/committed here); the
// script rejects requests whose secret doesn't match.
const WEBINAR_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw2yRIbdlK7JmwsyzQi9VxAvlsZWbpfjflcgXIS36R40TMb5DA3Sh89-YfKRS_Zq3V_Tg/exec";

// Mirrors assets/js/webinars-data.js — kept as a small server-side copy
// of just the fields this endpoint needs, since that file is a plain
// <script> global, not something a serverless function can require()
// (same reasoning api/_dates.js's month names are duplicated in
// assets/js/auth.js). Update both when adding/editing a webinar.
// TODO: replace with the real Google Meet link before this goes live.
const WEBINARS = {
  "building-a-career-in-tech-and-ai": {
    title: "Building a Career in Tech & AI",
    startAt: "2026-09-26T14:00:00Z",
    meetLink: "https://meet.google.com/replace-with-real-link",
  },
};

function formatEventDateTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos",
  }) + " WAT";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { webinarSlug, name, email, phone, occupation, howHeard } = req.body || {};

    const webinar = WEBINARS[webinarSlug];
    if (!webinar) {
      res.status(400).json({ error: "Unknown webinar." });
      return;
    }
    if (typeof name !== "string" || !name.trim() || !isValidEmail(email)) {
      res.status(400).json({ error: "Name and a valid email are required." });
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const cleanOccupation = typeof occupation === "string" && occupation.trim() ? occupation.trim() : null;
    const cleanHowHeard = typeof howHeard === "string" && howHeard.trim() ? howHeard.trim() : null;

    await insertWebinarRegistration({
      webinar_slug: webinarSlug,
      name: cleanName,
      email,
      phone: cleanPhone,
      occupation: cleanOccupation,
      how_heard: cleanHowHeard,
    });

    const firstName = cleanName.split(/\s+/)[0];
    const eventDateDisplay = formatEventDateTime(webinar.startAt);

    try {
      await sendEmail({
        to: email,
        subject: `You're registered: ${webinar.title}`,
        html: wrapEmail({
          title: "You're registered!",
          bodyHtml: `<p>Hi ${escapeHtml(firstName)},</p><p>You're confirmed for <strong>${escapeHtml(webinar.title)}</strong>.</p><p style="margin:4px 0;"><strong>When:</strong> ${escapeHtml(eventDateDisplay)}</p><p style="margin:4px 0;"><strong>Where:</strong> Google Meet, link below. The link goes live once the session starts.</p><p style="margin-top:20px;">See you there,<br>OIStride Academy</p>`,
          ctaLabel: "Meet Link",
          ctaUrl: webinar.meetLink,
        }),
      });
    } catch (err) {
      console.error("webinar confirmation email failed:", err);
    }

    try {
      await sendEmail({
        to: "oistride12@gmail.com",
        subject: `New webinar registration — ${webinar.title}`,
        html: wrapEmail({
          title: "New webinar registration",
          bodyHtml: [
            ["Webinar", webinar.title],
            ["Name", cleanName],
            ["Email", email],
            ["Phone", cleanPhone || "not provided"],
            ["Occupation", cleanOccupation || "not provided"],
            ["How they heard", cleanHowHeard || "not provided"],
          ].map(([label, value]) => `<p style="margin:4px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join(""),
        }),
      });
    } catch (err) {
      console.error("webinar notification email failed:", err);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        await fetch(WEBINAR_SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cleanName,
            email,
            phone: cleanPhone,
            occupation: cleanOccupation,
            howHeard: cleanHowHeard,
            secret: process.env.WEBINAR_SHEET_SECRET,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      console.error("webinar Google Sheets sync failed:", err);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("register-webinar error:", err);
    res.status(500).json({ error: "Couldn't complete your registration right now. Please try again." });
  }
};
