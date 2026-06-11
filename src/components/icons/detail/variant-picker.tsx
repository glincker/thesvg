"use client";

import { VARIANT_LABELS } from "@/components/icons/shared/icon-constants";
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
      return "bg-zinc-100";
    case "dark":
    case "wordmarkDark":
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
  if (variants.length <= 1) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Variants
      </p>
      <div className="flex flex-wrap gap-2">
        {variants.map(([key, path]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-xl border p-2 shadow-sm transition-all duration-150",
              activeVariant === key
                ? "border-foreground/50 ring-2 ring-foreground shadow-md"
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
                alt={`${VARIANT_LABELS[key] || key} variant`}
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
              {VARIANT_LABELS[key] || key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
