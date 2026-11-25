"use client";

import { useT } from "@/i18n/use-t";

/** Translated text for server components, which cannot call useTranslation. */
export function T({ k, fallback, values }: Readonly<{ k: string; fallback?: string; values?: Record<string, string> }>) {
  const { t } = useT();
  return <>{t(k, { defaultValue: fallback, ...values })}</>;
}
