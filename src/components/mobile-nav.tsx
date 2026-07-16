"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import type { Profile } from "@/lib/types";

export function MobileNav({
  profile,
  navLinks,
  loginLabel,
  dashboardLabel,
  adminLabel,
}: {
  profile: Profile | null;
  navLinks: { href: string; label: string }[];
  loginLabel: string;
  dashboardLabel: string;
  adminLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="tap-target flex items-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white px-4 pb-4 shadow-lg">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="tap-target flex items-center border-b border-neutral-100 py-3 text-base font-medium text-neutral-700"
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="tap-target flex items-center border-b border-neutral-100 py-3 text-base font-medium text-neutral-700"
                >
                  {dashboardLabel}
                </Link>
                {profile.is_admin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="tap-target flex items-center border-b border-neutral-100 py-3 text-base font-medium text-neutral-700"
                  >
                    {adminLabel}
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="tap-target flex items-center py-3 text-base font-semibold text-brand-600"
              >
                {loginLabel}
              </Link>
            )}
          </nav>
          <div className="pt-3">
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}
