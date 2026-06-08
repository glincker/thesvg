import type { Metadata } from "next";
import { getAllIcons, getCategoryCounts, getCollections } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { RecentsPage } from "@/components/recents/recents-page";

export const metadata: Metadata = {
  title: "Your recent activity",
  description:
    "Pick up where you left off — your recently viewed and copied SVG brand icons, stored locally in your browser.",
  // Personalized localStorage content has no public value; keep it out of
  // search indexes to avoid weird snippets of users' history surfacing.
  robots: { index: false, follow: true },
  alternates: { canonical: "https://thesvg.org/recents" },
};

export default function Page() {
  const categoryCounts = getCategoryCounts();
  const collections = getCollections();
  const icons = getAllIcons();

  return (
    <SidebarShell categoryCounts={categoryCounts} collections={collections}>
      <RecentsPage allIcons={icons} />
    </SidebarShell>
  );
}
