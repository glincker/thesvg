"use client";

import { LOCALE_FLAGS, getFlagForLocale } from "../../../packages/flags/src/locale";
import type { FlagVariantKey } from "@/lib/flags-browser/model";
import { flagSrc } from "./flag-tile";

/** Native language name for a locale, in that locale. Falls back to the tag when Intl lacks it. */
export function nativeLanguageName(locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
  } catch {
    return locale;
  }
}

const TAGS = Object.keys(LOCALE_FLAGS).map((k) => k.replace(/^([a-z]+)-([a-z]+)$/, (_, l: string, r: string) => `${l}-${r.toUpperCase()}`));

/** Teaches the rule in the UI: the flag is decoration beside a native language name, never the only label. */
export function LanguagesMode({ variant }: Readonly<{ variant: FlagVariantKey }>) {
  return (
    <section aria-label="Flags for languages">
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        A flag stands for a country, not a language. Show the native language name next to it, keep the flag decorative, and never rely on it alone to pick a language.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="language-list">
        {TAGS.map((tag) => {
          const hit = getFlagForLocale(tag);
          if (!hit) return null;
          return (
            <li key={tag} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
              <img src={flagSrc(hit.slug, variant)} alt="" width={variant === "4x3" ? 32 : 24} height={24} loading="lazy" decoding="async" className="object-contain" />
              <span className="min-w-0">
                <span className="block text-sm font-medium" lang={tag}>{nativeLanguageName(tag)}</span>
                <span className="block text-xs text-muted-foreground">{tag}, flag of {hit.name}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
