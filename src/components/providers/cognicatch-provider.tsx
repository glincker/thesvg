"use client";

import { AdaptiveToastProvider } from "@cognicatch/react";
import { useTheme } from "next-themes";

export function CognicatchProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <AdaptiveToastProvider 
      theme={(resolvedTheme ?? "light") as "light" | "dark"} 
    />
  );
}
