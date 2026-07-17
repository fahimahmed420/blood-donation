import { BloodGroupBadge } from "./blood-group-badge";
import { cloudinaryThumb } from "@/lib/cloudinary-url";

const SIZES = {
  sm: { box: "size-9", px: 72, chip: "text-[8px] px-1" },
  md: { box: "size-12", px: 96, chip: "text-[9px] px-1" },
  lg: { box: "size-16", px: 128, chip: "text-[10px] px-1.5" },
} as const;

export function DonorAvatar({
  photoUrl,
  bloodGroup,
  size = "md",
}: {
  photoUrl: string | null | undefined;
  bloodGroup: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!photoUrl) return <BloodGroupBadge group={bloodGroup} size={size} />;

  const { box, px, chip } = SIZES[size];

  return (
    <span className={`relative inline-flex shrink-0 ${box}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cloudinaryThumb(photoUrl, px)}
        alt=""
        className="size-full rounded-full border border-neutral-200 object-cover"
      />
      <span
        className={`absolute -bottom-1 -right-1 rounded-full bg-brand-600 font-bold text-white ${chip}`}
      >
        {bloodGroup}
      </span>
    </span>
  );
}
