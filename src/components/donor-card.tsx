import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DonorAvatar } from "./donor-avatar";
import { DonorBadge } from "./donor-badge";
import { formatDate, whatsappLink, daysUntilEligible, localizeNumber } from "@/lib/utils";
import type { Profile, PublicDonor } from "@/lib/types";

export async function DonorCard({
  donor,
  locale,
  loggedIn,
  eligible,
  donationCount = 0,
}: {
  donor: PublicDonor | Profile;
  locale: string;
  loggedIn: boolean;
  eligible: boolean;
  donationCount?: number;
}) {
  const t = await getTranslations();
  const phone = "phone" in donor ? donor.phone : null;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <DonorAvatar photoUrl={donor.avatar_url} bloodGroup={donor.blood_group} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-semibold text-neutral-800">{donor.full_name}</p>
          {donor.is_verified && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t("search.verified")}
            </span>
          )}
          <DonorBadge donationCount={donationCount} />
        </div>
        <p className="truncate text-sm text-neutral-500">{t(`areas.${donor.area}`)}</p>
        <p className="mt-0.5 text-xs">
          {eligible ? (
            <span className="font-medium text-emerald-600">{t("search.eligible_now")}</span>
          ) : (
            <span className="text-amber-600">
              {t("search.eligible_in_days", {
                days: localizeNumber(daysUntilEligible(donor.last_donation_date), locale),
              })}
            </span>
          )}
        </p>
        {donor.last_donation_date && (
          <p className="mt-0.5 text-xs text-neutral-400">
            {t("search.last_donated")}: {formatDate(donor.last_donation_date, locale)}
          </p>
        )}
      </div>

      {loggedIn && phone ? (
        <div className="flex shrink-0 flex-col gap-1.5">
          <a
            href={`tel:${phone}`}
            className="tap-target flex items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
          >
            {t("search.call")}
          </a>
          <a
            href={whatsappLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
          >
            {t("search.whatsapp")}
          </a>
        </div>
      ) : (
        <Link
          href="/login"
          className="tap-target flex shrink-0 items-center rounded-lg border border-brand-600 px-3 py-2 text-sm font-semibold text-brand-600"
        >
          {t("search.login_to_call")}
        </Link>
      )}
    </li>
  );
}
