"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createProfileAction } from "@/lib/actions";
import { BLOOD_GROUPS, AREAS } from "@/lib/constants";

type Step = "form" | "otp" | "done";

export function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpSkipped, setOtpSkipped] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createProfileAction(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const sendRes = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }).then((r) => r.json());

    if (sendRes.sent) {
      setStep("otp");
    } else {
      setOtpSkipped(true);
      setStep("done");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: otp }),
    }).then((r) => r.json());

    if (res.verified) {
      setStep("done");
    } else {
      setOtpError(res.reason ?? "wrong_code");
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-semibold text-emerald-800">{t("register.success")}</p>
        {otpSkipped && (
          <p className="mt-2 text-sm text-emerald-700">{t("register.otp_skip_notice")}</p>
        )}
        <button
          onClick={() => router.push("/dashboard")}
          className="tap-target mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white"
        >
          {t("nav.dashboard")}
        </button>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div>
          <p className="font-semibold text-neutral-800">{t("register.otp_title")}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {t("register.otp_subtitle", { phone })}
          </p>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder={t("register.otp_placeholder")}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2 text-center text-lg tracking-widest"
        />
        {otpError && <p className="text-sm text-red-600">{t("auth.error_generic")}</p>}
        <button
          type="submit"
          className="tap-target w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          {t("register.otp_verify")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <Field label={t("register.full_name")}>
        <input
          name="full_name"
          required
          minLength={2}
          maxLength={80}
          placeholder={t("register.full_name_placeholder")}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <Field label={t("register.phone")} hint={t("register.phone_hint")}>
        <input
          name="phone"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("register.phone_placeholder")}
          inputMode="tel"
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <Field label={t("register.blood_group")}>
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
              {g} — {t(`blood_groups.${g}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("register.area")}>
        <select
          name="area"
          required
          defaultValue=""
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="" disabled>
            —
          </option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {t(`areas.${a}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("register.last_donation")} hint={t("register.last_donation_hint")}>
        <input
          name="last_donation_date"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input name="available" type="checkbox" defaultChecked className="size-5" />
        {t("register.available")}
      </label>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input name="sms_opt_in" type="checkbox" defaultChecked className="size-5" />
        {t("register.sms_consent")}
      </label>

      {error && <p className="text-sm text-red-600">{t("auth.error_generic")}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="tap-target w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? t("register.submitting") : t("register.submit")}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-600">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
