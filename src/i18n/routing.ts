import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bn", "en"],
  defaultLocale: "bn",
  // Bangla has no URL prefix (bn is the default, most-used locale);
  // English pages live under /en/...
  localePrefix: {
    mode: "as-needed",
  },
});
