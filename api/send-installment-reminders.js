// GET /api/send-installment-reminders
// Triggered daily by Vercel Cron (see vercel.json). Brief #11 item 4 —
// the 3-day-before / due-day / Jed-escalation sequence. The exact timing
// and copy weren't available to build against directly (referenced as
// "Part B #2 of the tracker", a document not shared with this build), so
// this is a reasonable interpretation: 3 days before the due date, on the
// due date, and an escalation to Jed once 3+ days overdue (which also
// flips installment_status to 'overdue'). Flag if the real spec differs.
//
// If CRON_SECRET is set in Vercel, this only runs for requests carrying
// it (Vercel attaches it automatically to its own cron-triggered
// requests) — without it, anyone who found the URL could trigger emails
// and the overdue-status flip on demand. Optional rather than required
// so this doesn't break before Jed sets that env var.

const { getProgramPricing } = require("./_pricing");
const { getEnrollmentsNeedingReminders, updateEnrollmentById, getUserEmailById } = require("./_supabase");
const { sendBalanceReminderEmail, sendInternalNotification, nairaFmt, formatDate } = require("./_notifications");

function daysUntil(dateStr) {
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const due = new Date(dateStr + "T00:00:00Z").getTime();
  return Math.round((due - todayUTC) / 86400000);
}

module.exports = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  try {
    const rows = await getEnrollmentsNeedingReminders();
    const results = { threeDay: 0, dueDay: 0, escalated: 0, errors: 0 };

    for (const row of rows) {
      try {
        const days = daysUntil(row.balance_due_date);
        const pricing = getProgramPricing(row.program_slug);
        const programName = pricing ? pricing.name : row.program_slug;

        if (days === 3 && !row.reminder_3day_sent_at) {
          const email = await getUserEmailById(row.user_id);
          await sendBalanceReminderEmail({
            email, programName, remainingBalanceKobo: row.remaining_balance_kobo,
            balanceDueDate: row.balance_due_date, stage: "3day",
          });
          await updateEnrollmentById(row.id, { reminder_3day_sent_at: new Date().toISOString() });
          results.threeDay++;
        } else if (days === 0 && !row.reminder_dueday_sent_at) {
          const email = await getUserEmailById(row.user_id);
          await sendBalanceReminderEmail({
            email, programName, remainingBalanceKobo: row.remaining_balance_kobo,
            balanceDueDate: row.balance_due_date, stage: "dueday",
          });
          await updateEnrollmentById(row.id, { reminder_dueday_sent_at: new Date().toISOString() });
          results.dueDay++;
        } else if (days <= -3 && !row.reminder_escalated_at) {
          const email = await getUserEmailById(row.user_id);
          await sendInternalNotification({
            subject: `Overdue balance: ${programName}`,
            bodyHtml: `<p>An installment balance is now ${Math.abs(days)} days overdue.</p>
              <p><strong>Program:</strong> ${programName}<br>
              <strong>Enrollee email:</strong> ${email || "(not found)"}<br>
              <strong>Remaining balance:</strong> ${nairaFmt(row.remaining_balance_kobo)}<br>
              <strong>Was due:</strong> ${formatDate(row.balance_due_date)}</p>`,
          });
          await updateEnrollmentById(row.id, {
            reminder_escalated_at: new Date().toISOString(),
            installment_status: "overdue",
          });
          results.escalated++;
        }
      } catch (err) {
        console.error("send-installment-reminders row error:", row.id, err);
        results.errors++;
      }
    }

    res.status(200).json({ ok: true, checked: rows.length, ...results });
  } catch (err) {
    console.error("send-installment-reminders error:", err);
    res.status(500).json({ error: "Failed to run reminders." });
  }
};
