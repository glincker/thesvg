import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CopyFormat } from "@/lib/copy-formats";

/** How the icon preview tiles are painted. "auto" adapts to each icon's colour. */
export type PreviewBackground = "auto" | "light" | "dark" | "checker";

interface SettingsState {
  defaultCopyFormat: CopyFormat;
  setDefaultCopyFormat: (format: CopyFormat) => void;
  previewBackground: PreviewBackground;
  setPreviewBackground: (value: PreviewBackground) => void;
}

// skipHydration + StoreHydration keeps the first client render identical to
// the prerendered HTML, so a saved preference never causes a hydration mismatch.
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultCopyFormat: "svg",
      setDefaultCopyFormat: (format) => set({ defaultCopyFormat: format }),
      previewBackground: "auto",
      setPreviewBackground: (value) => set({ previewBackground: value }),
    }),
    { name: "thesvg-settings", skipHydration: true }
  )
);
