"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/i18n/config";
import { LOCALES, matchLocale, type LocaleCode } from "@/i18n/locales";

function Flag({ slug }: Readonly<{ slug: string }>) {
  return <img src={`/icons/${slug}/default.svg`} alt="" width={20} height={15} className="h-4 w-5 rounded-[3px] object-cover" />;
}

/** Language picker that uses the library's own country flags. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = LOCALES.find((l) => l.code === (matchLocale(i18n.language) ?? "en")) ?? LOCALES[0];

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
        <Flag slug={current.flag} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current.code} onValueChange={(v) => void setLocale(v as LocaleCode)}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} className="gap-2">
              <Flag slug={l.flag} />
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
