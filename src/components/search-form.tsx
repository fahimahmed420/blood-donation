"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { BLOOD_GROUPS, AREAS, type BloodGroup } from "@/lib/constants";

export function SearchForm({
  initialGroup,
  initialArea,
}: {
  initialGroup?: BloodGroup;
  initialArea?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup ?? "");
  const [area, setArea] = useState(initialArea ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query: Record<string, string> = {};
    if (group) query.group = group;
    if (area) query.area = area;
    router.push({ pathname: "/search", query });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">
          {t("search.blood_group_label")}
        </label>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="">{t("search.any_group")}</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">
          {t("search.area_label")}
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="">{t("search.all_areas")}</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {t(`areas.${a}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="tap-target w-full rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-700 sm:w-auto"
        >
          {t("search.search_button")}
        </button>
      </div>
    </form>
  );
}
