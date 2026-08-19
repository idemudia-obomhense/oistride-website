// POST /api/paystack-webhook
// Configured as the webhook URL in the Paystack dashboard (Settings ->
// API Keys & Webhooks). This is the ONLY place that actually marks a
// payment as successful — checkout.html's client-side redirect back from
// Paystack is just UX, never trusted for anything real (Brief #4, item 3).
//
// Two independent checks before anything is written to the database:
//   1. The request's HMAC-SHA512 signature (x-paystack-signature) is
//      verified against the raw body using PAYSTACK_SECRET_KEY, proving
//      the request actually came from Paystack and wasn't forged.
//   2. Even after that, we call Paystack's own verify-transaction API
//      with the reference rather than trusting the webhook payload's
//      claimed amount/status outright — belt and suspenders, and it's
//      what independently confirms the charge really succeeded.
//
// Vercel's automatic JSON body-parsing is turned off (see `config` export
// below) because signature verification needs the exact raw bytes Paystack
// signed — parsing and re-serializing the JSON can change byte-for-byte
// formatting and silently break the signature check.

const crypto = require("crypto");
const { getProgramPricing } = require("./_pricing");
const { verifyTransaction } = require("./_paystack");
const { upsertEnrollment, getEnrollment } = require("./_supabase");
const { secondMonthStartDate } = require("./_dates");

module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function isValidSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("paystack-webhook: PAYSTACK_SECRET_KEY not set");
    res.status(500).end();
    return;
  }

  const rawBody = await readRawBody(req);

  if (!isValidSignature(rawBody, req.headers["x-paystack-signature"], secret)) {
    console.error("paystack-webhook: invalid signature, rejecting");
    res.status(401).end();
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).end();
    return;
  }

  // Acknowledge everything else so Paystack stops retrying it, but only
  // act on the event that means money actually moved.
  if (event.event !== "charge.success") {
    res.status(200).end();
    return;
  }

  try {
    const reference = event.data && event.data.reference;
    if (!reference) {
      res.status(200).end();
      return;
    }

    // Independent server-to-server confirmation — don't act on the
    // webhook payload's own claim of success.
    const verified = await verifyTransaction(reference);
    if (verified.status !== "success") {
      res.status(200).end();
      return;
    }

    const metadata = verified.metadata || {};
    const { user_id: userId, program_slug: programSlug, charge_type: chargeType } = metadata;
    if (!userId || !programSlug || !chargeType) {
      console.error("paystack-webhook: verified transaction missing metadata", reference);
      res.status(200).end();
      return;
    }

    const pricing = getProgramPricing(programSlug);
    const amountKobo = verified.amount;

    let fields;
    if (chargeType === "full") {
      fields = {
        user_id: userId,
        program_slug: programSlug,
        status: "completed",
        payment_plan: "full",
        amount_paid_kobo: amountKobo,
        remaining_balance_kobo: 0,
        installment_status: null,
        cohort_start_date: metadata.cohort_start_date || null,
        paystack_reference: reference,
      };
    } else if (chargeType === "deposit") {
      const cohortStartDate = metadata.cohort_start_date || null;
      fields = {
        user_id: userId,
        program_slug: programSlug,
        status: "completed",
        payment_plan: "installment",
        amount_paid_kobo: amountKobo,
        remaining_balance_kobo: pricing ? pricing.priceKobo - amountKobo : 0,
        installment_status: "pending",
        cohort_start_date: cohortStartDate,
        balance_due_date: cohortStartDate ? secondMonthStartDate(cohortStartDate) : null,
        paystack_reference: reference,
      };
    } else if (chargeType === "balance") {
      const existing = await getEnrollment(userId, programSlug);
      fields = {
        user_id: userId,
        program_slug: programSlug,
        remaining_balance_kobo: 0,
        installment_status: "paid",
        amount_paid_kobo: (existing ? existing.amount_paid_kobo || 0 : 0) + amountKobo,
        paystack_reference_balance: reference,
      };
    } else {
      res.status(200).end();
      return;
    }

    await upsertEnrollment(fields);
    res.status(200).end();
  } catch (err) {
    // Non-200 makes Paystack retry the webhook later, which is what we
    // want if this failed for a transient reason (Supabase hiccup, etc).
    console.error("paystack-webhook error:", err);
    res.status(500).end();
  }
};
