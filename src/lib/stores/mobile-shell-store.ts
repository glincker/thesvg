import { create } from "zustand";

/**
 * UI state for the Catalog 2026 mobile shell. Kept separate from any
 * persisted store: this is ephemeral, in-memory, no localStorage.
 *
 * `activeTab` reflects the dock selection but does not strictly mirror
 * the route — e.g. tapping Submit navigates to `/submit` and the tab
 * stays highlighted until the user moves away. The tab derivation
 * happens inside `<MobileBottomDock>` from `usePathname()`; we only
 * track which sheet is open here.
 */

export type MobileSheet =
  | "none"
  | "search"
  | "icon"
  | "more"
  | "action";

interface MobileShellState {
  sheet: MobileSheet;
  /**
   * Slug for the currently open icon sheet. Mirrors the URL when the
   * sheet was launched in-place (no full-page nav), so a back swipe
   * returns to the underlying grid without losing scroll position.
   */
  iconSlug: string | null;
  /**
   * Slug for the long-press action sheet target.
   */
  actionSlug: string | null;
  /**
   * Snap point for the active search sheet. Driven by drag handle.
   */
  searchSnap: "peek" | "half" | "full";

  openSearch: (snap?: MobileShellState["searchSnap"]) => void;
  openIcon: (slug: string) => void;
  openMore: () => void;
  openAction: (slug: string) => void;
  setSearchSnap: (snap: MobileShellState["searchSnap"]) => void;
  closeSheet: () => void;
}

export const useMobileShellStore = create<MobileShellState>((set) => ({
  sheet: "none",
  iconSlug: null,
  actionSlug: null,
  searchSnap: "peek",
  openSearch: (snap = "peek") => set({ sheet: "search", searchSnap: snap }),
  openIcon: (slug) => set({ sheet: "icon", iconSlug: slug }),
  openMore: () => set({ sheet: "more" }),
  openAction: (slug) => set({ sheet: "action", actionSlug: slug }),
  setSearchSnap: (snap) => set({ searchSnap: snap }),
  closeSheet: () => set({ sheet: "none", actionSlug: null }),
}));
