import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, smsEnabled, requestAlertTemplate } from "@/lib/sms";
import { sendPush, pushEnabled } from "@/lib/webpush";
import { filterByWeeklyAlertLimit } from "@/lib/rate-limit";
import { normalizeBdPhone, isEligible } from "@/lib/utils";
import {
  BLOOD_GROUPS,
  MAX_OPEN_REQUESTS_PER_USER,
  ALERT_DONORS_PER_REQUEST,
} from "@/lib/constants";

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

  const patientName = String(body.patient_name ?? "").trim();
  const bloodGroup = String(body.blood_group ?? "");
  const bagsNeeded = Number(body.bags_needed ?? 1);
  const hospital = String(body.hospital ?? "").trim();
  const contactPhone = normalizeBdPhone(String(body.contact_phone ?? ""));
  const neededBy = String(body.needed_by ?? "");
  const details = body.details ? String(body.details).trim().slice(0, 500) : null;

  if (
    patientName.length < 2 ||
    !BLOOD_GROUPS.includes(bloodGroup as (typeof BLOOD_GROUPS)[number]) ||
    !Number.isInteger(bagsNeeded) ||
    bagsNeeded < 1 ||
    bagsNeeded > 20 ||
    hospital.length < 2 ||
    !contactPhone ||
    !neededBy
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { count } = await supabase
    .from("blood_requests")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id)
    .eq("status", "open");

  if ((count ?? 0) >= MAX_OPEN_REQUESTS_PER_USER) {
    return NextResponse.json({ error: "limit_reached" }, { status: 400 });
  }

  const { data: created, error } = await supabase
    .from("blood_requests")
    .insert({
      patient_name: patientName,
      blood_group: bloodGroup,
      bags_needed: bagsNeeded,
      hospital,
      contact_phone: contactPhone,
      needed_by: neededBy,
      details,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !created) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  if (smsEnabled) {
    void alertMatchingDonors(created.id, bloodGroup, hospital, contactPhone);
  }
  if (pushEnabled) {
    void pushMatchingDonors(bloodGroup, hospital, created.id);
  }

  return NextResponse.json({ request: created });
}

async function alertMatchingDonors(
  requestId: string,
  bloodGroup: string,
  hospital: string,
  contactPhone: string
) {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: candidates } = await admin
    .from("profiles")
    .select("id, phone, last_donation_date")
    .eq("blood_group", bloodGroup)
    .eq("is_available", true)
    .eq("sms_opt_in", true)
    .eq("phone_verified", true)
    .limit(ALERT_DONORS_PER_REQUEST * 3);

  const eligible = (candidates ?? []).filter((c) => isEligible(c.last_donation_date));
  const allowedIds = await filterByWeeklyAlertLimit(eligible.map((c) => c.id));
  const toAlert = eligible.filter((c) => allowedIds.includes(c.id)).slice(0, ALERT_DONORS_PER_REQUEST);

  const message = requestAlertTemplate(bloodGroup, hospital, contactPhone);

  await Promise.all(
    toAlert.map((donor) =>
      sendSms(donor.phone, message, "alert", { recipientId: donor.id, requestId })
    )
  );
}

async function pushMatchingDonors(bloodGroup: string, hospital: string, requestId: string) {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: candidates } = await admin
    .from("profiles")
    .select("id, last_donation_date")
    .eq("blood_group", bloodGroup)
    .eq("is_available", true);

  const eligibleIds = (candidates ?? [])
    .filter((c) => isEligible(c.last_donation_date))
    .map((c) => c.id);
  if (eligibleIds.length === 0) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("donor_id", eligibleIds);

  const payload = {
    title: `${bloodGroup} — জরুরি রক্তের প্রয়োজন`,
    body: hospital,
    url: `/requests/${requestId}`,
  };

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result.expired) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    })
  );
}
