"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { markDonatedAction } from "@/lib/actions";

export function MarkDonatedButton() {
  const t = useTranslations("dashboard");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) return null;

  if (confirming) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">{t("mark_donated_confirm")}</p>
        <div className="mt-3 flex gap-2">
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markDonatedAction();
                setDone(true);
              })
            }
            className="tap-target rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("confirm")}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="tap-target rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="tap-target flex w-full items-center justify-center rounded-xl border-2 border-brand-600 bg-white px-5 py-3 font-semibold text-brand-600 hover:bg-brand-50"
    >
      {t("mark_donated")}
    </button>
  );
}
