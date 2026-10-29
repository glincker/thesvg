"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isSidebarToggleShortcut, isTypingTarget } from "@/lib/sidebar-shortcut";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { CollapseToggle } from "./collapse-toggle";
import { SidebarNav } from "./shell";

/** Same fixed frame as the brand sidebar, so switching modes only swaps what is inside it. */
export function UiSidebarShell({ children }: { children: React.ReactNode }) {
  const open = useSidebarStore((s) => s.open);
  const setOpen = useSidebarStore((s) => s.setOpen);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);

  // Cmd/Ctrl+\ folds the sidebar to its icon rail, the same shortcut as the brand sidebar.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSidebarToggleShortcut(e) || isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      toggleCollapsed();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  return (
    <>
      <aside
        className={cn(
          "group/sidebar fixed top-[calc(4.25rem+var(--banner-h,0px))] left-2 z-30 hidden h-[calc(100vh-4.75rem-var(--banner-h,0px))] rounded-2xl border border-black/[0.06] bg-background/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-[width] duration-200 ease-in-out md:block dark:border-white/[0.08] dark:bg-black/60 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]",
          collapsed ? "w-16" : "w-56",
        )}
      >
        <div className="flex h-full flex-col gap-1 overflow-y-auto p-2">
          <SidebarNav rail={collapsed} />
        </div>
        <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 gap-1 overflow-y-auto p-2">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className={cn("transition-[padding] duration-200 ease-in-out", collapsed ? "md:pl-21" : "md:pl-59")}>{children}</div>
    </>
  );
}
