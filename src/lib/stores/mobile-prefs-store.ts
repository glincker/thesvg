import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IconOpenMode = "sheet" | "page";

interface MobilePrefsState {
  iconOpenMode: IconOpenMode;
  setIconOpenMode: (mode: IconOpenMode) => void;
}

export const useMobilePrefsStore = create<MobilePrefsState>()(
  persist(
    (set) => ({
      iconOpenMode: "sheet",
      setIconOpenMode: (mode) => set({ iconOpenMode: mode }),
    }),
    {
      name: "thesvg-mobile-prefs",
      version: 1,
    },
  ),
);
