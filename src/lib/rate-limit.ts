import "server-only";
import { createAdminClient } from "./supabase/admin";
import { ALERT_WEEKLY_LIMIT_PER_DONOR, OTP_HOURLY_LIMIT } from "./constants";

/** How many OTP SMS this user has received in the last hour. */
export async function otpSendsThisHour(userId: string): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("sms_log")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("sms_type", "otp")
    .gte("sent_at", since);
  return count ?? 0;
}

export async function isOtpRateLimited(userId: string): Promise<boolean> {
  return (await otpSendsThisHour(userId)) >= OTP_HOURLY_LIMIT;
}

/** Filters out donors who already got 3+ alert SMS in the last 7 days. */
export async function filterByWeeklyAlertLimit(donorIds: string[]): Promise<string[]> {
  if (donorIds.length === 0) return [];
  const admin = createAdminClient();
  if (!admin) return donorIds;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("sms_log")
    .select("recipient_id")
    .eq("sms_type", "alert")
    .in("recipient_id", donorIds)
    .gte("sent_at", since);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = (row as { recipient_id: string }).recipient_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return donorIds.filter((id) => (counts.get(id) ?? 0) < ALERT_WEEKLY_LIMIT_PER_DONOR);
}
