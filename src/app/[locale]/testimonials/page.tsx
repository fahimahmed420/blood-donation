import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/auth";
import { SetupNotice } from "@/components/setup-notice";
import { TestimonialForm } from "@/components/testimonial-form";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import { cloudinaryThumb } from "@/lib/cloudinary-url";
import type { TestimonialWithAuthor } from "@/lib/types";

export default async function TestimonialsPage({
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
        <h1 className="text-xl font-bold text-neutral-900">{t("testimonials.title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();
  const supabase = await createClient();
  const { data: stories } = supabase
    ? await supabase
        .from("testimonials")
        .select("*, profiles(full_name, area, avatar_url)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: null };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900">{t("testimonials.title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("testimonials.subtitle")}</p>

      <div className="mt-6">
        {user ? (
          <TestimonialForm />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-center text-sm text-neutral-500">
            <Link href="/login?next=/testimonials" className="font-medium text-brand-600">
              {t("testimonials.login_to_share")}
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {!stories || stories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500">
            {t("testimonials.no_stories")}
          </p>
        ) : (
          (stories as TestimonialWithAuthor[]).map((story) => (
            <article key={story.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-sm font-bold text-neutral-500">
                  {story.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cloudinaryThumb(story.profiles.avatar_url, 72)}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    (story.profiles?.full_name ?? "?").charAt(0)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-800">
                    {story.profiles?.full_name ?? t("testimonials.anonymous")}
                  </p>
                  <p className="text-xs text-neutral-400">{formatDate(story.created_at, locale)}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{story.message}</p>
              {story.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cloudinaryThumb(story.photo_url, 600)}
                  alt=""
                  className="mt-3 max-h-80 w-full rounded-lg object-cover"
                />
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
