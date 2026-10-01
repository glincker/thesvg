import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SectionOrder = "auto" | "popular-first" | "recent-first";

interface HomePrefsState {
  /** "auto" defers to isReturningVisitor; the other two are an explicit
   * user override that sticks once set. */
  sectionOrder: SectionOrder;
  setSectionOrder: (order: SectionOrder) => void;
  /** Collapsed state for the "Continue - where you left off" rail, kept
   * separate from clearing the underlying viewed-icons list so hiding the
   * section never loses data. */
  continueCollapsed: boolean;
  toggleContinueCollapsed: () => void;
}

export const useHomePrefsStore = create<HomePrefsState>()(
  persist(
    (set) => ({
      sectionOrder: "auto",
      setSectionOrder: (order) => set({ sectionOrder: order }),
      continueCollapsed: false,
      toggleContinueCollapsed: () =>
        set((s) => ({ continueCollapsed: !s.continueCollapsed })),
    }),
    { name: "thesvg-home-prefs" }
  )
);
