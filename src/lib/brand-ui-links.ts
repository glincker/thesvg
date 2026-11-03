import links from "@/data/brand-ui-links.json";

const UI_TO_BRAND = links as Record<string, string>;
// ⚡ Bolt: Use a single-pass loop instead of `new Map(Object.entries().map(...))` to prevent
// intermediate tuple array allocations and reduce garbage collection pressure.
const BRAND_TO_UI = new Map<string, string>();
for (const ui in UI_TO_BRAND) {
  BRAND_TO_UI.set(UI_TO_BRAND[ui], ui);
}

/** The brand icon a network mark stands for, if there is one. */
export const brandForUiMark = (uiSlug: string): string | undefined => UI_TO_BRAND[uiSlug];
/** The UI mark drawn for a brand icon, if there is one. */
export const uiMarkForBrand = (brandSlug: string): string | undefined => BRAND_TO_UI.get(brandSlug);
