import { getTranslations } from "next-intl/server";

export async function SetupNotice() {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto my-8 max-w-md rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
      <p className="font-semibold text-amber-800">{t("setup_needed_title")}</p>
      <p className="mt-1 text-sm text-amber-700">{t("setup_needed_desc")}</p>
    </div>
  );
}
