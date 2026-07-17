import { getTranslations } from "next-intl/server";
import { getBadgeTier, BADGE_COLORS } from "@/lib/badges";

export async function DonorBadge({ donationCount }: { donationCount: number }) {
  const tier = getBadgeTier(donationCount);
  if (!tier) return null;

  const t = await getTranslations("badges");

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[tier]}`}>
      {t(tier)}
    </span>
  );
}
