import { BookOpen } from "lucide-react";
import { withUtm } from "@/lib/external-link";
import { getIconLinks } from "@/lib/icon-links";
import type { IconLinks } from "@/lib/icon-links";
import { cn } from "@/lib/utils";

interface IconLinksRowProps {
  links: IconLinks | undefined;
  source: string;
  className?: string;
}

/**
 * Compact row of official destinations (source repo, docs, community,
 * social). Uses thesvg's own brand marks for each destination so the page
 * shows the library working, with a generic glyph for docs.
 */
export function IconLinksRow({ links, source, className }: IconLinksRowProps) {
  const resolved = getIconLinks(links);
  if (resolved.length === 0) return null;

  return (
    <ul
      aria-label="Official links"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {resolved.map((link) => (
        <li key={link.type}>
          <a
            href={withUtm(link.href, source)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {link.iconSlug ? (
              <>
                <img
                  src={`/icons/${link.iconSlug}/${link.type === "github" || link.type === "x" ? "mono" : "default"}.svg`}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 dark:hidden"
                />
                <img
                  src={`/icons/${link.iconSlug}/${link.type === "github" ? "dark" : link.type === "x" ? "mono" : "default"}.svg`}
                  alt=""
                  width={16}
                  height={16}
                  className={cn(
                    "hidden h-4 w-4 dark:block",
                    link.type === "x" && "invert",
                  )}
                />
              </>
            ) : (
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
