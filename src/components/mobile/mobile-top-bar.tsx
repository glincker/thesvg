"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Compact mobile top bar — logo + theme toggle only. GitHub / npm /
 * Raycast / Figma / VS Code / Extensions all live in the More sheet.
 * The desktop `<Header>` keeps its full chrome above the `lg` breakpoint.
 */
export function MobileTopBar() {
  const { theme, setTheme } = useTheme();
  return (
    <header
      className="surface-glass sticky top-0 z-30 w-full border-b border-border/40 lg:hidden dark:border-white/[0.06]"
      style={{
        paddingTop: "var(--safe-top)",
      }}
    >
      <div className="flex h-12 items-center justify-between px-3">
        <Link
          href="/"
          aria-label="thesvg home"
          className="flex items-center gap-2"
        >
          <img
            src="/logo-transparent.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-md"
          />
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            the<span className="text-orange-500">SVG</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </div>
    </header>
  );
}
