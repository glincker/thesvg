"use client";

import { useEffect } from "react";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { useMobilePrefsStore } from "@/lib/stores/mobile-prefs-store";

/**
 * Rehydrates the persisted zustand stores from localStorage after mount.
 *
 * The stores set `skipHydration: true`, so their first client render uses
 * the same default state the server prerendered. That keeps the first pass
 * identical to the shipped HTML and avoids a hydration mismatch (React #418)
 * for returning visitors who have saved favorites, recents, or mobile prefs.
 * We load the stored values here, one tick later, and the affected consumers
 * re-render with them.
 */
export function StoreHydration() {
  useEffect(() => {
    useFavoritesStore.persist.rehydrate();
    useRecentsStore.persist.rehydrate();
    useMobilePrefsStore.persist.rehydrate();
  }, []);

  return null;
}
