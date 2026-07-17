import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { BloodGroupBadge } from "@/components/blood-group-badge";
import { SetupNotice } from "@/components/setup-notice";
import { BLOOD_GROUPS } from "@/lib/constants";
import { formatDate, localizeNumber } from "@/lib/utils";
import type { BloodRequest } from "@/lib/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let urgentRequests: BloodRequest[] = [];
  let donorCount = 0;
  let donationCount = 0;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    if (supabase) {
      const [{ data }, { count: dc }, { count: dnc }] = await Promise.all([
        supabase
          .from("blood_requests")
          .select("*")
          .eq("status", "open")
          .order("needed_by", { ascending: true })
          .limit(5),
        supabase.from("donors_public").select("id", { count: "exact", head: true }),
        supabase.from("donations").select("id", { count: "exact", head: true }),
      ]);
      urgentRequests = (data as BloodRequest[]) ?? [];
      donorCount = dc ?? 0;
      donationCount = dnc ?? 0;
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-b from-brand-50 to-white px-4 py-10 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-extrabold text-neutral-900 sm:text-3xl">
            {t("home.hero_title")}
          </h1>
          <p className="mt-2 text-neutral-600">{t("home.hero_subtitle")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="tap-target flex items-center rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              {t("nav.search")}
            </Link>
            <Link
              href="/register"
              className="tap-target flex items-center rounded-xl border-2 border-brand-600 bg-white px-6 py-3 font-semibold text-brand-600 hover:bg-brand-50"
            >
              {t("home.become_donor_button")}
            </Link>
          </div>
        </div>
      </section>

      {!isSupabaseConfigured && <SetupNotice />}

      {/* Community stats — social proof, only shown once there's something to show */}
      {donorCount > 0 && (
        <section className="mx-auto max-w-4xl px-4 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <p className="text-2xl font-extrabold text-brand-600">
                {localizeNumber(donorCount, locale)}
              </p>
              <p className="text-sm text-neutral-500">{t("home.stat_donors")}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <p className="text-2xl font-extrabold text-brand-600">
                {localizeNumber(donationCount, locale)}
              </p>
              <p className="text-sm text-neutral-500">{t("home.stat_donations")}</p>
            </div>
          </div>
        </section>
      )}

      {/* Blood group quick search */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="mb-4 text-center text-lg font-bold text-neutral-800">
          {t("home.find_by_group")}
        </h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {BLOOD_GROUPS.map((group) => (
            <Link
              key={group}
              href={{ pathname: "/search", query: { group } }}
              className="tap-target flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-center hover:border-brand-300 hover:shadow-sm"
            >
              <BloodGroupBadge group={group} size="md" />
            </Link>
          ))}
        </div>
      </section>

      {/* Urgent requests */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-800">{t("home.urgent_requests")}</h2>
          <Link href="/requests" className="text-sm font-medium text-brand-600">
            {t("home.view_all_requests")}
          </Link>
        </div>

        {urgentRequests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500">
            {t("home.no_urgent_requests")}
          </p>
        ) : (
          <ul className="space-y-3">
            {urgentRequests.map((req) => (
              <li
                key={req.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <BloodGroupBadge group={req.blood_group} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-800">{req.hospital}</p>
                  <p className="truncate text-sm text-neutral-500">
                    {t("requests.needed_by_label", { date: formatDate(req.needed_by, locale) })}
                  </p>
                </div>
                <a
                  href={`tel:${req.contact_phone}`}
                  className="tap-target flex shrink-0 items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  {t("search.call")}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="mb-6 text-center text-lg font-bold text-neutral-800">
          {t("home.how_it_works")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-neutral-200 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                {localizeNumber(n, locale)}
              </div>
              <h3 className="font-semibold text-neutral-800">
                {t(`home.step${n}_title` as "home.step1_title")}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                {t(`home.step${n}_desc` as "home.step1_desc")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Helpline for non-tech-savvy users */}
      <section className="mx-auto max-w-4xl px-4 pb-10">
        <div className="rounded-xl bg-neutral-800 p-6 text-center text-white">
          <h2 className="font-bold">{t("home.helpline_title")}</h2>
          <p className="mt-1 text-sm text-neutral-300">{t("home.helpline_desc")}</p>
          <a
            href={`tel:${process.env.NEXT_PUBLIC_HELPLINE_PHONE ?? "01700000000"}`}
            className="tap-target mt-4 inline-flex items-center rounded-lg bg-white px-5 py-2.5 font-semibold text-neutral-900"
          >
            {process.env.NEXT_PUBLIC_HELPLINE_PHONE ?? "01700000000"}
          </a>
        </div>
      </section>
    </div>
  );
}
