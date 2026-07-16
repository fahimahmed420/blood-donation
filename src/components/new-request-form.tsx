"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BLOOD_GROUPS, HOSPITAL_KEYS } from "@/lib/constants";

export function NewRequestForm() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.bags_needed = String(Number(payload.bags_needed) || 1);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="tap-target flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
      >
        {t("requests.new_request")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <Field label={t("requests.patient_name")}>
        <input
          name="patient_name"
          required
          minLength={2}
          maxLength={80}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("requests.blood_group")}>
          <select
            name="blood_group"
            required
            defaultValue=""
            className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="" disabled>
              —
            </option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("requests.bags_needed")}>
          <input
            name="bags_needed"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            required
            className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </Field>
      </div>

      <Field label={t("requests.hospital")}>
        <input
          name="hospital"
          required
          minLength={2}
          maxLength={120}
          list="hospital-list"
          placeholder={t("requests.hospital_placeholder")}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        <datalist id="hospital-list">
          {HOSPITAL_KEYS.map((h) => (
            <option key={h} value={t(`hospitals.${h}`)} />
          ))}
        </datalist>
      </Field>

      <Field label={t("requests.contact_phone")}>
        <input
          name="contact_phone"
          required
          inputMode="tel"
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <Field label={t("requests.needed_by")}>
        <input
          name="needed_by"
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <Field label={t("requests.details")}>
        <textarea
          name="details"
          maxLength={500}
          rows={2}
          placeholder={t("requests.details_placeholder")}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <p className="text-xs text-neutral-400">{t("requests.sms_alert_notice")}</p>

      {error === "limit_reached" && (
        <p className="text-sm text-red-600">{t("requests.limit_reached")}</p>
      )}
      {error && error !== "limit_reached" && (
        <p className="text-sm text-red-600">{t("auth.error_generic")}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="tap-target flex-1 rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? t("requests.submitting") : t("requests.submit")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="tap-target rounded-lg border border-neutral-300 px-4 py-2.5 font-medium text-neutral-600"
        >
          {t("dashboard.cancel")}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}
