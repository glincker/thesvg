/**
 * Light root entry: the locale helper and types only (a few KB). The metadata for all
 * flags, getFlag and findFlags live behind "@thesvg/flags/search" so importing a
 * component or the locale helper never pulls the search data.
 */
export { getFlagForLocale, LOCALE_FLAGS } from "./locale.js";
export type { FlagKind, FlagLocaleResult, FlagMeta, FlagVariant } from "./types.js";
