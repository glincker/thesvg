import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  clearAll: () => void;
  addFavorites: (slugs: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (slug) =>
        set((state) => ({
          favorites: state.favorites.includes(slug)
            ? state.favorites.filter((s) => s !== slug)
            : [...state.favorites, slug],
        })),
      isFavorite: (slug) => get().favorites.includes(slug),
      clearAll: () => set({ favorites: [] }),
      addFavorites: (slugs) => set((state) => {
        const newFavs = [...state.favorites];
        let changed = false;
        for (const s of slugs) {
          if (!newFavs.includes(s)) {
            newFavs.push(s);
            changed = true;
          }
        }
        return changed ? { favorites: newFavs } : state;
      }),
    }),
    { name: "thesvg-favorites", skipHydration: true }
  )
);
