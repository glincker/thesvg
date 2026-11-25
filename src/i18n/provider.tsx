"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { DEFAULT_LOCALE } from "./locales";
import { detectLocale, i18n, setLocale } from "./config";

export function I18nProvider({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    const code = detectLocale();
    if (code !== DEFAULT_LOCALE) void setLocale(code);
  }, []);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
