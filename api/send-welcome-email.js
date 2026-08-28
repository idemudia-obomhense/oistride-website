// POST /api/send-welcome-email
// Body: { firstName, email }
//
// Brief #26 — there's no email verification step on signup right now,
// so this is currently the only confirmation a new user gets that their
// account was actually created. Called fire-and-forget from auth.js
// right after a successful signUp() — must never block or delay the
// signup flow if sending fails.

const { sendEmail } = require("./_resend");
const { wrapEmail, escapeHtml } = require("./_email-templates");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { firstName, email } = req.body || {};

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email is required." });
      return;
    }

    const name = typeof firstName === "string" && firstName.trim() ? firstName.trim() : "there";
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const bodyHtml = `
<p>Hi ${escapeHtml(name)},</p>
<p>Welcome to OIStride Academy. Your account is set up.</p>
<p>You're now one step closer to building real, practical technology skills through live, practice-led learning, not another video library you'll never finish.</p>
<p>Here's what's open right now:</p>
<ul style="margin:0 0 16px; padding-left:20px;">
  <li>Agile Project Management (8 weeks)</li>
  <li>Product Management (12 weeks)</li>
  <li>AI Product Management (12 weeks)</li>
</ul>
<p>Every program is live, cohort-based, and built around real cases with direct feedback from a practitioner who's still doing the work.</p>
<p style="margin-top:24px;">Not sure which one's right for you yet? You can also <a href="${origin}/book-a-call.html" style="color:#FF4D6D;">book a free, no-pressure consultation</a>, just a real conversation about your goals.</p>
<p style="margin-top:20px;">Talk soon,<br>OIStride Academy</p>
`.trim();

    await sendEmail({
      to: email,
      subject: "Welcome to OIStride Academy \u{1F44B}",
      html: wrapEmail({
        title: `Welcome, ${name}!`,
        bodyHtml,
        ctaLabel: "See Programs →",
        ctaUrl: `${origin}/programs-catalog.html`,
      }),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-welcome-email error:", err);
    res.status(500).json({ error: "Couldn't send the welcome email." });
  }
};
