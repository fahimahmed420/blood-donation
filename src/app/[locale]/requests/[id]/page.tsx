import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { BloodGroupBadge } from "@/components/blood-group-badge";
import { ShareButton } from "@/components/share-button";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { BloodRequest } from "@/lib/types";

async function getRequest(id: string) {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("blood_requests").select("*").eq("id", id).maybeSingle();
  return data as BloodRequest | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const request = await getRequest(id);
  if (!request) return {};

  const t = await getTranslations({ locale, namespace: "requests" });
  const title =
    locale === "bn"
      ? `জরুরি! ${request.blood_group} রক্ত প্রয়োজন — ${request.hospital}`
      : `Urgent! ${request.blood_group} blood needed — ${request.hospital}`;
  const description = t("needed_by_label", { date: formatDate(request.needed_by, locale) });

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const request = await getRequest(id);
  if (!request) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}${locale === "en" ? "/en" : ""}/requests/${id}`;

  const statusStyles: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    fulfilled: "bg-emerald-100 text-emerald-700",
    expired: "bg-neutral-200 text-neutral-500",
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <BloodGroupBadge group={request.blood_group} size="lg" />
          <div className="min-w-0 flex-1">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[request.status]}`}
            >
              {t(`requests.status_${request.status}` as "requests.status_open")}
            </span>
            <h1 className="mt-1 text-lg font-bold text-neutral-900">{request.hospital}</h1>
            <p className="text-sm text-neutral-500">
              {t("requests.needed_by_label", { date: formatDate(request.needed_by, locale) })}
            </p>
          </div>
        </div>

        {request.details && (
          <p className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
            {request.details}
          </p>
        )}

        {request.status === "open" && (
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`tel:${request.contact_phone}`}
              className="tap-target flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {t("search.call")}
            </a>
            <a
              href={whatsappLink(request.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {t("search.whatsapp")}
            </a>
          </div>
        )}

        <div className="mt-5 border-t border-neutral-100 pt-4">
          <ShareButton url={pageUrl} label={t("requests.share_facebook")} />
        </div>
      </div>
    </div>
  );
}
