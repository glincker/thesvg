import { cn } from "@/lib/utils";

interface NewBadgeProps {
  slug: string;
  className?: string;
}

/**
 * Renders a small "2026" pill on icons that are part of the year-tagged
 * brand refresh series (slug ends with `-2026`). Future year-suffixed sets
 * (e.g. `-2027`) will be picked up automatically.
 */
export function NewBadge({ slug, className }: NewBadgeProps) {
  const match = /-(\d{4})$/.exec(slug);
  if (!match) return null;
  const year = match[1];
  return (
    <span
      className={cn(
        "pointer-events-none rounded-full bg-gradient-to-r from-fuchsia-500/90 via-orange-500/90 to-amber-400/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase leading-none tracking-wider text-white shadow-sm shadow-black/20",
        className,
      )}
      aria-label={`${year} refresh`}
    >
      {year}
    </span>
  );
}
