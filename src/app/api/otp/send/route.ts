import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, smsEnabled, otpTemplate } from "@/lib/sms";
import { isOtpRateLimited } from "@/lib/rate-limit";
import { normalizeBdPhone } from "@/lib/utils";
import { OTP_TTL_MINUTES } from "@/lib/constants";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  if (!smsEnabled) {
    return NextResponse.json({ sent: false, reason: "disabled" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ sent: false, reason: "disabled" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = normalizeBdPhone(String(body.phone ?? ""));
  if (!phone) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  if (await isOtpRateLimited(user.id)) {
    return NextResponse.json({ sent: false, reason: "rate_limited" }, { status: 429 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ sent: false, reason: "disabled" });
  }

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await admin.from("phone_otps").insert({
    user_id: user.id,
    phone,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  });

  const result = await sendSms(phone, otpTemplate(code), "otp", { recipientId: user.id });

  if (!result.ok) {
    return NextResponse.json({ sent: false, reason: result.reason ?? "provider_error" });
  }

  return NextResponse.json({ sent: true });
}
