// POST /api/send-notification
// Body: { formType: 'contact'|'call', fullName, email, phone?, altPhone?, topic?, message? }
//
// Brief #11 — contact.html and book-a-call.html's quick-request form both
// used to "submit" to a demo redirect with nothing actually sent anywhere.
// This notifies oistride12@gmail.com with whatever the visitor typed.

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
    const { formType, fullName, email, phone, altPhone, topic, message } = req.body || {};

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
