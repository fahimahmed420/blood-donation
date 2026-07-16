"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: "bn" | "en") {
    router.replace(
      // @ts-expect-error dynamic route params
      { pathname, params },
      { locale: next }
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 text-sm font-medium">
      <button
        onClick={() => switchTo("bn")}
        className={`tap-target rounded-full px-3 py-1.5 transition ${
          locale === "bn" ? "bg-white text-brand-700 shadow-sm" : "text-neutral-500"
        }`}
        aria-current={locale === "bn"}
      >
        বাংলা
      </button>
      <button
        onClick={() => switchTo("en")}
        className={`tap-target rounded-full px-3 py-1.5 transition ${
          locale === "en" ? "bg-white text-brand-700 shadow-sm" : "text-neutral-500"
        }`}
        aria-current={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
