"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Falls back to default when a brand has no mono variant. Plain string
 * slug (not a DocsIcon) so it stays serializable across the RSC boundary. */
export function DocsBrandIcon({ slug, className }: Readonly<{ slug: string; className?: string }>) {
  const [variant, setVariant] = useState<"mono" | "default">("mono");

  return (
    <img
      src={`/icons/${slug}/${variant}.svg`}
      alt=""
      aria-hidden="true"
      className={cn(className, variant === "mono" && "dark:invert")}
      onError={() => {
        if (variant === "mono") setVariant("default");
      }}
    />
  );
}
