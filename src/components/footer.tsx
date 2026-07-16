import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  const helpline = process.env.NEXT_PUBLIC_HELPLINE_PHONE ?? "01700000000";

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-neutral-500">
        <p className="font-medium text-neutral-700">
          {t("footer.helpline")}:{" "}
          <a href={`tel:${helpline}`} className="font-semibold text-brand-600">
            {helpline}
          </a>
        </p>
        <p className="mt-1">{t("footer.made_for")}</p>
      </div>
    </footer>
  );
}
