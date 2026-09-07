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
// cohort status in my-account.html. `subtitle` is optional; `description`
// can be a single string or an array of paragraph strings.
window.WEBINARS = [
  {
    slug: "building-a-career-in-tech-and-ai",
    title: "Building a Career in Tech & AI",
    subtitle: "How to choose the right tech skills, build real capability & put knowledge to work",
    description: [
      "Building a Career in Tech & AI is a free, practical masterclass for people who want to build a meaningful career in technology but are unsure what to learn, where to start, or how to turn learning into real opportunities.",
      "This session will help you understand how to choose tech skills based on your goals, build genuine capability through practice, and move beyond simply collecting courses and certificates.",
      "Hosted by Obomhense Idemudia, Senior Product Manager, Trainer and Founder of OIStride Academy, the masterclass combines real industry experience, practical guidance, and honest conversations about building a career in today's technology and AI-driven world.",
      "The goal is simple: help you make better decisions about what to learn, how to learn it, and how to put those skills to work.",
    ],
    // Saturday, September 26, 2026, 3:00-5:00 PM WAT (WAT = UTC+1).
    startAt: "2026-09-26T14:00:00Z",
    endAt: "2026-09-26T16:00:00Z",
    // TODO: placeholder gradient — swap for the real flyer image once
    // Jed has it. Still pending as of this writing.
    flyerColor: "linear-gradient(135deg, #6C5CE7, #22D3EE)",
    meetLink: "https://meet.google.com/jzi-zdmc-ymi",
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
