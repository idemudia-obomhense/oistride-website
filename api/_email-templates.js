// OIStride — shared HTML wrapper for outbound emails (Brief #11). Email
// clients don't load external stylesheets, so this is deliberately plain,
// table-free, inline-styled HTML rather than reusing assets/css/style.css.

const NAVY = "#14183B";
const CORAL = "#FF4D6D";
const GREY = "#5B6178";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// bodyHtml is trusted, pre-built HTML (call sites construct it from fixed
// strings/numbers they control, not raw user input) — only escapeHtml()'d
// values (like a user's name) should ever end up inside it.
function wrapEmail({ title, bodyHtml, ctaLabel, ctaUrl }) {
  const cta = ctaLabel && ctaUrl
    ? `<div style="margin-top:28px;"><a href="${ctaUrl}" style="background:${CORAL}; color:#fff; text-decoration:none; font-weight:600; padding:14px 28px; border-radius:8px; display:inline-block; font-family:Arial,Helvetica,sans-serif;">${escapeHtml(ctaLabel)}</a></div>`
    : "";
  return `
<div style="font-family:Arial,Helvetica,sans-serif; max-width:520px; margin:0 auto; padding:32px 24px;">
  <div style="font-weight:800; font-size:18px; color:${NAVY}; margin-bottom:24px;">OIStride Academy</div>
  <h1 style="font-size:21px; color:${NAVY}; margin:0 0 16px;">${escapeHtml(title)}</h1>
  <div style="font-size:14.5px; line-height:1.6; color:${GREY};">${bodyHtml}</div>
  ${cta}
  <div style="margin-top:36px; padding-top:20px; border-top:1px solid #E5E7EF; font-size:12.5px; color:#9296A8;">
    OIStride Academy · <a href="mailto:oistride12@gmail.com" style="color:#9296A8;">oistride12@gmail.com</a>
  </div>
</div>`.trim();
}

module.exports = { wrapEmail, escapeHtml };
