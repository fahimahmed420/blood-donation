import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/auth";
import { SetupNotice } from "@/components/setup-notice";
import { AuthForm } from "@/components/auth-form";
import { BloodDropIcon } from "@/components/blood-drop-icon";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-xl font-bold text-neutral-900">{t("login_title")}</h1>
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <BloodDropIcon className="size-10 text-brand-600" />
      <h1 className="mt-3 text-xl font-bold text-neutral-900">{t("login_title")}</h1>
      <p className="mt-1 text-center text-sm text-neutral-500">{t("login_subtitle")}</p>
      <div className="mt-6 w-full">
        <AuthForm />
      </div>
    </div>
  );
}
