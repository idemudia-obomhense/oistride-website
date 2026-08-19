// OIStride — cohort month parsing + installment due-date math.
//
// checkout.html's cohort dropdown (Brief #2) renders options like
// "September 2026" as plain text. We need that as an actual date to
// compute "start of the program's second month" for the 30% balance due
// date — a fixed day-count from purchase would be wrong if someone pays
// weeks before their cohort actually starts.

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "September 2026" -> "2026-09-01". Returns null if the string doesn't
// match a recognized month name, so callers can fall back safely instead
// of trusting an unparseable client-supplied string.
function parseCohortMonth(label) {
  if (typeof label !== "string") return null;
  const match = label.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === match[1].toLowerCase());
  if (monthIndex === -1) return null;
  const year = parseInt(match[2], 10);
  const mm = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${mm}-01`;
}

// Start of the *second* month of the program, given the cohort's start
// date (first day of its first month).
function secondMonthStartDate(cohortStartDateStr) {
  const d = new Date(cohortStartDateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

module.exports = { parseCohortMonth, secondMonthStartDate };
