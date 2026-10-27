import type { Metadata } from "next";
import { BgGlow } from "@/components/ui-icons/bg-glow";
import { UiSidebarShell } from "@/components/ui-icons/ui-sidebar-shell";
import { UiStateProvider } from "@/components/ui-icons/ui-state";

export const metadata: Metadata = {
  title: { default: "UI Icons", template: "%s | theSVG" },
  description: "Own-drawn UI icons in seven looks, themeable with currentColor. Copy, download or install as a package.",
};

export default function UiLayout({ children }: { children: React.ReactNode }) {
  return (
    <UiStateProvider>
      <BgGlow />
      <UiSidebarShell>
        <div className="mx-auto max-w-7xl px-3 pb-12 pt-4 sm:px-4">{children}</div>
      </UiSidebarShell>
    </UiStateProvider>
  );
}
