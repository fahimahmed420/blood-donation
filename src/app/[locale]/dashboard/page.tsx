import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getUser, getProfile } from "@/lib/auth";
import { SetupNotice } from "@/components/setup-notice";
import { DashboardProfileForm } from "@/components/dashboard-profile-form";
import { MarkDonatedButton } from "@/components/mark-donated-button";
import { PushToggle } from "@/components/push-toggle";
import { RequestCard } from "@/components/request-card";
import { BloodGroupBadge } from "@/components/blood-group-badge";
import { DonorBadge } from "@/components/donor-badge";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import type { Donation, BloodRequest } from "@/lib/types";

export default async function DashboardPage({
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
        <h1 className="text-xl font-bold text-neutral-900">{t("dashboard.title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const profile = await getProfile();
  if (!profile) redirect("/register");

  const supabase = await createClient();
  const [{ data: donations }, { data: myRequests }] = supabase
    ? await Promise.all([
        supabase
          .from("donations")
          .select("*")
          .eq("donor_id", user.id)
          .order("donated_at", { ascending: false })
          .limit(20),
        supabase
          .from("blood_requests")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <BloodGroupBadge group={profile.blood_group} size="lg" />
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{profile.full_name}</h1>
          <p className="text-sm text-neutral-500">{t(`areas.${profile.area}`)}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {profile.is_verified && (
              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {t("dashboard.verified_badge")}
              </span>
            )}
            <DonorBadge donationCount={donations?.length ?? 0} />
          </div>
          {!profile.is_verified && (
            <p className="mt-1 text-xs text-amber-600">{t("dashboard.unverified_notice")}</p>
          )}
        </div>
      </div>

      <MarkDonatedButton />

      <div className="mt-4">
        <PushToggle />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold text-neutral-800">{t("dashboard.edit_profile")}</h2>
        <DashboardProfileForm profile={profile} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold text-neutral-800">{t("dashboard.donation_history")}</h2>
        {!donations || donations.length === 0 ? (
          <p className="text-sm text-neutral-400">{t("dashboard.no_donations")}</p>
        ) : (
          <ul className="space-y-1.5">
            {(donations as Donation[]).map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600"
              >
                {formatDate(d.donated_at, locale)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold text-neutral-800">{t("dashboard.my_requests")}</h2>
        {!myRequests || myRequests.length === 0 ? (
          <p className="text-sm text-neutral-400">{t("requests.no_requests")}</p>
        ) : (
          <ul className="space-y-3">
            {(myRequests as BloodRequest[]).map((req) => (
              <RequestCard key={req.id} request={req} locale={locale} isOwner={true} />
            ))}
          </ul>
        )}
        <Link href="/requests" className="mt-3 inline-block text-sm font-medium text-brand-600">
          {t("requests.new_request")}
        </Link>
      </section>
    </div>
  );
}
