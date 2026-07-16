"use client";

import { useState, useTransition } from "react";
import { adminVerifyDonorAction, adminDeleteDonorAction, deleteRequestAction } from "@/lib/actions";

export function AdminVerifyButton({ donorId, label }: { donorId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await adminVerifyDonorAction(donorId);
          setDone(true);
        })
      }
      className="tap-target shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function AdminDeleteDonorButton({
  donorId,
  label,
  confirmLabel,
}: {
  donorId: string;
  label: string;
  confirmLabel: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmLabel)) return;
        startTransition(async () => {
          await adminDeleteDonorAction(donorId);
        });
      }}
      className="tap-target shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function AdminDeleteRequestButton({
  requestId,
  label,
  confirmLabel,
}: {
  requestId: string;
  label: string;
  confirmLabel: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmLabel)) return;
        startTransition(async () => {
          await deleteRequestAction(requestId);
        });
      }}
      className="tap-target shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
    >
      {label}
    </button>
  );
}
