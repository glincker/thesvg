"use client";

import type { IconEntry } from "@/lib/icons";
import type { IconFamilyInfo } from "@/components/icons/icon-detail-page";
import { IconDetailPage } from "@/components/icons/icon-detail-page";
import { SidebarShell } from "@/components/layout/sidebar-shell";

interface IconPageClientProps {
  icon: IconEntry;
  categoryCounts: { name: string; count: number }[];
  relatedIcons: IconEntry[];
  family: IconFamilyInfo | null;
  versionCounterpartSlug: string | null;
  versionCounterpartYear: string | null;
  versionCounterpartIsNewer: boolean;
  lineageIcon: IconEntry | null;
  badgeCounterpart: IconEntry | null;
}

/**
 * All data (icon, related icons, category counts, lineage/badge
 * counterparts) is resolved server-side in page.tsx and passed in as
 * props here, so this component (and everything it renders) never needs
 * to re-import the full icons dataset on the client.
 */
export function IconPageClient({
  icon,
  categoryCounts,
  relatedIcons,
  family,
  versionCounterpartSlug,
  versionCounterpartYear,
  versionCounterpartIsNewer,
  lineageIcon,
  badgeCounterpart,
}: IconPageClientProps) {
  return (
    <SidebarShell categoryCounts={categoryCounts}>
      <IconDetailPage
        icon={icon}
        relatedIcons={relatedIcons}
        family={family}
        versionCounterpartSlug={versionCounterpartSlug}
        versionCounterpartYear={versionCounterpartYear}
        versionCounterpartIsNewer={versionCounterpartIsNewer}
        lineageIcon={lineageIcon}
        badgeCounterpart={badgeCounterpart}
      />
    </SidebarShell>
  );
}
