import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompactHeroState {
  dismissed: boolean;
  dismiss: () => void;
}

/**
 * Tracks whether the user dismissed the md-to-lg compact hero banner
 * (tablet/foldable breakpoint, ~768-1023px). Once dismissed it stays
 * dismissed across sessions until localStorage is cleared - no un-dismiss
 * UI is provided, matching the other one-way dismissal patterns in this
 * codebase (see mobile-prefs-store for the persistence convention).
 */
export const useCompactHeroStore = create<CompactHeroState>()(
  persist(
    (set) => ({
      dismissed: false,
      dismiss: () => set({ dismissed: true }),
    }),
    {
      name: "thesvg-compact-hero",
      version: 1,
      skipHydration: true,
    },
  ),
);
