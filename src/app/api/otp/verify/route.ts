import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_MAX_ATTEMPTS } from "@/lib/constants";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: otpRow } = await admin
    .from("phone_otps")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) {
    return NextResponse.json({ verified: false, reason: "no_otp" }, { status: 400 });
  }
  if (new Date(otpRow.expires_at) < new Date()) {
    return NextResponse.json({ verified: false, reason: "expired" }, { status: 400 });
  }
  if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ verified: false, reason: "too_many_attempts" }, { status: 400 });
  }

  if (hashCode(code) !== otpRow.code_hash) {
    await admin
      .from("phone_otps")
      .update({ attempts: otpRow.attempts + 1 })
      .eq("id", otpRow.id);
    return NextResponse.json({ verified: false, reason: "wrong_code" }, { status: 400 });
  }

  await admin.from("profiles").update({ phone_verified: true }).eq("id", user.id);
  await admin.from("phone_otps").delete().eq("user_id", user.id);

  return NextResponse.json({ verified: true });
}
