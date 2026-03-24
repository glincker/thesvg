"use client";

import { AdaptiveToastProvider } from "@cognicatch/react";
import { useTheme } from "next-themes";

export function CognicatchProvider() {
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <AdaptiveToastProvider 
      theme={theme} 
    />
  );
}
