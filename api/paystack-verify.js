// GET /api/paystack-verify?reference=xxx
//
// Not part of the literal Brief #4 file list — added because without it,
// thank-you.html would have nothing but Paystack's own redirect query
// params to go on, and displaying "you're enrolled" off unverified URL
// params would be exactly the kind of client-side trust the brief says
// not to rely on. This lets the return page ask the server "did this
// reference actually succeed?" and get a real answer from Paystack
// on-demand — it never writes anything; the webhook is still the only
// place enrollment state actually changes.

const { verifyTransaction } = require("./_paystack");
const { getProgramPricing } = require("./_pricing");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const reference = req.query && req.query.reference;
  if (!reference) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  try {
    const verified = await verifyTransaction(reference);
    const metadata = verified.metadata || {};
    const pricing = metadata.program_slug ? getProgramPricing(metadata.program_slug) : null;

    res.status(200).json({
      status: verified.status, // 'success' | 'failed' | 'abandoned' | ...
      chargeType: metadata.charge_type || null,
      programSlug: metadata.program_slug || null,
      programName: pricing ? pricing.name : null,
      amountKobo: verified.amount,
    });
  } catch (err) {
    console.error("paystack-verify error:", err);
    res.status(502).json({ error: "Could not confirm payment status right now." });
  }
};
