"use client";

import { getIconBySlug, getIconsByCategory, getCategoryCounts } from "@/lib/icons";
import { IconDetailPage } from "@/components/icons/icon-detail-page";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export function IconPageClient({ slug }: { slug: string }) {
  const icon = getIconBySlug(slug);
  if (!icon) return null;

  const categoryCounts = getCategoryCounts();

  const primaryCategory = icon.categories[0] ?? null;
  const relatedIcons = primaryCategory
    ? getIconsByCategory(primaryCategory)
        .filter((rel) => rel.slug !== icon.slug)
        .slice(0, 8)
    : [];

  const yearMatch = /^(.+)-(\d{4})$/.exec(icon.slug);
  let versionCounterpartSlug: string | null = null;
  let versionCounterpartYear: string | null = null;
  let versionCounterpartIsNewer = false;
  if (yearMatch) {
    const originalSlug = yearMatch[1];
    if (getIconBySlug(originalSlug)) {
      versionCounterpartSlug = originalSlug;
      versionCounterpartYear = yearMatch[2];
      versionCounterpartIsNewer = false;
    }
  } else {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 1; y--) {
      const candidate = `${icon.slug}-${y}`;
      if (getIconBySlug(candidate)) {
        versionCounterpartSlug = candidate;
        versionCounterpartYear = String(y);
        versionCounterpartIsNewer = true;
        break;
      }
    }
  }

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
