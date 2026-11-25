"use client";

import { useT } from "@/i18n/use-t";
import { setLocale } from "@/i18n/config";
import { LOCALES, matchLocale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

/** Footer language row: our own flags plus native names, so the choice is easy to find. */
export function FooterLanguages() {
  const { t, locale } = useT();
  const active = matchLocale(locale) ?? "en";

  return (
    <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/40 pt-6 dark:border-white/[0.06]">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">{t("language.label")}</p>
      <ul className="flex flex-wrap justify-center gap-x-1 gap-y-1.5">
        {LOCALES.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              onClick={() => void setLocale(l.code)}
              aria-pressed={l.code === active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                l.code === active && "bg-muted font-medium text-foreground",
              )}
            >
              <img src={`/icons/${l.flag}/default.svg`} alt="" width={16} height={12} className="h-3 w-4 rounded-[2px] object-cover" />
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
