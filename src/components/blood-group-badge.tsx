export function BloodGroupBadge({ group, size = "md" }: { group: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "size-9 text-sm",
    md: "size-12 text-base",
    lg: "size-16 text-xl",
  } as const;

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white ${sizes[size]}`}
    >
      {group}
    </span>
  );
}
