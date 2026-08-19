// OIStride — minimal server-side Paystack REST helpers. No SDK dependency;
// Node 18+ on Vercel has global fetch, and Paystack's API is plain REST.

const PAYSTACK_BASE = "https://api.paystack.co";

function requireSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. It's added directly in Vercel -> Project -> Settings -> Environment Variables — never hardcode it here."
    );
  }
  return key;
}

async function initializeTransaction({ email, amountKobo, metadata, callbackUrl }) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      metadata,
      callback_url: callbackUrl,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(`Paystack initialize failed: ${json.message || res.status}`);
  }
  return json.data; // { authorization_url, access_code, reference }
}

async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${requireSecretKey()}` },
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(`Paystack verify failed: ${json.message || res.status}`);
  }
  return json.data; // { status: 'success'|'failed'|..., amount, reference, metadata, ... }
}

module.exports = { initializeTransaction, verifyTransaction };
