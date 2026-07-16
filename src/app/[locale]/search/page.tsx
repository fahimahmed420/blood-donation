import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupNotice } from "@/components/setup-notice";
import { SearchForm } from "@/components/search-form";
import { DonorCard } from "@/components/donor-card";
import { CompatibleGroups } from "@/components/compatible-groups";
import { BLOOD_GROUPS, type BloodGroup } from "@/lib/constants";
import type { Profile, PublicDonor } from "@/lib/types";
import { isEligible } from "@/lib/utils";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ group?: string; area?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { group, area } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold text-neutral-900">{t("search.title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let donors: (PublicDonor | Profile)[] = [];

  if (supabase) {
    if (user) {
      let query = supabase.from("profiles").select("*").order("is_available", { ascending: false });
      if (group) query = query.eq("blood_group", group);
      if (area) query = query.eq("area", area);
      const { data } = await query.limit(60);
      donors = (data as Profile[]) ?? [];
    } else {
      let query = supabase
        .from("donors_public")
        .select("*")
        .order("is_available", { ascending: false });
      if (group) query = query.eq("blood_group", group);
      if (area) query = query.eq("area", area);
      const { data } = await query.limit(60);
      donors = (data as PublicDonor[]) ?? [];
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">{t("search.title")}</h1>

      <SearchForm initialGroup={group as BloodGroup | undefined} initialArea={area} />

      <p className="mb-3 mt-6 text-sm font-medium text-neutral-500">
        {t("search.results_count", { count: donors.length })}
      </p>

      {donors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500">
          {t("search.no_results")}
        </p>
      ) : (
        <ul className="space-y-3">
          {donors.map((donor) => (
            <DonorCard
              key={donor.id}
              donor={donor}
              locale={locale}
              loggedIn={!!user}
              eligible={
                "is_eligible" in donor ? donor.is_eligible : isEligible(donor.last_donation_date)
              }
            />
          ))}
        </ul>
      )}

      {group && BLOOD_GROUPS.includes(group as BloodGroup) && (
        <CompatibleGroups group={group as BloodGroup} area={area} />
      )}
    </div>
  );
}
