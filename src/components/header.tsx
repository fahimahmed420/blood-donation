import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { BloodDropIcon } from "./blood-drop-icon";
import { MobileNav } from "./mobile-nav";
import type { Profile } from "@/lib/types";

export async function Header({ profile }: { profile: Profile | null }) {
  const t = await getTranslations();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/search", label: t("nav.search") },
    { href: "/requests", label: t("nav.requests") },
    { href: "/testimonials", label: t("nav.testimonials") },
    { href: "/register", label: t("nav.register") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-600">
          <BloodDropIcon className="size-7" />
          <span className="text-lg">{t("site.name")}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="tap-target flex items-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          {profile ? (
            <Link
              href="/dashboard"
              className="tap-target flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("nav.dashboard")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="tap-target flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>

        <MobileNav profile={profile} navLinks={navLinks} loginLabel={t("nav.login")} dashboardLabel={t("nav.dashboard")} adminLabel={t("nav.admin")} />
      </div>
    </header>
  );
}
