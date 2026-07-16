import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser, getProfile } from "@/lib/auth";
import { SetupNotice } from "@/components/setup-notice";
import { RegisterForm } from "@/components/register-form";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-xl font-bold text-neutral-900">{t("register.title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();
  if (!user) redirect("/login?next=/register");

  const profile = await getProfile();
  if (profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-neutral-700">{t("register.already_registered")}</p>
        <Link href="/dashboard" className="mt-4 inline-block font-semibold text-brand-600">
          {t("nav.dashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900">{t("register.title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("register.subtitle")}</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
