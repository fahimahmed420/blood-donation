export type BadgeTier = "gold" | "silver" | "bronze" | null;

const TIERS: { min: number; tier: BadgeTier }[] = [
  { min: 10, tier: "gold" },
  { min: 3, tier: "silver" },
  { min: 1, tier: "bronze" },
];

export function getBadgeTier(donationCount: number): BadgeTier {
  return TIERS.find((t) => donationCount >= t.min)?.tier ?? null;
}

export const BADGE_COLORS: Record<Exclude<BadgeTier, null>, string> = {
  gold: "bg-amber-100 text-amber-700",
  silver: "bg-neutral-200 text-neutral-600",
  bronze: "bg-orange-100 text-orange-700",
};
