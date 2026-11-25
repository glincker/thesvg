"use client";

import { useT } from "@/i18n/use-t";
import type { DeepLinkTarget } from "@/lib/svg-utils";

// App names stay as brand names; only the verb around them is translated.
const APP_ACTIONS: Record<string, { key: string; app: string }> = {
  figma: { key: "icon.openIn.copyFor", app: "Figma" },
  sketch: { key: "icon.openIn.copyFor", app: "Sketch" },
  illustrator: { key: "icon.openIn.downloadFor", app: "Illustrator" },
};

/** Translated label and hint for an open-in target, falling back to the library's English. */
export function useDeepLinkText() {
  const { t } = useT();
  return {
    label: (target: DeepLinkTarget): string => {
      const action = APP_ACTIONS[target.id];
      return action ? t(action.key, { app: action.app }) : target.label;
    },
    hint: (target: DeepLinkTarget): string =>
      t(`icon.openIn.hint.${target.id}`, { defaultValue: target.hint }),
    opened: t("icon.openIn.opened"),
    couldNot: t("icon.openIn.couldNot"),
  };
}
