import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CopyFormat } from "@/lib/copy-formats";

interface SettingsState {
  defaultCopyFormat: CopyFormat;
  setDefaultCopyFormat: (format: CopyFormat) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultCopyFormat: "svg",
      setDefaultCopyFormat: (format) => set({ defaultCopyFormat: format }),
    }),
    { name: "thesvg-settings" }
  )
);
