// OIStride — outbound notification emails (Brief #11). Every function
// here catches its own errors and logs rather than throwing, since a
// Resend outage should never fail the payment/webhook flow that
// triggered it — email is a side effect, not the source of truth.

const { sendEmail } = require("./_resend");
const { wrapEmail } = require("./_email-templates");

function nairaFmt(kobo) {
  return "₦" + Math.round(kobo / 100).toLocaleString("en-US");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

async function sendPaymentConfirmationEmail({ email, programName, chargeType, amountKobo, remainingBalanceKobo, balanceDueDate }) {
  if (!email) return;
  try {
    let title, bodyHtml;
    if (chargeType === "full") {
      title = "Payment confirmed, you're in!";
      bodyHtml = `<p>Your payment of <strong>${nairaFmt(amountKobo)}</strong> for <strong>${programName}</strong> has been received in full. Your seat is secured.</p><p>A cohort community invite will follow within 24 hours.</p>`;
    } else if (chargeType === "deposit") {
      title = "Deposit confirmed, you're in!";
      bodyHtml = `<p>Your 70% deposit of <strong>${nairaFmt(amountKobo)}</strong> for <strong>${programName}</strong> has been received. Your seat is secured.</p><p>Remaining balance: <strong>${nairaFmt(remainingBalanceKobo)}</strong>, due <strong>${formatDate(balanceDueDate)}</strong>.</p>`;
    } else if (chargeType === "balance") {
      title = "Balance payment confirmed";
      bodyHtml = `<p>Your remaining balance payment of <strong>${nairaFmt(amountKobo)}</strong> for <strong>${programName}</strong> has been received. You're fully paid up.</p>`;
    } else {
      return;
    }
    await sendEmail({
      to: email,
      subject: title,
      html: wrapEmail({ title, bodyHtml }),
    });
  } catch (err) {
    console.error("sendPaymentConfirmationEmail failed:", err);
  }
}

async function sendBalanceReminderEmail({ email, programName, remainingBalanceKobo, balanceDueDate, stage }) {
  if (!email) return;
  try {
    const title = stage === "dueday"
      ? "Your balance is due today"
      : "Your remaining balance is due in 3 days";
    const bodyHtml = `<p>A friendly reminder: your remaining balance of <strong>${nairaFmt(remainingBalanceKobo)}</strong> for <strong>${programName}</strong> is due ${stage === "dueday" ? "today" : `on ${formatDate(balanceDueDate)}`}.</p><p>You can pay this from your account at any time.</p>`;
    await sendEmail({ to: email, subject: title, html: wrapEmail({ title, bodyHtml }) });
  } catch (err) {
    console.error("sendBalanceReminderEmail failed:", err);
  }
}

async function sendInternalNotification({ subject, bodyHtml }) {
  try {
    await sendEmail({
      to: "oistride12@gmail.com",
      subject,
      html: wrapEmail({ title: subject, bodyHtml }),
    });
  } catch (err) {
    console.error("sendInternalNotification failed:", err);
  }
}

module.exports = { sendPaymentConfirmationEmail, sendBalanceReminderEmail, sendInternalNotification, nairaFmt, formatDate };
