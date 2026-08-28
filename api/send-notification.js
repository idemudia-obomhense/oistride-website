// POST /api/send-notification
// Body: { formType: 'contact'|'call'|'signup', ... }
//   contact/call: { fullName, email, phone?, altPhone?, topic?, message? }
//   signup (Brief #26): { firstName, lastName, email, phone? }
//
// Brief #11 — contact.html and book-a-call.html's quick-request form both
// used to "submit" to a demo redirect with nothing actually sent anywhere.
// This notifies oistride12@gmail.com with whatever the visitor typed.
// Brief #26 added the signup case, called fire-and-forget from auth.js
// right after a successful signUp() so Jed hears about every new account
// without that call ever being able to block or delay the signup itself.

const { sendEmail } = require("./_resend");
const { wrapEmail, escapeHtml } = require("./_email-templates");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const LABELS = {
  contact: "New contact form submission",
  call: "New call request",
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { formType } = req.body || {};

    if (formType === "signup") {
      const { firstName, lastName, email, phone } = req.body || {};
      if (typeof firstName !== "string" || !firstName.trim() || typeof lastName !== "string" || !lastName.trim() || !isValidEmail(email)) {
        res.status(400).json({ error: "First name, last name, and a valid email are required." });
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const signedUpAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
      const phoneDisplay = typeof phone === "string" && phone.trim() ? phone.trim() : "not provided";

      const bodyHtml = [
        ["", `${escapeHtml(fullName)} just created an OIStride Academy account.`],
        ["Email", email],
        ["Phone", phoneDisplay],
        ["Signed up", signedUpAt],
      ].map(([label, value]) => label
        ? `<p style="margin:4px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
        : `<p style="margin:0 0 12px;">${value}</p>`
      ).join("");

      await sendEmail({
        to: "oistride12@gmail.com",
        subject: `New signup — ${fullName}`,
        html: wrapEmail({ title: "New signup", bodyHtml }),
      });

      res.status(200).json({ ok: true });
      return;
    }

    const { fullName, email, phone, altPhone, topic, message } = req.body || {};

    if (!LABELS[formType]) {
      res.status(400).json({ error: "Invalid form type." });
      return;
    }
    if (typeof fullName !== "string" || !fullName.trim() || !isValidEmail(email)) {
      res.status(400).json({ error: "Name and a valid email are required." });
      return;
    }

    const rows = [
      ["Name", fullName],
      ["Email", email],
      phone ? ["Phone", phone] : null,
      altPhone ? ["Alternative phone", altPhone] : null,
      topic ? ["Topic", topic] : null,
    ].filter(Boolean);

    const rowsHtml = rows.map(([label, value]) => `<p style="margin:4px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("");
    const messageHtml = message ? `<p style="margin-top:16px; white-space:pre-wrap;">${escapeHtml(message)}</p>` : "";

    await sendEmail({
      to: "oistride12@gmail.com",
      subject: LABELS[formType],
      replyTo: email,
      html: wrapEmail({
        title: LABELS[formType],
        bodyHtml: rowsHtml + messageHtml,
      }),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-notification error:", err);
    res.status(500).json({ error: "Couldn't send your message right now. Please try again, or email oistride12@gmail.com directly." });
  }
};
