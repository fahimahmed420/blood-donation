"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "loading" | "off" | "on";

export function PushToggle() {
  const t = useTranslations("dashboard");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    if (!VAPID_PUBLIC_KEY) return;
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("on");
    } catch {
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } finally {
      setStatus("off");
    }
  }

  if (status === "unsupported") return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-neutral-700">{t("push_title")}</p>
        <p className="text-xs text-neutral-500">{t("push_desc")}</p>
      </div>
      <button
        disabled={status === "loading"}
        onClick={status === "on" ? disable : enable}
        className={`tap-target shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${
          status === "on"
            ? "border border-neutral-300 text-neutral-600"
            : "bg-brand-600 text-white"
        }`}
      >
        {status === "on" ? t("push_disable") : t("push_enable")}
      </button>
    </div>
  );
}
