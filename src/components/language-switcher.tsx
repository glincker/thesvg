"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/i18n/config";
import { LOCALES, matchLocale, type LocaleCode } from "@/i18n/locales";
import { useT } from "@/i18n/use-t";

function Flag({ slug, className }: Readonly<{ slug: string; className: string }>) {
  return <img src={`/icons/${slug}/default.svg`} alt="" width={24} height={18} className={className} />;
}

/** Language picker: a two-column grid of flag cards, using the library's own country flags. */
export function LanguageSwitcher() {
  const { t, locale } = useT();
  const current = LOCALES.find((l) => l.code === (matchLocale(locale) ?? "en")) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-8 sm:w-8"
            aria-label={`${t("language.label")}: ${current.label}`}
            title={current.label}
          />
        }
      >
        <Flag slug={current.flag} className="h-4 w-5 rounded-[3px] object-cover" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-[24rem] max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 shadow-xl">
        <h3 className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground/80 uppercase">
          {t("language.label")}
        </h3>
        <DropdownMenuRadioGroup
          aria-label={t("language.label")}
          className="grid grid-cols-2 gap-1"
          value={current.code}
          onValueChange={(v) => void setLocale(v as LocaleCode)}
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem
              key={l.code}
              value={l.code}
              showIndicator={false}
              className="relative flex cursor-pointer items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:border-orange-500/50 data-checked:bg-orange-500/10 data-checked:text-foreground"
            >
              <Flag slug={l.flag} className="h-[18px] w-6 shrink-0 rounded-[4px] object-cover shadow-sm ring-1 ring-foreground/10" />
              <span className="truncate">{l.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
