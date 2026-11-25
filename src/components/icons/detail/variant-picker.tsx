"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";

interface VariantPickerProps {
  variants: [string, string | undefined][];
  activeVariant: string;
  onSelect: (variant: string) => void;
  slug: string;
}

// Preview on the surface the variant is designed to live on.
function getPreviewBg(variantKey: string): string {
  switch (variantKey) {
    case "light":
    case "wordmarkLight":
    case "lockup":
      return "bg-zinc-100";
    case "dark":
    case "wordmarkDark":
    case "lockupDark":
      return "bg-zinc-800";
    default:
      return "icon-preview-bg";
  }
}

export function VariantPicker({
  variants,
  activeVariant,
  onSelect,
  slug,
}: VariantPickerProps) {
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const active = buttonRefs.current.get(activeVariant);
    if (!container || !active) return;

    const update = () => {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setIndicator({
        x: activeRect.left - containerRect.left,
        y: activeRect.top - containerRect.top,
        w: activeRect.width,
        h: activeRect.height,
      });
    };

    update();
    // Variant buttons wrap (flex-wrap), so a resize can reflow rows/columns
    // and shift the active button's position even though selection hasn't
    // changed - keep the indicator glued to it either way.
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeVariant, variants.length]);

  if (variants.length <= 1) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("icon.detail.variants")}
      </p>
      <div ref={containerRef} className="relative flex flex-wrap gap-2">
        {indicator && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-xl border-2 border-orange-500/60 shadow-[0_0_0_3px_rgba(249,115,22,0.15)] transition-[transform,width,height] duration-300 ease-out"
            style={{
              width: indicator.w,
              height: indicator.h,
              transform: `translate(${indicator.x}px, ${indicator.y}px)`,
            }}
          />
        )}
        {variants.map(([key, path]) => (
          <button
            key={key}
            ref={(el) => {
              if (el) buttonRefs.current.set(key, el);
              else buttonRefs.current.delete(key);
            }}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-xl border p-2 shadow-sm transition-all duration-150",
              activeVariant === key
                ? "border-transparent shadow-md"
                : "border-border hover:border-foreground/20 hover:shadow-md"
            )}
          >
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-lg",
                getPreviewBg(key)
              )}
            >
              <img
                src={path || `/icons/${slug}/default.svg`}
                alt={t("icon.variant.suffix", { name: t(`icon.variant.${key}`, { defaultValue: key }) })}
                className="h-8 w-8 object-contain"
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                activeVariant === key
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {t(`icon.variant.${key}`, { defaultValue: key })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
