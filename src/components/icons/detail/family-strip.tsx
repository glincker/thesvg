import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { IconEntry } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface FamilyStripProps {
  familySlug: string;
  familyTitle: string;
  /** Other members of the family, excluding the icon being viewed. */
  members: IconEntry[];
  total: number;
  /** Larger treatment used when it takes the place of the variant picker. */
  prominent?: boolean;
  className?: string;
}

const SHOWN = 6;

/**
 * "More from <family>": a short row of sibling icons with a link to the
 * full family page. Sits where the variant picker would be when an icon has
 * a single variant, and below the exports otherwise.
 */
export function FamilyStrip({
  familySlug,
  familyTitle,
  members,
  total,
  prominent = false,
  className,
}: FamilyStripProps) {
  if (members.length === 0) return null;
  const shown = members.slice(0, SHOWN);

  return (
    <section
      aria-label={`More from ${familyTitle}`}
      className={cn(
        "rounded-xl border border-border bg-card p-3 shadow-sm",
        prominent && "p-4",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          More from {familyTitle}
        </p>
        <Link
          href={`/family/${familySlug}`}
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all {total}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {shown.map((icon) => (
          <li key={icon.slug}>
            <Link
              href={`/icon/${icon.slug}`}
              prefetch={false}
              className="group flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-colors hover:bg-accent"
            >
              <span className="icon-preview-bg flex h-11 w-11 items-center justify-center rounded-lg p-1.5">
                <img
                  src={icon.variants.default}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="line-clamp-1 w-full text-center text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {icon.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
