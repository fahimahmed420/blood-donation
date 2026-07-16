"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProfileAction, signOutAction } from "@/lib/actions";
import { AREAS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function DashboardProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (!res.error) setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">
          {t("register.full_name")}
        </label>
        <input
          name="full_name"
          defaultValue={profile.full_name}
          required
          minLength={2}
          maxLength={80}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">
          {t("register.area")}
        </label>
        <select
          name="area"
          defaultValue={profile.area}
          required
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {t(`areas.${a}`)}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          name="available"
          type="checkbox"
          defaultChecked={profile.is_available}
          className="size-5"
        />
        {t("dashboard.availability")}
      </label>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          name="sms_opt_in"
          type="checkbox"
          defaultChecked={profile.sms_opt_in}
          className="size-5"
        />
        {t("register.sms_consent")}
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="tap-target rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("dashboard.save")}
        </button>
        {saved && <span className="text-sm text-emerald-600">{t("dashboard.saved")}</span>}
      </div>

      <button
        type="button"
        onClick={() => signOutAction()}
        className="tap-target text-sm font-medium text-neutral-400"
      >
        {t("nav.logout")}
      </button>
    </form>
  );
}
