"use client";

import type { StyleParams, Variant } from "@/lib/ui-icons/engine";
import { useTheme } from "next-themes";
import { useSearchStore } from "@/lib/stores/search-store";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type CopyTarget, isCopyTarget } from "@/lib/ui-icons/copy-target";
import { VARIANTS } from "@/lib/ui-icons/glyphs";

export interface UiState {
  variant: Variant;
  setVariant: (v: Variant) => void;
  accent: string;
  setAccent: (hex: string) => void;
  /** "natural" gives each icon its own colour (green check, red alert), "mono" keeps them all on the text colour. */
  colorMode: "natural" | "mono";
  setColorMode: (m: "natural" | "mono") => void;
  /** The open icon's own colour. Detail pages set it so every drawing on the page follows, in natural mode. */
  naturalInk: string;
  setNaturalInk: (hex: string) => void;
  /** What copying an icon puts on the clipboard. */
  copyTarget: CopyTarget;
  setCopyTarget: (t: CopyTarget) => void;
  /** When on, a click on an icon copies it instead of opening its page. */
  clickToCopy: boolean;
  setClickToCopy: (v: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (c: string) => void;
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  onlyFavorites: boolean;
  setOnlyFavorites: (v: boolean) => void;
  /** Live style overrides from the lab, applied on top of the house style of each look. */
  lab: Partial<StyleParams>;
  setLab: (patch: Partial<StyleParams>) => void;
  resetLab: () => void;
  /** The glyph the sidebar previews each look with: the open icon, or the one under the pointer in the list. */
  sample: string | null;
  setSample: (slug: string | null) => void;
  /** Runs list-changing work on the list page. From a detail page it navigates there first, then runs it. */
  runOnList: (fn: () => void) => void;
  /** The collection shown in Brand mode, "all" or a thesvg collection such as aws. */
  brandCollection: string;
  setBrandCollection: (c: string) => void;
  /** "all" or a release set id. */
  set: string;
  setSet: (id: string) => void;
}

const Ctx = createContext<UiState | null>(null);

export function useUi(): UiState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUi must be used inside UiStateProvider");
  return v;
}

const FAV_KEY = "svg-icons-favorites";
const COLOR_MODE_KEY = "svg-icons-color-mode";
const COPY_TARGET_KEY = "svg-icons-copy-target";
const CLICK_COPY_KEY = "svg-icons-click-to-copy";

/** Holds the browsing choices and mirrors them into the URL so a design can be shared by link. */
export function UiStateProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<Variant>("glass");
  const [accent, setAccent] = useState("");
  const [colorMode, setColorModeState] = useState<"natural" | "mono">("natural");
  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLOR_MODE_KEY) === "mono") setColorModeState("mono");
    } catch {
      /* storage can be blocked, the mode then stays natural */
    }
  }, []);
  const [naturalInk, setNaturalInk] = useState("");
  const [copyTarget, setCopyTargetState] = useState<CopyTarget>("svg");
  const [clickToCopy, setClickToCopyState] = useState(false);
  useEffect(() => {
    try {
      const t = window.localStorage.getItem(COPY_TARGET_KEY);
      if (isCopyTarget(t)) setCopyTargetState(t);
      setClickToCopyState(window.localStorage.getItem(CLICK_COPY_KEY) === "1");
    } catch {
      /* storage can be blocked, the defaults then apply */
    }
  }, []);
  const remember = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* the choice then lasts until reload */
    }
  };
  const setCopyTarget = (t: CopyTarget) => { setCopyTargetState(t); remember(COPY_TARGET_KEY, t); };
  const setClickToCopy = (v: boolean) => { setClickToCopyState(v); remember(CLICK_COPY_KEY, v ? "1" : "0"); };
  const setColorMode = (m: "natural" | "mono") => {
    setColorModeState(m);
    try {
      window.localStorage.setItem(COLOR_MODE_KEY, m);
    } catch {
      /* the choice then lasts until reload */
    }
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  // The header search box is thesvg's own, so in this section it drives the UI query.
  const headerQuery = useSearchStore((st) => st.query);
  const sawHeader = useRef(false);
  useEffect(() => {
    if (!sawHeader.current) { sawHeader.current = true; return; }
    setQuery(headerQuery);
  }, [headerQuery]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [lab, setLabState] = useState<Partial<StyleParams>>({});
  const [set, setSet] = useState("all");
  const [brandCollection, setBrandCollection] = useState("all");
  const [sample, setSample] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = VARIANTS.find((x) => x === q.get("v"));
    if (v) setVariant(v);
    const a = q.get("accent");
    if (a && /^[0-9a-f]{6}$/i.test(a)) setAccent(`#${a}`);
    setQuery(q.get("q") ?? "");
    useSearchStore.getState().setQuery(q.get("q") ?? "");
    setCategory(q.get("cat") ?? "All");
    setSet(q.get("set") ?? "all");
    setBrandCollection(q.get("bc") ?? "all");
    const th = q.get("theme");
    if (th === "light" || th === "dark") setTheme(th);
    const l: Partial<StyleParams> = {};
    const num = (k: string): number | null => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);
    const weight = num("w");
    if (weight !== null) l.strokeWidth = weight;
    const scale = num("sc");
    if (scale !== null) l.scale = scale;
    const corner = ["sharp", "chamfer", "round"].find((c) => c === q.get("cr"));
    if (corner === "sharp" || corner === "chamfer" || corner === "round") l.corner = corner;
    const radius = num("rd");
    if (radius !== null) l.radius = radius;
    const shadow = num("sh");
    if (shadow !== null) l.shadow = shadow;
    if (q.get("ct") === "1") l.cutTerminals = true;
    if (q.get("ct") === "0") l.cutTerminals = false;
    setLabState(l);
    try {
      setFavorites(JSON.parse(window.localStorage.getItem(FAV_KEY) ?? "[]") as string[]);
    } catch {
      setFavorites([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (pathname === "/ui" && pending.current) {
      const run = pending.current;
      pending.current = null;
      run();
    }
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const ink = accent || (colorMode === "natural" ? naturalInk : "");
    if (ink) root.style.setProperty("--glyph-ink", ink);
    else root.style.removeProperty("--glyph-ink");
  }, [accent, colorMode, naturalInk]);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    q.set("v", variant);
    if (accent) q.set("accent", accent.slice(1));
    if (query) q.set("q", query);
    if (category !== "All") q.set("cat", category);
    if (set !== "all") q.set("set", set);
    if (brandCollection !== "all") q.set("bc", brandCollection);
    if (lab.strokeWidth !== undefined) q.set("w", String(lab.strokeWidth));
    if (lab.scale !== undefined) q.set("sc", String(lab.scale));
    if (lab.corner === "sharp" || lab.corner === "chamfer" || lab.corner === "round") q.set("cr", lab.corner);
    if (lab.radius !== undefined) q.set("rd", String(lab.radius));
    if (lab.shadow !== undefined) q.set("sh", String(lab.shadow));
    if (lab.cutTerminals !== undefined) q.set("ct", lab.cutTerminals ? "1" : "0");
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  }, [ready, variant, accent, query, category, set, lab, brandCollection]);

  // Static export cannot read ?v= on the server, so the look goes into the tab title here for analytics.
  useEffect(() => {
    if (!ready || pathname !== "/ui") return;
    const look = variant.replace(/-/g, " ");
    document.title = `${look.charAt(0).toUpperCase()}${look.slice(1)} UI Icons | theSVG`;
  }, [ready, variant, pathname]);

  const value = useMemo<UiState>(
    () => ({
      variant, setVariant, accent, setAccent, colorMode, setColorMode, naturalInk, setNaturalInk, copyTarget, setCopyTarget, clickToCopy, setClickToCopy, query, setQuery, category, setCategory, favorites, onlyFavorites, setOnlyFavorites,
      sample, setSample,
      runOnList: (fn) => {
        if (window.location.pathname === "/ui") fn();
        else {
          pending.current = fn;
          router.push("/ui");
        }
      },
      lab, setLab: (patch) => setLabState((cur) => ({ ...cur, ...patch })), resetLab: () => setLabState({}), set, setSet, brandCollection, setBrandCollection,
      toggleFavorite: (slug) =>
        setFavorites((cur) => {
          const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
          try {
            window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
          } catch {
            /* storage can be blocked, favorites then last for the session only */
          }
          return next;
        }),
    }),
    [variant, accent, colorMode, naturalInk, copyTarget, clickToCopy, query, category, favorites, onlyFavorites, lab, set, router, sample, brandCollection],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
