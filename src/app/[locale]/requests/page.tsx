import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupNotice } from "@/components/setup-notice";
import { RequestCard } from "@/components/request-card";
import { NewRequestForm } from "@/components/new-request-form";
import { getUser } from "@/lib/auth";
import type { BloodRequest } from "@/lib/types";

export default async function RequestsPage({
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
        <h1 className="text-xl font-bold text-neutral-900">{t("requests.title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase
        .from("blood_requests")
        .select("*")
        .order("status", { ascending: true })
        .order("needed_by", { ascending: true })
        .limit(100)
    : { data: null };

  const requests = (data as BloodRequest[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("requests.title")}</h1>
      </div>

      {user && <NewRequestForm />}

      <ul className="mt-6 space-y-3">
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500">
            {t("requests.no_requests")}
          </p>
        ) : (
          requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              locale={locale}
              isOwner={user?.id === req.created_by}
            />
          ))
        )}
      </ul>
    </div>
  );
}
