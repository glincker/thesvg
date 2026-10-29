import links from "@/data/brand-ui-links.json";

const UI_TO_BRAND = links as Record<string, string>;
const BRAND_TO_UI = new Map(Object.entries(UI_TO_BRAND).map(([ui, brand]) => [brand, ui]));

/** The brand icon a network mark stands for, if there is one. */
export const brandForUiMark = (uiSlug: string): string | undefined => UI_TO_BRAND[uiSlug];
/** The UI mark drawn for a brand icon, if there is one. */
export const uiMarkForBrand = (brandSlug: string): string | undefined => BRAND_TO_UI.get(brandSlug);
