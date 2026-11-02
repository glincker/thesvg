import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CopyFormat } from "@/lib/copy-formats";
import { SETTINGS_STORAGE_KEY, type InterfaceSize } from "@/lib/interface-size";

/** How the icon preview tiles are painted. "auto" adapts to each icon's colour. */
export type PreviewBackground = "auto" | "light" | "dark" | "checker";

interface SettingsState {
  defaultCopyFormat: CopyFormat;
  setDefaultCopyFormat: (format: CopyFormat) => void;
  previewBackground: PreviewBackground;
  setPreviewBackground: (value: PreviewBackground) => void;
  /** Opt-in larger interface, see src/lib/interface-size.ts. */
  interfaceSize: InterfaceSize;
  setInterfaceSize: (value: InterfaceSize) => void;
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
      interfaceSize: "default",
      setInterfaceSize: (value) => set({ interfaceSize: value }),
    }),
    { name: SETTINGS_STORAGE_KEY, skipHydration: true }
  )
);
