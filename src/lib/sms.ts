import "server-only";
import { createAdminClient } from "./supabase/admin";

const PROVIDER = process.env.SMS_PROVIDER ?? "smsnetbd";
const API_KEY = process.env.SMS_API_KEY ?? "";
const SENDER_ID = process.env.SMS_SENDER_ID ?? "";
const MONTHLY_CAP = Number(process.env.SMS_MONTHLY_CAP ?? "1800");

export const smsEnabled = API_KEY.length > 0;

export type SmsType = "otp" | "alert" | "reminder" | "test";

/**
 * Bangla text is sent as Unicode SMS: 70 chars/segment (vs 160 for GSM/English).
 * Keep templates short — this is why every message below is compact.
 */
export function countSegments(message: string): number {
  const isAscii = /^[\x00-\x7F]*$/.test(message);
  const limit = isAscii ? 160 : 70;
  return Math.max(1, Math.ceil(message.length / limit));
}

interface SendResult {
  ok: boolean;
  reason?: "disabled" | "cap_reached" | "provider_error";
}

/**
 * Send one SMS, respecting the monthly budget cap. Silently no-ops
 * (returns ok:false, reason:"disabled") if no gateway is configured —
 * callers must treat that as a normal, non-fatal outcome.
 */
export async function sendSms(
  phone: string,
  message: string,
  type: SmsType,
  opts: { recipientId?: string; requestId?: string } = {}
): Promise<SendResult> {
  if (!smsEnabled) return { ok: false, reason: "disabled" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "disabled" };

  const withinCap = await checkMonthlyCap(admin, MONTHLY_CAP);
  if (!withinCap) return { ok: false, reason: "cap_reached" };

  const segments = countSegments(message);

  try {
    await callProvider(phone, message);
  } catch {
    return { ok: false, reason: "provider_error" };
  }

  await admin.from("sms_log").insert({
    recipient_phone: phone,
    recipient_id: opts.recipientId ?? null,
    sms_type: type,
    request_id: opts.requestId ?? null,
    segments,
  });

  return { ok: true };
}

async function checkMonthlyCap(
  admin: ReturnType<typeof createAdminClient>,
  cap: number
): Promise<boolean> {
  if (!admin) return false;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count } = await admin
    .from("sms_log")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", monthStart.toISOString());

  return (count ?? 0) < cap;
}

async function callProvider(phone: string, message: string): Promise<void> {
  const bdNumber = phone.startsWith("880") ? phone : `880${phone.slice(1)}`;

  if (PROVIDER === "bulksmsbd") {
    const url = new URL("http://bulksmsbd.net/api/smsapi");
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("senderid", SENDER_ID);
    url.searchParams.set("number", bdNumber);
    url.searchParams.set("message", message);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`bulksmsbd http ${res.status}`);
    return;
  }

  // default: smsnetbd (Alpha SMS) — https://sms.net.bd
  // POST form-encoded; the API returns HTTP 200 even on failure, with a
  // JSON body where error === 0 means success.
  const body = new URLSearchParams({ api_key: API_KEY, to: bdNumber, msg: message });
  const res = await fetch("https://api.sms.net.bd/sendsms", { method: "POST", body });
  if (!res.ok) throw new Error(`sms.net.bd http ${res.status}`);
  const json = (await res.json()) as { error: number; msg?: string };
  if (json.error !== 0) throw new Error(`sms.net.bd error ${json.error}: ${json.msg ?? ""}`);
}

// ---------------------------------------------------------------------------
// Templates — Bangla, kept under 70 chars to fit one SMS segment.
// ---------------------------------------------------------------------------

export function otpTemplate(code: string): string {
  return `আপনার Savar Blood OTP কোড: ${code}। ${5} মিনিটের মধ্যে ব্যবহার করুন।`;
}

export function requestAlertTemplate(bloodGroup: string, hospital: string, phone: string): string {
  return `জরুরি! ${bloodGroup} রক্ত লাগবে, ${hospital}। ফোন: ${phone}`;
}

export function reminderTemplate(): string {
  return `আপনি এখন রক্ত দান করতে পারবেন। সাহায্য করতে চাইলে Savar Blood-এ available করুন।`;
}
