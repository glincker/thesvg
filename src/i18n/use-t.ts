"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TOptions } from "i18next";
import { i18n } from "./config";
import { DEFAULT_LOCALE } from "./locales";

const subscribe = (cb: () => void): (() => void) => {
  i18n.on("languageChanged", cb);
  return () => i18n.off("languageChanged", cb);
};

/**
 * Translation hook that is safe to hydrate: the server snapshot is always English, so
 * components render English first and switch after hydration instead of mismatching.
 */
export function useT() {
  const locale = useSyncExternalStore(subscribe, () => i18n.language || DEFAULT_LOCALE, () => DEFAULT_LOCALE);
  const t = useCallback((key: string, options?: TOptions): string => i18n.t(key, { ...options, lng: locale }) as string, [locale]);
  return { t, locale };
}
