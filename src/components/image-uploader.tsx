"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { UploadKind } from "@/lib/cloudinary";

const MAX_FILE_MB = 10;

export function ImageUploader({
  kind,
  onUploaded,
  currentUrl,
  shape = "circle",
}: {
  kind: UploadKind;
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
  shape?: "circle" | "square";
}) {
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setPreview(URL.createObjectURL(file));

    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!signRes.ok) throw new Error("sign_failed");
      const sign = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);
      form.append("transformation", sign.transformation);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("upload_failed");
      const uploaded = await uploadRes.json();

      setStatus("idle");
      onUploaded(uploaded.secure_url as string);
    } catch {
      setStatus("error");
    }
  }

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-16 shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100 ${shapeClass}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <CameraIcon className="size-6 text-neutral-400" />
        )}
      </div>

      <div>
        <button
          type="button"
          disabled={status === "uploading"}
          onClick={() => inputRef.current?.click()}
          className="tap-target rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 disabled:opacity-60"
        >
          {status === "uploading" ? t("uploading") : t("choose_photo")}
        </button>
        {status === "error" && <p className="mt-1 text-xs text-red-600">{t("error")}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5h1.379a1.5 1.5 0 0 0 1.06-.44l.622-.62A1.5 1.5 0 0 1 8.62 4.5h6.76a1.5 1.5 0 0 1 1.06.44l.622.62a1.5 1.5 0 0 0 1.06.44H19.5A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9Z"
      />
      <circle cx="12" cy="12" r="3.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
