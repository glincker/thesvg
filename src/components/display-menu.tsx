"use client";

import type { ComponentType, ReactNode } from "react";
import { Binary, Braces, Component, FileCode, Link2, SlidersHorizontal } from "@/components/own-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FORMAT_BUTTONS, FORMAT_LABELS } from "@/components/icons/shared/icon-constants";
import { INTERFACE_SIZES, parseInterfaceSize } from "@/lib/interface-size";
import { useT } from "@/i18n/use-t";
import { useSettingsStore, type PreviewBackground } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";

const COPY_FORMAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  svg: FileCode,
  jsx: Braces,
  vue: Component,
  cdn: Link2,
  "data-uri": Binary,
};

// Labels live in the locale files under chrome.display.bg.<key> and <key>Desc.
const PREVIEW_OPTIONS: { value: PreviewBackground; key: string; swatch: string }[] = [
  {
    value: "auto",
    key: "auto",
    swatch: "bg-gradient-to-br from-neutral-100 to-neutral-700",
  },
  { value: "light", key: "light", swatch: "bg-neutral-100" },
  { value: "dark", key: "dark", swatch: "bg-neutral-800" },
  {
    value: "checker",
    key: "checker",
    swatch: "bg-[conic-gradient(#d4d4d4_25%,#fafafa_0_50%,#d4d4d4_0_75%,#fafafa_0)] bg-[length:8px_8px]",
  },
];

const TILE =
  "relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-transparent px-1 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:border-orange-500/50 data-checked:bg-orange-500/10 data-checked:text-foreground";

function Section({ title, caption, children }: Readonly<{ title: string; caption: string; children: ReactNode }>) {
  return (
    <section className="px-1 pt-2 pb-1">
      <h3 className="px-1 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/80 uppercase">{title}</h3>
      {children}
      <p className="px-1 pt-2 text-[11px] leading-snug text-muted-foreground">{caption}</p>
    </section>
  );
}

/**
 * One place for the display preferences that used to crowd the header: the
 * default copy format and the icon preview background. The theme toggle stays
 * a single click next to it.
 */
export function DisplayMenu() {
  const { t } = useT();
  const defaultCopyFormat = useSettingsStore((s) => s.defaultCopyFormat);
  const setDefaultCopyFormat = useSettingsStore((s) => s.setDefaultCopyFormat);
  const previewBackground = useSettingsStore((s) => s.previewBackground);
  const setPreviewBackground = useSettingsStore((s) => s.setPreviewBackground);
  const interfaceSize = useSettingsStore((s) => s.interfaceSize);
  const setInterfaceSize = useSettingsStore((s) => s.setInterfaceSize);
  const formatLabel = FORMAT_LABELS.get(defaultCopyFormat) || defaultCopyFormat;

  const activeFormat = FORMAT_BUTTONS.find((fmt) => fmt.value === defaultCopyFormat) ?? FORMAT_BUTTONS[0];
  const activeBg = PREVIEW_OPTIONS.find((opt) => opt.value === previewBackground) ?? PREVIEW_OPTIONS[0];
  const activeSize = INTERFACE_SIZES.find((opt) => opt.id === interfaceSize) ?? INTERFACE_SIZES[0];
  const dataUriKey = (value: string): string => (value === "data-uri" ? "dataUri" : value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground sm:h-8 sm:w-8"
            aria-label={t("chrome.display.aria", { format: formatLabel })}
            title={t("chrome.display.title", { format: formatLabel })}
          />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 shadow-xl">
        <Section
          title={t("chrome.display.copyFormat")}
          caption={`${activeFormat.label}: ${t(`chrome.display.fmt.${dataUriKey(activeFormat.value)}`, { defaultValue: activeFormat.description })}`}
        >
          <DropdownMenuRadioGroup
            aria-label={t("chrome.display.copyFormat")}
            className="grid grid-cols-5 gap-1"
            value={defaultCopyFormat}
            onValueChange={(value) => {
              const next = FORMAT_BUTTONS.find((fmt) => fmt.value === value);
              if (next) setDefaultCopyFormat(next.value);
            }}
          >
            {FORMAT_BUTTONS.map((fmt) => {
              const FormatIcon = COPY_FORMAT_ICONS[fmt.value];
              return (
                <DropdownMenuRadioItem key={fmt.value} value={fmt.value} showIndicator={false} className={TILE}>
                  <FormatIcon className="h-4 w-4" />
                  <span>{fmt.label}</span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </Section>

        <Section title={t("chrome.display.preview")} caption={t(`chrome.display.bg.${activeBg.key}Desc`)}>
          <DropdownMenuRadioGroup
            aria-label={t("chrome.display.preview")}
            className="grid grid-cols-4 gap-1"
            value={previewBackground}
            onValueChange={(value) => {
              const next = PREVIEW_OPTIONS.find((opt) => opt.value === value);
              if (next) setPreviewBackground(next.value);
            }}
          >
            {PREVIEW_OPTIONS.map((opt) => (
              <DropdownMenuRadioItem key={opt.value} value={opt.value} showIndicator={false} className={TILE}>
                <span aria-hidden="true" className={cn("h-6 w-9 rounded-md border border-border/70 shadow-inner", opt.swatch)} />
                <span>{t(`chrome.display.bg.${opt.key}`)}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </Section>

        <Section
          title={t("chrome.display.size")}
          caption={t(`chrome.display.sz.${activeSize.id}Desc`, { defaultValue: activeSize.description })}
        >
          <DropdownMenuRadioGroup
            aria-label={t("chrome.display.size")}
            className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1"
            value={interfaceSize}
            onValueChange={(value) => setInterfaceSize(parseInterfaceSize(value))}
          >
            {INTERFACE_SIZES.map((opt) => (
              <DropdownMenuRadioItem key={opt.id} value={opt.id} showIndicator={false} className={cn(TILE, "gap-0.5 py-1.5 data-checked:bg-background data-checked:shadow-sm")}>
                <span>{t(`chrome.display.sz.${opt.id}`, { defaultValue: opt.label })}</span>
                <span className="text-[10px] font-normal text-muted-foreground tabular-nums">{Math.floor(opt.percent)}%</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </Section>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
