"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Only the brand-icon case needs a client component (the mono->default
 * fallback). It takes a plain string slug rather than a DocsIcon object, so
 * it stays serializable across the server/client boundary when rendered
 * from a Server Component - a raw Lucide component reference is NOT
 * serializable that way, so the lucide case is rendered inline as JSX at
 * each call site instead of routed through here.
 *
 * Not every brand ships a mono variant (e.g. reactnative only has
 * default/wordmark). Track the fallback in React state rather than
 * mutating img.src imperatively in onError - a DOM mutation like that gets
 * silently reverted by React on the next re-render (the JSX still says
 * mono.svg), which looked like the icon randomly failing to load.
 */
export function DocsBrandIcon({ slug, className }: Readonly<{ slug: string; className?: string }>) {
  const [variant, setVariant] = useState<"mono" | "default">("mono");

  return (
    <img
      src={`/icons/${slug}/${variant}.svg`}
      alt=""
      aria-hidden="true"
      // mono.svg is a fixed dark color, not currentColor - invert it in
      // dark mode so it doesn't look like a black smudge on a dark sidebar.
      // Skip the invert once we've fallen back to the full-color default
      // variant, or a colorful brand mark gets inverted into a mess.
      className={cn(className, variant === "mono" && "dark:invert")}
      onError={() => {
        if (variant === "mono") setVariant("default");
      }}
    />
  );
}
