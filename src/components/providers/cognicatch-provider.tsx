"use client";

import { AdaptiveToastProvider } from "@cognicatch/react";
import { useTheme } from "next-themes";

export function CognicatchProvider() {
  const { theme } = useTheme();

  return (
    <AdaptiveToastProvider 
      theme={theme as "light" | "dark" | "system"} 
    />
  );
}
