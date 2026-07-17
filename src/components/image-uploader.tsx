"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { UploadKind } from "@/lib/cloudinary";

const MAX_FILE_MB = 10;
const UPLOAD_TIMEOUT_MS = 60000; // 60 second timeout before warning

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
  const [status, setStatus] = useState<"idle" | "uploading" | "slow" | "error">("idle");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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

    // Set timeout warning after 8 seconds
    timeoutRef.current = setTimeout(() => {
      setStatus("slow");
    }, 8000);

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

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus("idle");
      onUploaded(uploaded.secure_url as string);
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus("error");
    }
  }

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-16 shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100 ${shapeClass}`}
      >
        {status === "uploading" || status === "slow" ? (
          <LoadingSpinner className="size-6 text-neutral-400" />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <CameraIcon className="size-6 text-neutral-400" />
        )}
      </div>

      <div>
        <button
          type="button"
          disabled={status === "uploading" || status === "slow"}
          onClick={() => inputRef.current?.click()}
          className="tap-target rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 disabled:opacity-60"
        >
          {status === "uploading" && "⏳ Uploading..."}
          {status === "slow" && "⏳ Still uploading (may take a moment)..."}
          {status === "idle" && t("choose_photo")}
          {status === "error" && t("choose_photo")}
        </button>
        {status === "error" && <p className="mt-1 text-xs text-red-600">{t("error")}</p>}
        {status === "slow" && (
          <p className="mt-1 text-xs text-amber-600">
            Your connection is slow. Please keep this page open until upload completes.
          </p>
        )}
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

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" opacity="0.1" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
