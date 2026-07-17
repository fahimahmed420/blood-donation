import { getTranslations, setRequestLocale } from "next-intl/server";

interface MythFact {
  myth: string;
  fact: string;
}

export default async function AwarenessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("awareness");

  const eligibilityItems = t.raw("eligibility_items") as string[];
  const myths = t.raw("myths") as MythFact[];
  const afterItems = t.raw("after_items") as string[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-800">{t("eligibility_title")}</h2>
        <ul className="space-y-2">
          {eligibilityItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className="mt-0.5 text-emerald-600">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-semibold text-neutral-800">{t("myths_title")}</h2>
        <div className="space-y-3">
          {myths.map((m, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-medium text-red-600">✗ {m.myth}</p>
              <p className="mt-1 text-sm text-neutral-600">✓ {m.fact}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-800">{t("after_title")}</h2>
        <ul className="space-y-2">
          {afterItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className="mt-0.5 text-brand-600">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
