"use client";

import { useEffect } from "react";
import { INTERFACE_SIZE_ATTRIBUTE } from "@/lib/interface-size";
import { useSettingsStore } from "@/lib/stores/settings-store";

/** Keeps the root attribute in step with the saved interface size. The head script covers the first paint. */
export function InterfaceSizeSync() {
  const size = useSettingsStore((s) => s.interfaceSize);
  useEffect(() => {
    const root = document.documentElement;
    if (size === "default") root.removeAttribute(INTERFACE_SIZE_ATTRIBUTE);
    else root.setAttribute(INTERFACE_SIZE_ATTRIBUTE, size);
  }, [size]);
  return null;
}
