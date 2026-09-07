// OIStride — webinar catalog (Brief #27). Single source of truth for
// both webinars.html (listing) and webinar.html (individual event page)
// — add a new event to this array and it's immediately live on both,
// no rebuild or new HTML file needed. api/register-webinar.js keeps a
// small server-side mirror of just the fields it needs (title, startAt,
// meetLink) since it's a plain <script> here, not an importable module
// — same reasoning already used for api/_dates.js's month names being
// duplicated in assets/js/auth.js.
//
// startAt/endAt are ISO 8601 UTC. Status is always computed from these
// at render time (never stored), the same pattern already used for
// cohort status in my-account.html.
window.WEBINARS = [
  {
    slug: "product-thinking-masterclass",
    title: "The Product Thinking Masterclass",
    description: "A live, practitioner-led session on how real product teams turn a vague idea into a decision they can defend. Bring your questions, this is interactive, not a lecture.",
    // Placeholder date a few days out — adjust to test each of the 3
    // states on webinar.html (before / during / after).
    startAt: "2026-09-10T15:00:00Z",
    endAt: "2026-09-10T17:00:00Z",
    flyerColor: "linear-gradient(135deg, #6C5CE7, #22D3EE)",
    // TODO: replace with the real Google Meet link before this goes live.
    meetLink: "https://meet.google.com/replace-with-real-link",
    recordingLink: null,
  },
];

function getWebinarBySlug(slug) {
  return window.WEBINARS.find((w) => w.slug === slug) || null;
}

// Listing-card badge — only the 2 states the card grid needs. "Live now"
// still reads as "Upcoming" here on purpose (not asked for as a 3rd
// badge state); the individual event page is where the live/join state
// actually shows up.
function getWebinarListStatus(webinar) {
  return new Date() > new Date(webinar.endAt) ? "passed" : "upcoming";
}

// Individual-page phase — drives which of the 3 blocks renders.
function getWebinarPhase(webinar) {
  const now = new Date();
  if (now < new Date(webinar.startAt)) return "before";
  if (now > new Date(webinar.endAt)) return "after";
  return "during";
}

function formatWebinarDateTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
  }) + " WAT";
}

window.getWebinarBySlug = getWebinarBySlug;
window.getWebinarListStatus = getWebinarListStatus;
window.getWebinarPhase = getWebinarPhase;
window.formatWebinarDateTime = formatWebinarDateTime;
