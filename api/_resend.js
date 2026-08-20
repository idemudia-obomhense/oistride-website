// OIStride — minimal server-side Resend REST helper. No SDK dependency;
// Node 18+ on Vercel has global fetch, and Resend's API is plain REST.
//
// RESEND_FROM_EMAIL is optional — Resend requires a verified sending
// domain before it will deliver from a custom address (its sandbox
// address only delivers to the account owner until one is verified), so
// this defaults to a placeholder. Set RESEND_FROM_EMAIL in Vercel once a
// real domain is verified in Resend's dashboard, no code change needed.

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "OIStride Academy <notifications@oistrideacademy.com>";

function requireApiKey() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. It's added directly in Vercel -> Project -> Settings -> Environment Variables — never hardcode it here."
    );
  }
  return key;
}

// attachments: [{ filename, content: <base64 string> }]
async function sendEmail({ to, subject, html, attachments, replyTo }) {
  const key = requireApiKey();
  const body = {
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (attachments) body.attachments = attachments;
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  return json; // { id }
}

module.exports = { sendEmail };
