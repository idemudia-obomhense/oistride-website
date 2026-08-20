// POST /api/send-brochure
// Body: { name, email, programSlug }
//
// Brief #11 — the brochure PDFs used to live under assets/downloads/,
// directly reachable by anyone who guessed/knew the URL, regardless of
// whether they ever gave an email. They now live under api/_brochure-files/
// (not served statically by Vercel at all) and are only ever attached to
// an outbound email here, keyed by the program the request claims —
// filenames are literal string paths below (not built from the request's
// programSlug) both for security (no path traversal from user input) and
// so Vercel's Node file tracer can statically detect and bundle them.

const fs = require("fs");
const path = require("path");
const { sendEmail } = require("./_resend");
const { wrapEmail } = require("./_email-templates");

const BROCHURES = {
  "project-management": {
    programName: "Agile Project Management",
    filePath: path.join(__dirname, "_brochure-files", "project-management.pdf"),
    fileName: "OIStride-Agile-Project-Management-Brochure.pdf",
  },
  "product-management": {
    programName: "Product Management",
    filePath: path.join(__dirname, "_brochure-files", "product-management.pdf"),
    fileName: "OIStride-Product-Management-Brochure.pdf",
  },
  "ai-product-management": {
    programName: "AI Product Management",
    filePath: path.join(__dirname, "_brochure-files", "ai-product-management.pdf"),
    fileName: "OIStride-AI-Product-Management-Brochure.pdf",
  },
};

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, programSlug } = req.body || {};

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email is required." });
      return;
    }

    const brochure = BROCHURES[programSlug];
    if (!brochure) {
      res.status(400).json({ error: "Unknown program." });
      return;
    }

    const fileBuffer = fs.readFileSync(brochure.filePath);
    const firstName = typeof name === "string" && name.trim() ? name.trim().split(/\s+/)[0] : "there";
    const origin = req.headers.origin || `https://${req.headers.host}`;

    await sendEmail({
      to: email,
      subject: `Your ${brochure.programName} brochure`,
      html: wrapEmail({
        title: `Hi ${firstName}, here's your brochure`,
        bodyHtml: `<p>Thanks for your interest in <strong>${brochure.programName}</strong> — the full program brochure is attached to this email.</p><p>Ready to take the next step? You can enroll anytime.</p>`,
        ctaLabel: "View Programs",
        ctaUrl: `${origin}/programs-catalog.html`,
      }),
      attachments: [
        { filename: brochure.fileName, content: fileBuffer.toString("base64") },
      ],
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-brochure error:", err);
    res.status(500).json({ error: "Couldn't send the brochure right now. Please try again." });
  }
};
