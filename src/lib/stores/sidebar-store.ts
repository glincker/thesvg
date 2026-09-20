import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** Mobile nav sheet open/closed. Ephemeral, never persisted. */
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  /** Desktop/tablet icon-only rail mode. Persisted. */
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
      skipHydration: true,
      partialize: (s) => ({ collapsed: s.collapsed }),
    },
  ),
);
