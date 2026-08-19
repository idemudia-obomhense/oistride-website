// GET /api/cohort-spots?programSlug=ai-product-management&cohortMonth=September%202026
//
// Returns { spotsLeft, totalSpots } only — a plain aggregate, never the
// underlying enrollment rows or anything about who's enrolled (Brief #6).
// 'started' (signed up, hasn't paid yet) and 'completed' (paid, either
// plan) both count as a taken seat, since both represent someone who has
// claimed a place in that cohort.

const { getProgramPricing } = require("./_pricing");
const { countActiveEnrollments } = require("./_supabase");
const { parseCohortMonth } = require("./_dates");

const TOTAL_SPOTS = 20;

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const programSlug = req.query && req.query.programSlug;
  const cohortMonth = req.query && req.query.cohortMonth;

  if (!programSlug || !getProgramPricing(programSlug)) {
    res.status(400).json({ error: "Unknown program." });
    return;
  }

  const cohortStartDate = parseCohortMonth(cohortMonth);
  if (!cohortStartDate) {
    res.status(400).json({ error: "Invalid or missing cohortMonth." });
    return;
  }

  try {
    const taken = await countActiveEnrollments(programSlug, cohortStartDate);
    const spotsLeft = Math.max(0, TOTAL_SPOTS - taken);
    res.status(200).json({ spotsLeft, totalSpots: TOTAL_SPOTS });
  } catch (err) {
    console.error("cohort-spots error:", err);
    res.status(502).json({ error: "Could not load spots right now." });
  }
};
