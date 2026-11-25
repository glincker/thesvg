"use client";

import { useTranslation } from "react-i18next";

/** Translated text for server components, which cannot call useTranslation. */
export function T({ k, fallback, values }: Readonly<{ k: string; fallback?: string; values?: Record<string, string> }>) {
  const { t } = useTranslation();
  return <>{t(k, { defaultValue: fallback, ...values })}</>;
}
