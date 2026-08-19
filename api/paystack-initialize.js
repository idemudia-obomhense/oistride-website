// POST /api/paystack-initialize
// Body: { programSlug, chargeType: 'full'|'deposit'|'balance', accessToken, cohortMonth? }
//
// Starts a Paystack transaction server-side (the secret key never reaches
// the browser) and hands back the hosted-checkout URL for the client to
// redirect to. The amount charged is always computed here from the fixed
// pricing table (or, for 'balance', from the enrollment row already on
// file) — never from anything the client sends — so a tampered request
// body can't change what gets charged.

const { getProgramPricing, getDepositKobo } = require("./_pricing");
const { initializeTransaction } = require("./_paystack");
const { getUserFromAccessToken, getEnrollment, hasCompletedEnrollmentForCohort } = require("./_supabase");
const { parseCohortMonth } = require("./_dates");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { programSlug, chargeType, accessToken, cohortMonth } = req.body || {};

    if (!["full", "deposit", "balance"].includes(chargeType)) {
      res.status(400).json({ error: "Invalid chargeType" });
      return;
    }

    const user = await getUserFromAccessToken(accessToken);
    if (!user || !user.id || !user.email) {
      res.status(401).json({ error: "Not signed in. Please sign in and try again." });
      return;
    }

    const pricing = getProgramPricing(programSlug);
    if (!pricing) {
      res.status(400).json({ error: "This program isn't set up for online payment yet." });
      return;
    }

    // Computed here (not just for 'deposit') so a full-price payment's
    // cohort is recorded too — /api/cohort-spots.js counts completed
    // enrollments by cohort_start_date regardless of plan — and so the
    // Brief #10 duplicate-enrollment check below can use it.
    const cohortStartDate = parseCohortMonth(cohortMonth);

    let amountKobo;
    if (chargeType === "full" || chargeType === "deposit") {
      // Brief #10 — the last line of defense against a duplicate charge:
      // even if every client-side guard was somehow bypassed, never start
      // a new full/deposit transaction for a program+cohort this user has
      // already completed. 'balance' is exempt — it's legitimately
      // continuing an enrollment that isn't 'completed' yet.
      if (await hasCompletedEnrollmentForCohort(user.id, programSlug, cohortStartDate)) {
        res.status(400).json({ error: "You've already completed this program for this cohort. Want to join a future cohort, or need something else? Talk to us at book-a-call.html." });
        return;
      }
    }

    if (chargeType === "full") {
      amountKobo = pricing.priceKobo;
    } else if (chargeType === "deposit") {
      amountKobo = getDepositKobo(pricing.priceKobo);
    } else {
      // 'balance' — the remaining 30%, only valid once a deposit exists.
      const enrollment = await getEnrollment(user.id, programSlug);
      if (!enrollment || !enrollment.remaining_balance_kobo || enrollment.remaining_balance_kobo <= 0) {
        res.status(400).json({ error: "No outstanding balance found for this program." });
        return;
      }
      if (enrollment.installment_status === "paid") {
        res.status(400).json({ error: "This balance has already been paid." });
        return;
      }
      amountKobo = enrollment.remaining_balance_kobo;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const transaction = await initializeTransaction({
      email: user.email,
      amountKobo,
      metadata: {
        user_id: user.id,
        program_slug: programSlug,
        charge_type: chargeType,
        cohort_month: cohortMonth || null,
        cohort_start_date: cohortStartDate,
      },
      callbackUrl: `${origin}/thank-you.html?type=payment`,
    });

    res.status(200).json({
      authorization_url: transaction.authorization_url,
      reference: transaction.reference,
    });
  } catch (err) {
    console.error("paystack-initialize error:", err);
    res.status(500).json({ error: "Something went wrong starting payment. Please try again." });
  }
};
