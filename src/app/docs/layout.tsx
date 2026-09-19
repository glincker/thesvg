import { getCategoryCounts } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const categoryCounts = getCategoryCounts();

  return (
    <SidebarShell categoryCounts={categoryCounts}>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <DocsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarShell>
  );
}
