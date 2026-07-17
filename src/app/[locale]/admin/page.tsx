import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { smsEnabled } from "@/lib/sms";
import { SetupNotice } from "@/components/setup-notice";
import { BloodGroupBadge } from "@/components/blood-group-badge";
import { AdminVerifyButton, AdminDeleteRequestButton } from "@/components/admin-buttons";
import { formatDate, localizeNumber } from "@/lib/utils";
import type { Profile, BloodRequest } from "@/lib/types";

const SMS_COST_PER_SEGMENT_TK = 0.3;
const SMS_MONTHLY_CAP = Number(process.env.SMS_MONTHLY_CAP ?? "1800");

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold text-neutral-900">{t("admin.title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!profile.is_admin) redirect("/dashboard");

  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [{ data: unverified }, { data: requests }, { data: smsRows }] = supabase
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("is_verified", false)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("blood_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("sms_log")
          .select("segments")
          .gte("sent_at", monthStart.toISOString()),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const smsCount = smsRows?.length ?? 0;
  const smsSegments = (smsRows ?? []).reduce((sum, r) => sum + ((r as { segments: number }).segments ?? 1), 0);
  const smsCostTk = (smsSegments * SMS_COST_PER_SEGMENT_TK).toFixed(0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("admin.title")}</h1>
        <a
          href="/api/admin/export"
          className="tap-target flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {t("admin.export_csv")}
        </a>
      </div>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-800">{t("admin.sms_meter_title")}</h2>
        {!smsEnabled ? (
          <p className="text-sm text-amber-600">{t("admin.sms_disabled_notice")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label={t("admin.sms_sent")} value={localizeNumber(smsCount, locale)} />
            <Stat label={t("admin.sms_estimated_cost")} value={`৳${localizeNumber(Number(smsCostTk), locale)}`} />
            <Stat label={t("admin.sms_cap")} value={localizeNumber(SMS_MONTHLY_CAP, locale)} />
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-neutral-800">{t("admin.unverified_donors")}</h2>
        {!unverified || unverified.length === 0 ? (
          <p className="text-sm text-neutral-400">—</p>
        ) : (
          <ul className="space-y-2">
            {(unverified as Profile[]).map((donor) => (
              <li
                key={donor.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
              >
                <BloodGroupBadge group={donor.blood_group} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-800">{donor.full_name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {donor.phone} · {t(`areas.${donor.area}`)}
                    {donor.phone_verified ? ` · ${t("search.phone_verified")}` : ""}
                  </p>
                </div>
                <AdminVerifyButton donorId={donor.id} label={t("admin.verify")} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-neutral-800">{t("admin.all_requests")}</h2>
        {!requests || requests.length === 0 ? (
          <p className="text-sm text-neutral-400">—</p>
        ) : (
          <ul className="space-y-2">
            {(requests as BloodRequest[]).map((req) => (
              <li
                key={req.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
              >
                <BloodGroupBadge group={req.blood_group} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-800">
                    {req.patient_name} · {req.hospital}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {req.status} · {formatDate(req.needed_by, locale)}
                  </p>
                </div>
                <AdminDeleteRequestButton requestId={req.id} label={t("admin.remove")} confirmLabel={t("admin.delete_confirm")} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-neutral-800">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
