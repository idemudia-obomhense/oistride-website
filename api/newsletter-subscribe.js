// POST /api/newsletter-subscribe
// Body: { email }
//
// Brief #11 item 5 — the newsletter form used to be pure front-end
// theater (a fake "Subscribed ✓" with nothing captured). This actually
// stores the email; the welcome email is the explicitly-optional
// nice-to-have from the brief, included since it's cheap on top of
// infrastructure already built for the other four email flows.

const { insertNewsletterSubscriber } = require("./_supabase");
const { sendEmail } = require("./_resend");
const { wrapEmail } = require("./_email-templates");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email } = req.body || {};
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email is required." });
      return;
    }

    await insertNewsletterSubscriber(email);

    // Best-effort welcome email — a subscribe should still succeed even
    // if Resend has a bad moment.
    try {
      await sendEmail({
        to: email,
        subject: "You're subscribed to OIStride notes",
        html: wrapEmail({
          title: "You're in.",
          bodyHtml: "<p>You'll get practical PM and AI-building notes from OIStride, roughly monthly. No spam, unsubscribe anytime.</p>",
        }),
      });
    } catch (err) {
      console.error("newsletter welcome email failed:", err);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("newsletter-subscribe error:", err);
    res.status(500).json({ error: "Couldn't subscribe right now. Please try again." });
  }
};
