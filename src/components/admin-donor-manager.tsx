"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  adminSetVerifiedAction,
  adminSetAdminAction,
  adminUpdateDonorAction,
  adminDeleteDonorAction,
} from "@/lib/actions";
import { BLOOD_GROUPS, AREAS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function AdminDonorManager({
  donors,
  currentUserId,
}: {
  donors: Profile[];
  currentUserId: string;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return donors;
    return donors.filter(
      (d) =>
        d.full_name.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.blood_group.toLowerCase().includes(q)
    );
  }, [donors, query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("admin.search_donors")}
        className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-400">—</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((donor) => (
            <AdminDonorRow key={donor.id} donor={donor} isSelf={donor.id === currentUserId} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminDonorRow({ donor, isSelf }: { donor: Profile; isSelf: boolean }) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
    });
  }

  async function onSave(formData: FormData) {
    setError(null);
    const res = await adminUpdateDonorAction(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setEditing(false);
    }
  }

  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
          {donor.blood_group}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-medium text-neutral-800">{donor.full_name}</p>
            {donor.is_verified && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                {t("search.verified")}
              </span>
            )}
            {donor.is_admin && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                {t("admin.admin_badge")}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-neutral-500">
            {donor.phone} · {t(`areas.${donor.area}`)}
          </p>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="tap-target shrink-0 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-600"
        >
          {editing ? t("admin.close") : t("admin.edit")}
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          disabled={pending}
          onClick={() => run(() => adminSetVerifiedAction(donor.id, !donor.is_verified))}
          className="rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 disabled:opacity-60"
        >
          {donor.is_verified ? t("admin.unverify") : t("admin.verify")}
        </button>
        {!isSelf && (
          <button
            disabled={pending}
            onClick={() => run(() => adminSetAdminAction(donor.id, !donor.is_admin))}
            className="rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 disabled:opacity-60"
          >
            {donor.is_admin ? t("admin.remove_admin") : t("admin.make_admin")}
          </button>
        )}
        {!isSelf && (
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm(t("admin.delete_confirm"))) return;
              run(() => adminDeleteDonorAction(donor.id));
            }}
            className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 disabled:opacity-60"
          >
            {t("admin.remove")}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{t(`admin.error_${error}` as "admin.error_update_failed")}</p>}

      {editing && (
        <form action={onSave} className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          <input type="hidden" name="donor_id" value={donor.id} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-neutral-600">
              {t("register.full_name")}
              <input
                name="full_name"
                defaultValue={donor.full_name}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-neutral-600">
              {t("register.phone")}
              <input
                name="phone"
                defaultValue={donor.phone}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-neutral-600">
              {t("register.blood_group")}
              <select
                name="blood_group"
                defaultValue={donor.blood_group}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-600">
              {t("register.area")}
              <select
                name="area"
                defaultValue={donor.area}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {t(`areas.${a}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-600">
              {t("register.last_donation")}
              <input
                type="date"
                name="last_donation_date"
                defaultValue={donor.last_donation_date ?? ""}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 self-end text-xs text-neutral-600">
              <input type="checkbox" name="available" defaultChecked={donor.is_available} />
              {t("register.available")}
            </label>
          </div>
          <button
            type="submit"
            className="tap-target rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
          >
            {t("dashboard.save")}
          </button>
        </form>
      )}
    </li>
  );
}
