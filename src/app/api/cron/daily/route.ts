import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, smsEnabled, reminderTemplate } from "@/lib/sms";
import { ELIGIBLE_DAYS } from "@/lib/constants";

/**
 * Runs once a day (see vercel.json). Two jobs:
 *  1. SMS donors who crossed the 90-day eligibility mark today.
 *  2. Mark open blood requests past their needed_by date as expired.
 *
 * Protected by CRON_SECRET — Vercel automatically sends
 * "Authorization: Bearer <CRON_SECRET>" when that env var is set on the
 * cron's project, so no extra config is needed beyond setting the env var.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // --- Job 1: eligibility reminders --------------------------------------
  let remindersSent = 0;
  if (smsEnabled) {
    const eligibleDate = new Date(today);
    eligibleDate.setUTCDate(eligibleDate.getUTCDate() - ELIGIBLE_DAYS);
    const eligibleDateStr = eligibleDate.toISOString().slice(0, 10);

    const { data: donors } = await admin
      .from("profiles")
      .select("id, phone")
      .eq("last_donation_date", eligibleDateStr)
      .eq("sms_opt_in", true)
      .eq("phone_verified", true);

    for (const donor of donors ?? []) {
      // Guard against double-sending if the cron is ever triggered twice
      // in one day (e.g. a manual retry).
      const { count } = await admin
        .from("sms_log")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", donor.id)
        .eq("sms_type", "reminder")
        .gte("sent_at", `${todayStr}T00:00:00Z`);

      if ((count ?? 0) > 0) continue;

      const result = await sendSms(donor.phone, reminderTemplate(), "reminder", {
        recipientId: donor.id,
      });
      if (result.ok) remindersSent++;
    }
  }

  // --- Job 2: expire stale requests ---------------------------------------
  const { data: expired } = await admin
    .from("blood_requests")
    .update({ status: "expired" })
    .eq("status", "open")
    .lt("needed_by", todayStr)
    .select("id");

  return NextResponse.json({
    ok: true,
    remindersSent,
    requestsExpired: expired?.length ?? 0,
  });
}
