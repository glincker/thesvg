"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { SidebarNav } from "./shell";

/** Same fixed frame as the brand sidebar, so switching modes only swaps what is inside it. */
export function UiSidebarShell({ children }: { children: React.ReactNode }) {
  const open = useSidebarStore((s) => s.open);
  const setOpen = useSidebarStore((s) => s.setOpen);
  const nav = <SidebarNav onNavigate={() => setOpen(false)} />;
  return (
    <>
      <aside className="fixed top-[calc(4.25rem+var(--banner-h,0px))] left-2 z-30 hidden h-[calc(100vh-4.75rem-var(--banner-h,0px))] w-56 flex-col gap-1 overflow-y-auto rounded-2xl border border-black/[0.06] bg-background/90 p-2 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] backdrop-blur-2xl md:flex dark:border-white/[0.08] dark:bg-black/60 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        {nav}
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 gap-1 overflow-y-auto p-2">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {nav}
        </SheetContent>
      </Sheet>
      <div className="md:pl-59">{children}</div>
    </>
  );
}
