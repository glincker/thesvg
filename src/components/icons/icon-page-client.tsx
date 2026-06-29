"use client";

import { useMemo } from "react";
import { getAllIcons, getIconBySlug, getIconsByCategory, getCategoryCounts } from "@/lib/icons";
import { IconDetailPage } from "@/components/icons/icon-detail-page";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export function IconPageClient({ slug }: { slug: string }) {
  const icon = useMemo(() => getIconBySlug(slug), [slug]);
  if (!icon) return null;

  const categoryCounts = useMemo(() => getCategoryCounts(), []);

  const relatedIcons = useMemo(() => {
    const primaryCategory = icon.categories[0] ?? null;
    return primaryCategory
      ? getIconsByCategory(primaryCategory)
          .filter((rel) => rel.slug !== icon.slug)
          .slice(0, 8)
      : [];
  }, [icon]);

  const { versionCounterpartSlug, versionCounterpartYear, versionCounterpartIsNewer } =
    useMemo(() => {
      const yearMatch = /^(.+)-(\d{4})$/.exec(icon.slug);
      if (yearMatch) {
        const originalSlug = yearMatch[1];
        if (getIconBySlug(originalSlug)) {
          return {
            versionCounterpartSlug: originalSlug,
            versionCounterpartYear: yearMatch[2],
            versionCounterpartIsNewer: false,
          };
        }
      } else {
        // Scan the full icon list for any slug-YYYY counterpart rather than
        // assuming a fixed year window, so newly-bundled refresh icons are
        // always picked up regardless of the build year.
        const allSlugs = new Set(getAllIcons().map((i) => i.slug));
        const prefix = `${icon.slug}-`;
        let latest: { slug: string; year: number } | null = null;
        for (const s of allSlugs) {
          if (!s.startsWith(prefix)) continue;
          const yearStr = s.slice(prefix.length);
          if (!/^\d{4}$/.test(yearStr)) continue;
          const year = parseInt(yearStr, 10);
          if (!latest || year > latest.year) latest = { slug: s, year };
        }
        if (latest) {
          return {
            versionCounterpartSlug: latest.slug,
            versionCounterpartYear: String(latest.year),
            versionCounterpartIsNewer: true,
          };
        }
      }
      return {
        versionCounterpartSlug: null,
        versionCounterpartYear: null,
        versionCounterpartIsNewer: false,
      };
    }, [icon.slug]);

  return (
    <SidebarShell categoryCounts={categoryCounts}>
      <IconDetailPage
        icon={icon}
        relatedIcons={relatedIcons}
        versionCounterpartSlug={versionCounterpartSlug}
        versionCounterpartYear={versionCounterpartYear}
        versionCounterpartIsNewer={versionCounterpartIsNewer}
      />
    </SidebarShell>
  );
}
