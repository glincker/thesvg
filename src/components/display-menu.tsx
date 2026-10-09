"use client";

import type { ComponentType } from "react";
import { Binary, Braces, Check, Component, FileCode, Link2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FORMAT_BUTTONS, FORMAT_LABELS } from "@/components/icons/shared/icon-constants";
import { useSettingsStore, type PreviewBackground } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";

const COPY_FORMAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  svg: FileCode,
  jsx: Braces,
  vue: Component,
  cdn: Link2,
  "data-uri": Binary,
};

const PREVIEW_OPTIONS: { value: PreviewBackground; label: string; description: string; swatch: string }[] = [
  {
    value: "auto",
    label: "Auto",
    description: "Adapts to each logo so dark and light marks stay visible",
    swatch: "bg-gradient-to-br from-neutral-100 to-neutral-700",
  },
  { value: "light", label: "Light", description: "Always a light tile", swatch: "bg-neutral-100" },
  { value: "dark", label: "Dark", description: "Always a dark tile", swatch: "bg-neutral-800" },
  {
    value: "checker",
    label: "Checkerboard",
    description: "Shows transparent areas",
    swatch: "bg-[conic-gradient(#d4d4d4_25%,#fafafa_0_50%,#d4d4d4_0_75%,#fafafa_0)] bg-[length:8px_8px]",
  },
];

/**
 * One place for the display preferences that used to crowd the header: the
 * default copy format and the icon preview background. The theme toggle stays
 * a single click next to it.
 */
export function DisplayMenu() {
  const defaultCopyFormat = useSettingsStore((s) => s.defaultCopyFormat);
  const setDefaultCopyFormat = useSettingsStore((s) => s.setDefaultCopyFormat);
  const previewBackground = useSettingsStore((s) => s.previewBackground);
  const setPreviewBackground = useSettingsStore((s) => s.setPreviewBackground);
  const formatLabel = FORMAT_LABELS.get(defaultCopyFormat) || defaultCopyFormat;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground sm:h-8 sm:w-8"
            aria-label={`Display settings. Copy format ${formatLabel}`}
            title={`Display settings (copies as ${formatLabel})`}
          />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-semibold text-foreground">Default copy format</p>
            <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
              Used when you click the copy button on any icon card
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {FORMAT_BUTTONS.map((fmt) => {
            const FormatIcon = COPY_FORMAT_ICONS[fmt.value];
            const isActive = defaultCopyFormat === fmt.value;
            return (
              <DropdownMenuItem
                key={fmt.value}
                onClick={() => setDefaultCopyFormat(fmt.value)}
                className="items-start gap-2.5 py-2"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
                  <FormatIcon className="h-3.5 w-3.5" />
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">{fmt.label}</span>
                  <span className="text-[10px] leading-relaxed text-muted-foreground/70">{fmt.description}</span>
                </span>
                {isActive && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-semibold text-foreground">Preview background</p>
            <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
              Judge a logo on the surface it will sit on
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          {PREVIEW_OPTIONS.map((opt) => {
            const isActive = previewBackground === opt.value;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setPreviewBackground(opt.value)}
                className="items-start gap-2.5 py-2"
              >
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 h-5 w-5 shrink-0 rounded-md border border-border/60", opt.swatch)}
                />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  <span className="text-[10px] leading-relaxed text-muted-foreground/70">{opt.description}</span>
                </span>
                {isActive && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
