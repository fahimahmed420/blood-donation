import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BloodGroupBadge } from "./blood-group-badge";
import { COMPATIBLE_DONOR_GROUPS, type BloodGroup } from "@/lib/constants";

export async function CompatibleGroups({ group, area }: { group: BloodGroup; area?: string }) {
  const t = await getTranslations("search");
  // Exclude the searched group itself — it's already covered by the search above.
  const alternatives = COMPATIBLE_DONOR_GROUPS[group].filter((g) => g !== group);

  if (alternatives.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-neutral-600">
        {t("compatible_groups_title", { group })}
      </p>
      <div className="flex flex-wrap gap-2">
        {alternatives.map((g) => (
          <Link
            key={g}
            href={{ pathname: "/search", query: area ? { group: g, area } : { group: g } }}
            className="tap-target flex items-center gap-1.5 rounded-full border border-neutral-200 py-1.5 pl-1.5 pr-3 hover:border-brand-300 hover:bg-brand-50"
          >
            <BloodGroupBadge group={g} size="sm" />
            <span className="text-sm font-medium text-neutral-700">{g}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
