"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createTestimonialAction } from "@/lib/actions";
import { ImageUploader } from "./image-uploader";

export function TestimonialForm() {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitted" | "error">("idle");

  function handleSubmit(formData: FormData) {
    if (photoUrl) formData.set("photo_url", photoUrl);
    setStatus("idle");
    startTransition(async () => {
      const res = await createTestimonialAction(formData);
      if (res?.error) {
        setStatus("error");
      } else {
        setStatus("submitted");
        setPhotoUrl(null);
      }
    });
  }

  if (status === "submitted") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-700">
        {t("testimonials.submitted_notice")}
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-600">
          {t("testimonials.message_label")}
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          placeholder={t("testimonials.message_placeholder")}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium text-neutral-600">
          {t("testimonials.photo_label")}
        </span>
        <ImageUploader kind="testimonial" shape="square" onUploaded={setPhotoUrl} />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{t("testimonials.submit_error")}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tap-target rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {t("testimonials.submit")}
      </button>
      <p className="text-xs text-neutral-400">{t("testimonials.moderation_notice")}</p>
    </form>
  );
}
