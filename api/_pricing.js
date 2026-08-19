// OIStride — server-side source of truth for program pricing.
//
// Deliberately NOT derived from anything the client sends. checkout.html's
// displayed prices (Brief #3) are a separate, purely cosmetic copy of these
// same numbers — if a price ever changes, update both places, but the
// amount actually charged always comes from here, never from the browser.
// Amounts are kobo (Naira * 100) — Paystack's own unit, and it keeps every
// money calculation in this codebase as integers instead of floats.

const PROGRAM_PRICING = {
  "project-management": { name: "Agile Project Management", priceKobo: 25000000 }, // ₦250,000
  "product-management": { name: "Product Management", priceKobo: 25000000 }, // ₦250,000
  "ai-product-management": { name: "AI Product Management", priceKobo: 30000000 }, // ₦300,000
};

const DEPOSIT_FRACTION = 0.7;

function getProgramPricing(programSlug) {
  return PROGRAM_PRICING[programSlug] || null;
}

function getDepositKobo(priceKobo) {
  return Math.round(priceKobo * DEPOSIT_FRACTION);
}

function getBalanceKobo(priceKobo) {
  return priceKobo - getDepositKobo(priceKobo);
}

module.exports = { PROGRAM_PRICING, getProgramPricing, getDepositKobo, getBalanceKobo };
