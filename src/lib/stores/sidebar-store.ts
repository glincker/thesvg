import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** Mobile nav sheet open/closed. Ephemeral, never persisted. */
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  /**
   * Desktop/tablet rail-collapsed state: true shows the icon-only
   * navigation rail, false shows the full labeled sidebar. Persisted so a
   * manual choice survives reloads.
   */
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      open: false,
      toggle: () => set((s) => ({ open: !s.open })),
      setOpen: (open) => set({ open }),
      collapsed: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    {
      name: "thesvg-sidebar",
      // See src/components/store-hydration.tsx: skip the automatic
      // hydration-on-create so the first client render matches the
      // server-rendered (default) state, then rehydrate one tick later.
      skipHydration: true,
      // `open` is a transient mobile-sheet flag, not a preference; only
      // persist the rail-collapsed choice.
      partialize: (s) => ({ collapsed: s.collapsed }),
    },
  ),
);
