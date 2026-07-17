import "server-only";
import webpush from "web-push";

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

export const pushEnabled = PUBLIC_KEY.length > 0 && PRIVATE_KEY.length > 0;

if (pushEnabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends one push notification. Free — no per-message cost, no monthly cap
 * needed (unlike SMS). Silently no-ops if VAPID keys aren't configured, and
 * swallows individual send failures (e.g. an expired subscription) since
 * one dead subscription shouldn't block the rest of the fan-out.
 */
export async function sendPush(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: boolean; expired?: boolean }> {
  if (!pushEnabled) return { ok: false };

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 404/410 = the subscription is gone (user uninstalled, cleared data, etc.)
    return { ok: false, expired: statusCode === 404 || statusCode === 410 };
  }
}
