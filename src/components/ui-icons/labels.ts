"use client";

import { useT } from "@/i18n/use-t";
import type { Variant } from "@/lib/ui-icons/engine";
import { COPY_LABEL, type CopyTarget } from "@/lib/ui-icons/copy-target";

const LOOK_KEY: Record<Variant, string> = {
  outline: "outline", duotone: "duotone", offset: "offset", fill: "fill", glass: "glass", "glass-outline": "glassOutline", depth: "depth",
};
const HINT_KEY: Record<CopyTarget, string> = { svg: "svg", name: "name", cli: "cli", react: "import", vue: "import", svelte: "import", url: "url" };
const PACKAGE: Partial<Record<CopyTarget, string>> = { react: "@thesvg/ui-react", vue: "@thesvg/ui-vue", svelte: "@thesvg/ui-svelte" };

/** Translated names for looks and copy targets. Brand and format names (SVG, React, CLI) stay as they are. */
export function useLabels() {
  const { t, locale } = useT();
  return {
    t,
    locale,
    look: (v: Variant): string => t(`uikit.look.${LOOK_KEY[v]}`),
    copyLabel: (c: CopyTarget): string => (c === "name" ? t("uikit.copy.name") : COPY_LABEL[c]),
    copyHint: (c: CopyTarget): string => t(`uikit.copyHint.${HINT_KEY[c]}`, { pkg: PACKAGE[c] ?? "" }),
  };
}
