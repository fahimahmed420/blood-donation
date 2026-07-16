"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { BloodGroupBadge } from "./blood-group-badge";
import { formatDate, whatsappLink } from "@/lib/utils";
import { markRequestFulfilledAction } from "@/lib/actions";
import type { BloodRequest } from "@/lib/types";

export function RequestCard({
  request,
  locale,
  isOwner,
}: {
  request: BloodRequest;
  locale: string;
  isOwner: boolean;
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();

  const statusStyles: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    fulfilled: "bg-emerald-100 text-emerald-700",
    expired: "bg-neutral-200 text-neutral-500",
  };

  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <BloodGroupBadge group={request.blood_group} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-neutral-800">{request.patient_name}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[request.status]}`}>
              {t(`requests.status_${request.status}` as "requests.status_open")}
            </span>
            {isOwner && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                {t("requests.posted_by_you")}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600">{request.hospital}</p>
          <p className="text-sm text-neutral-500">
            {t("requests.needed_by_label", { date: formatDate(request.needed_by, locale) })}
          </p>
          {request.details && <p className="mt-1 text-sm text-neutral-500">{request.details}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {request.status === "open" && (
          <>
            <a
              href={`tel:${request.contact_phone}`}
              className="tap-target flex items-center rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              {t("search.call")}
            </a>
            <a
              href={whatsappLink(request.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              {t("search.whatsapp")}
            </a>
          </>
        )}
        {isOwner && request.status === "open" && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markRequestFulfilledAction(request.id);
              })
            }
            className="tap-target flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 disabled:opacity-60"
          >
            {t("requests.mark_fulfilled")}
          </button>
        )}
      </div>
    </li>
  );
}
