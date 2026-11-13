"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { UiGlyph } from "@/components/ui-glyph";
import { cn } from "@/lib/utils";
import { COLOR_FAMILIES, DEFAULT_STATE, REGIONS, filterTiles, parseState, toParams, type BrowserState, type FlagTile, type FlagVariantKey, type SortKey } from "@/lib/flags-browser/model";
import { FLAGS_RECENT_MAX, FLAGS_STAR_MAX, FLAG_SIZES, type FlagSize } from "@/lib/flags-browser/config";
import { isHex } from "@/lib/flags-browser/color";
import { PREFS_KEY, RECENT_KEY, STARRED_KEY, pushCapped, readJson, toggleCapped, writeJson } from "@/lib/flags-browser/storage";
import { FlagTileCard, flagSrc } from "./flag-tile";
import { FlagPanel } from "./flag-panel";
import { LanguagesMode } from "./languages-mode";
import { YourFlagCard } from "./your-flag-card";

type Prefs = Pick<BrowserState, "variant" | "size" | "region" | "sort">;

const chip = (active: boolean): string =>
  cn("rounded-full border px-3 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none", active ? "border-foreground bg-foreground text-background" : "border-border/60 hover:bg-muted");

const seg = (active: boolean): string =>
  cn("rounded-md px-2.5 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none", active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground");

interface Props {
  tiles: FlagTile[];
  /** Keep the URL in step with the filters. Off when embedded in a docs page. */
  syncUrl?: boolean;
}

export function FlagsBrowser({ tiles, syncUrl = true }: Props) {
  const [state, setState] = useState<BrowserState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [aliases, setAliases] = useState<Record<string, string[]> | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [starred, setStarred] = useState<string[]>([]);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const aliasRequested = useRef(false);
  const gridRef = useRef<HTMLUListElement>(null);

  // Prefs first, then the URL on top, so a shared link wins over what this browser remembers.
  useEffect(() => {
    // A link that carries its own filters must not pick up this browser's saved ones.
    const sharedLink = syncUrl && window.location.search.length > 1;
    const prefs = sharedLink ? {} : readJson<Partial<Prefs>>(PREFS_KEY, {});
    const base = parseState(new URLSearchParams(), { ...DEFAULT_STATE, ...prefs });
    setState(syncUrl ? parseState(new URLSearchParams(window.location.search), base) : base);
    setRecent(readJson<string[]>(RECENT_KEY, []));
    setStarred(readJson<string[]>(STARRED_KEY, []));
    setReady(true);
    if (!syncUrl) return;
    const onPop = (): void => setState((s) => parseState(new URLSearchParams(window.location.search), { ...DEFAULT_STATE, variant: s.variant, size: s.size }));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [syncUrl]);

  const update = useCallback((patch: Partial<BrowserState>, history: "push" | "replace" = "replace") => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (syncUrl && typeof window !== "undefined") {
        const qs = toParams(next).toString();
        const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
        if (url !== `${window.location.pathname}${window.location.search}`) window.history[history === "push" ? "pushState" : "replaceState"](null, "", url);
      }
      writeJson(PREFS_KEY, { variant: next.variant, size: next.size, region: next.region, sort: next.sort } satisfies Prefs);
      return next;
    });
  }, [syncUrl]);

  const loadAliases = useCallback(() => {
    if (aliasRequested.current) return;
    aliasRequested.current = true;
    fetch("/data/flags-search.json").then((r) => (r.ok ? r.json() : null)).then((d: Record<string, string[]> | null) => { if (d) setAliases(d); }).catch(() => { aliasRequested.current = false; });
  }, []);

  // Opening a shared ?q= link has no focus or typing event, so load the alias index as soon as there is a query.
  useEffect(() => {
    if (ready && state.q.trim() !== "") loadAliases();
  }, [ready, state.q, loadAliases]);

  const byCode = useMemo(() => new Map(tiles.map((t) => [t.code, t])), [tiles]);
  const results = useMemo(() => filterTiles(tiles, state, aliases), [tiles, state, aliases]);
  const open = state.flag ? byCode.get(state.flag) ?? null : null;

  const openFlag = useCallback((code: string) => {
    setRecent((r) => { const next = pushCapped(r, code, FLAGS_RECENT_MAX); writeJson(RECENT_KEY, next); return next; });
    update({ flag: code }, "push");
  }, [update]);
  const toggleStar = useCallback((code: string) => {
    setStarred((s) => { const next = toggleCapped(s, code, FLAGS_STAR_MAX); writeJson(STARRED_KEY, next); return next; });
  }, []);

  const rovingCode = focusCode && results.some((t) => t.code === focusCode) ? focusCode : results[0]?.code;

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLUListElement>): void => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-flag-button]");
    if (!target) return;
    const code = target.dataset.flagButton!;
    const i = results.findIndex((t) => t.code === code);
    const buttons = [...(gridRef.current?.querySelectorAll<HTMLElement>("[data-flag-button]") ?? [])];
    const firstTop = buttons[0]?.getBoundingClientRect().top;
    const columns = Math.max(1, buttons.filter((b) => b.getBoundingClientRect().top === firstTop).length);
    let next = -1;
    if (e.key === "ArrowRight") next = i + 1;
    else if (e.key === "ArrowLeft") next = i - 1;
    else if (e.key === "ArrowDown") next = i + columns;
    else if (e.key === "ArrowUp") next = i - columns;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = results.length - 1;
    else if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) { toggleStar(code); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    const dest = results[Math.min(results.length - 1, Math.max(0, next))];
    if (!dest) return;
    setFocusCode(dest.code);
    gridRef.current?.querySelector<HTMLElement>(`[data-flag-button="${dest.code}"]`)?.focus();
  };

  const similar = useMemo(() => (open ? tiles.filter((t) => t.region === open.region && t.code !== open.code).slice(0, 8) : []), [open, tiles]);
  const row = (codes: string[], label: string) => {
    const list = codes.map((c) => byCode.get(c)).filter((t): t is FlagTile => Boolean(t));
    if (list.length === 0) return null;
    return (
      <section aria-label={label} className="mb-4">
        <h2 className="mb-2 text-xs font-semibold">{label}</h2>
        <ul className="flex flex-wrap gap-2">
          {list.map((t) => (
            <li key={t.code}>
              <button type="button" onClick={() => openFlag(t.code)} aria-label={t.name} title={t.name} className="rounded-md border border-border/40 p-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                <img src={flagSrc(t.slug, state.variant)} alt="" width={state.variant === "4x3" ? 32 : 24} height={24} loading="lazy" decoding="async" className="object-contain" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  const colorCount = state.colors.length + (state.near !== "" ? 1 : 0);
  const colorsShown = colorsOpen || colorCount > 0;
  const filtersActive = state.q !== "" || state.region !== "all" || state.colors.length > 0 || state.near !== "";

  return (
    <div data-testid="flags-browser" data-ready={ready}>
      <YourFlagCard tiles={tiles} variant={state.variant} onOpen={openFlag} />

      <div role="tablist" aria-label="Browse mode" className="mb-4 flex gap-2">
        {(["flags", "languages"] as const).map((v) => (
          <button key={v} role="tab" type="button" aria-selected={state.view === v} onClick={() => update({ view: v }, "push")} className={chip(state.view === v)}>
            {v === "flags" ? "All flags" : "Flags for languages"}
          </button>
        ))}
      </div>

      {state.view === "languages" ? <LanguagesMode variant={state.variant} tiles={tiles} /> : (
        <>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <UiGlyph name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={state.q}
                  onFocus={loadAliases}
                  onChange={(e) => { loadAliases(); update({ q: e.target.value }); }}
                  placeholder="Search by name, native name, ISO code, emoji or locale"
                  aria-label="Search flags"
                  className="pl-9"
                />
              </div>
              <button
                type="button"
                aria-expanded={colorsShown}
                aria-controls="flag-color-filters"
                onClick={() => setColorsOpen((o) => !o)}
                className={cn(seg(false), "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3")}
              >
                Colors
                {colorCount > 0 ? <span className="rounded-full bg-foreground px-1.5 text-[11px] leading-5 text-background">{colorCount}</span> : null}
              </button>
            </div>

            {colorsShown ? (
              <div id="flag-color-filters" role="group" aria-label="Color" className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-3">
                {COLOR_FAMILIES.map((c) => (
                  <button key={c} type="button" aria-pressed={state.colors.includes(c)} onClick={() => update({ colors: state.colors.includes(c) ? state.colors.filter((x) => x !== c) : [...state.colors, c] })} className={chip(state.colors.includes(c))}>{c}</button>
                ))}
                <button type="button" aria-pressed={state.mode === "and"} onClick={() => update({ mode: state.mode === "and" ? "or" : "and" })} className={chip(state.mode === "and")} title="Match all selected colors, or any of them">
                  {state.mode === "and" ? "All colors" : "Any color"}
                </button>
                <label className="flex items-center gap-1 text-xs">
                  Near hex
                  <Input value={state.near} onChange={(e) => update({ near: isHex(e.target.value) ? e.target.value.replace(/^#/, "").toLowerCase() : e.target.value.slice(0, 7) })} placeholder="ed2939" aria-label="Near hex color" className="h-8 w-24 text-xs" />
                </label>
                {state.near !== "" ? (
                  <label className="flex items-center gap-1 text-xs">
                    Tolerance
                    <input type="range" min={5} max={120} value={state.tol} onChange={(e) => update({ tol: Number(e.target.value) })} aria-label="Color tolerance" className="w-24" />
                  </label>
                ) : null}
              </div>
            ) : null}

            <div role="group" aria-label="Region" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              <button type="button" aria-pressed={state.region === "all"} onClick={() => update({ region: "all" }, "push")} className={cn(chip(state.region === "all"), "shrink-0")}>All</button>
              {REGIONS.map((r) => (
                <button key={r.id} type="button" aria-pressed={state.region === r.id} onClick={() => update({ region: r.id }, "push")} className={cn(chip(state.region === r.id), "shrink-0")}>{r.label}</button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
              <div role="radiogroup" aria-label="Shape" className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                {(["4x3", "square", "circle"] as FlagVariantKey[]).map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={state.variant === v} onClick={() => update({ variant: v })} className={seg(state.variant === v)}>{v === "4x3" ? "4x3" : v === "square" ? "Square" : "Circle"}</button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Size" className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                {(Object.keys(FLAG_SIZES) as FlagSize[]).map((sz) => (
                  <button key={sz} type="button" role="radio" aria-checked={state.size === sz} onClick={() => update({ size: sz })} className={seg(state.size === sz)}>{sz.toUpperCase()}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-muted-foreground">
                Sort
                <select value={state.sort} onChange={(e) => update({ sort: e.target.value as SortKey })} className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground">
                  <option value="name">A to Z</option>
                  <option value="region">By region</option>
                  <option value="iso">By ISO code</option>
                  <option value="hue">By color</option>
                </select>
              </label>
              {filtersActive ? (
                <button type="button" onClick={() => update({ q: "", region: "all", colors: [], near: "" })} className="underline">Clear filters</button>
              ) : null}
              <span className="ml-auto text-muted-foreground" role="status" aria-live="polite" data-testid="result-count">
                {results.length} of {tiles.length} flags
              </span>
            </div>
          </div>

          {row(starred, "Starred")}
          {row(recent, "Recently viewed")}

          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground" data-testid="empty-state">
              No flags match these filters. Try another name, a code like DEU, or clear the filters.
            </p>
          ) : (
            <ul
              ref={gridRef}
              onKeyDown={onGridKeyDown}
              aria-label="Flags"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            >
              {results.map((t) => (
                <FlagTileCard key={t.code} tile={t} variant={state.variant} size={state.size} starred={starred.includes(t.code)} tabIndex={t.code === rovingCode ? 0 : -1} onOpen={openFlag} onToggleStar={toggleStar} />
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">Arrow keys move between flags, Enter opens the flag page, S stars the focused flag. The eye button opens a quick view.</p>
        </>
      )}

      <FlagPanel tile={open} similar={similar} variant={state.variant} onSelect={openFlag} onClose={() => update({ flag: null }, "push")} />
    </div>
  );
}
