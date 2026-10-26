import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";

interface IconEntry {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: string[] | Record<string, string>;
}

interface RegistryResponse {
  icons: IconEntry[];
}

// NOTE: @main pins live indefinitely. A schema change to icons.json or a
// path restructure under public/icons/ would break every installed instance
// at once. v1.1 should pin to a release tag (e.g. @v3.0.0) and ship a
// migration when the schema bumps.
const CDN = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main";
const REGISTRY_URL = `${CDN}/src/data/icons.json`;
const CDN_BASE = `${CDN}/public/icons`;
const UI_INDEX_URL = `${CDN}/src/data/ui-icons.json`;
const UI_CACHE_KEY = "ui_registry_cache";
const UI_DEFAULT_LOOK = "outline";
const CACHE_KEY = "registry_cache";
const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  timestamp: number;
  data: RegistryResponse;
}

interface UiIconEntry {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  set: string;
  releasedOn: string;
}

interface UiIndex {
  version: number;
  kind: string;
  looks: string[];
  icons: UiIconEntry[];
}

interface UiCacheEntry {
  timestamp: number;
  data: UiIndex;
}

function isUiIndex(value: unknown): value is UiIndex {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<UiIndex>;
  return (
    Array.isArray(v.icons) && Array.isArray(v.looks) && v.looks.length > 0
  );
}

// Separate from the brand registry on purpose. Returns null on any failure so
// the popup can fall back to brand mode without surfacing an error.
async function loadUiIndex(): Promise<UiIndex | null> {
  try {
    const cached = (await chrome.storage.local.get(UI_CACHE_KEY)) as Record<
      string,
      UiCacheEntry | undefined
    >;
    const entry = cached[UI_CACHE_KEY];
    if (
      entry &&
      Date.now() - entry.timestamp < TTL_MS &&
      isUiIndex(entry.data)
    ) {
      return entry.data;
    }
    const res = await fetch(UI_INDEX_URL);
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    if (!isUiIndex(raw)) return null;
    await chrome.storage.local.set({
      [UI_CACHE_KEY]: { timestamp: Date.now(), data: raw },
    });
    return raw;
  } catch {
    return null;
  }
}

const UI_SITE = "https://thesvg.org";
const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function uiSvgUrl(slug: string, look: string): string {
  // The per-icon files are served by the site, not committed to the repo. Both parts come from data we fetched, so they
  // are checked before they become part of a request.
  if (!SAFE_NAME.test(slug) || !SAFE_NAME.test(look)) throw new Error(`invalid UI icon name: ${slug}/${look}`);
  return `${UI_SITE}/ui/${encodeURIComponent(slug)}/${encodeURIComponent(look)}.svg`;
}

async function loadRegistry(): Promise<IconEntry[]> {
  const cached = (await chrome.storage.local.get(CACHE_KEY)) as Record<
    string,
    CacheEntry | undefined
  >;
  const entry = cached[CACHE_KEY];
  if (entry && Date.now() - entry.timestamp < TTL_MS) {
    return entry.data.icons;
  }
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    throw new Error(`registry fetch failed: ${res.status}`);
  }
  const raw = (await res.json()) as IconEntry[] | RegistryResponse;
  const data: RegistryResponse = Array.isArray(raw) ? { icons: raw } : raw;
  await chrome.storage.local.set({
    [CACHE_KEY]: { timestamp: Date.now(), data },
  });
  return data.icons;
}

function variantKeys(entry: IconEntry): string[] {
  if (Array.isArray(entry.variants)) return entry.variants;
  return Object.keys(entry.variants);
}

function cdnUrl(slug: string, variant = "default"): string {
  return `${CDN_BASE}/${slug}/${variant}.svg`;
}

async function fetchSvgBody(url: string): Promise<string> {
  // The popup only ever reads icon files from the CDN or the site, never from any other address.
  if (!url.startsWith(`${CDN_BASE}/`) && !url.startsWith(`${UI_SITE}/`)) throw new Error("svg url is not allowed");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`svg fetch failed: ${res.status}`);
  }
  return res.text();
}

type Status = "loading" | "ready" | "error";
type Mode = "brand" | "ui";

// One shape for both kinds so selection and copy actions share a path.
interface ResultRow {
  slug: string;
  title: string;
  meta: string;
  variants: string[];
  isUi: boolean;
}

export default function App() {
  const [status, setStatus] = useState<Status>("loading");
  const [icons, setIcons] = useState<IconEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("default");
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("brand");
  const [uiIndex, setUiIndex] = useState<UiIndex | null>(null);
  const [uiLoading, setUiLoading] = useState(false);
  const [uiUnavailable, setUiUnavailable] = useState(false);

  useEffect(() => {
    loadRegistry()
      .then((list) => {
        setIcons(list);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  // The background worker refreshes the cached registry on install/startup
  // and whenever the 24h TTL lapses, then broadcasts REGISTRY_REFRESHED so
  // any open popup can pick up the new data without the user having to
  // close and reopen it.
  useEffect(() => {
    function handleMessage(message: unknown): void {
      const type =
        typeof message === "object" && message !== null && "type" in message
          ? (message as { type: unknown }).type
          : undefined;
      if (type !== "REGISTRY_REFRESHED") return;

      loadRegistry()
        .then((list) => {
          setIcons(list);
          setStatus("ready");
        })
        .catch(() => {
          // Keep showing whatever was already loaded; only surface an
          // error if we have nothing to show at all.
          setStatus((prev) => (prev === "ready" ? prev : "error"));
        });
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(icons, {
        keys: ["title", "slug", "aliases"],
        threshold: 0.3,
        distance: 100,
      }),
    [icons]
  );

  const uiFuse = useMemo(
    () =>
      new Fuse(uiIndex?.icons ?? [], {
        keys: ["title", "slug", "tags"],
        threshold: 0.3,
        distance: 100,
      }),
    [uiIndex]
  );

  const results = useMemo<ResultRow[]>(() => {
    if (mode === "ui") {
      if (!uiIndex) return [];
      const list = query.trim()
        ? uiFuse.search(query, { limit: 20 }).map((r) => r.item)
        : uiIndex.icons.slice(0, 20);
      return list.map((i) => ({
        slug: i.slug,
        title: i.title,
        meta: i.category,
        variants: uiIndex.looks,
        isUi: true,
      }));
    }
    if (status !== "ready") return [];
    const list = query.trim()
      ? fuse.search(query, { limit: 20 }).map((r) => r.item)
      : icons.slice(0, 20);
    return list.map((i) => ({
      slug: i.slug,
      title: i.title,
      meta: i.slug,
      variants: variantKeys(i),
      isUi: false,
    }));
  }, [fuse, uiFuse, icons, uiIndex, query, status, mode]);

  function rowUrl(row: ResultRow, variant: string): string {
    return row.isUi ? uiSvgUrl(row.slug, variant) : cdnUrl(row.slug, variant);
  }

  function switchMode(next: Mode): void {
    if (next === mode) return;
    setQuery("");
    setSelectedSlug(null);
    if (next === "brand") {
      setMode("brand");
      setSelectedVariant("default");
      return;
    }
    setSelectedVariant(UI_DEFAULT_LOOK);
    if (uiIndex) {
      setMode("ui");
      return;
    }
    setUiLoading(true);
    loadUiIndex().then((idx) => {
      setUiLoading(false);
      if (idx) {
        setUiIndex(idx);
        setUiUnavailable(false);
        setMode("ui");
      } else {
        setUiUnavailable(true);
        setSelectedVariant("default");
      }
    });
  }

  const selected = useMemo(
    () => results.find((i) => i.slug === selectedSlug) ?? null,
    [results, selectedSlug]
  );

  function notify(message: string): void {
    setToast(message);
    setTimeout(() => setToast(null), 1400);
  }

  async function handleAction(
    kind: "svg" | "url" | "md",
    icon: ResultRow,
    variant: string
  ): Promise<void> {
    try {
      const url = rowUrl(icon, variant);
      if (kind === "url") {
        await navigator.clipboard.writeText(url);
        notify("URL copied");
      } else if (kind === "md") {
        await navigator.clipboard.writeText(`![${icon.title}](${url})`);
        notify("Markdown copied");
      } else {
        const body = await fetchSvgBody(url);
        await navigator.clipboard.writeText(body);
        notify("SVG copied");
      }
    } catch {
      notify("Copy failed");
    }
  }

  function retry(): void {
    setStatus("loading");
    loadRegistry()
      .then((list) => {
        setIcons(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  return (
    <>
      <header className="header">
        <img
          className="header-logo"
          src="/icon/48.png"
          alt=""
          width={20}
          height={20}
        />
        <span className="header-title">theSVG</span>
        <span className="header-count">
          {(mode === "ui" ? uiIndex?.icons.length : icons.length) || ""}
        </span>
      </header>

      <div className="mode-switch" role="group" aria-label="Icon kind">
        <button
          type="button"
          className={mode === "brand" ? "mode-btn active" : "mode-btn"}
          aria-pressed={mode === "brand"}
          onClick={() => switchMode("brand")}
        >
          Brand
        </button>
        <button
          type="button"
          className={mode === "ui" ? "mode-btn active" : "mode-btn"}
          aria-pressed={mode === "ui"}
          disabled={uiLoading}
          onClick={() => switchMode("ui")}
        >
          UI icons
        </button>
      </div>
      {uiUnavailable && mode === "brand" && (
        <div className="mode-note" role="status">
          UI icons are not available right now.
        </div>
      )}

      <div className="search-wrap">
        <input
          autoFocus
          type="text"
          className="search-input"
          placeholder={
            mode === "ui"
              ? "Search UI icons by name or tag"
              : icons.length
                ? `Search ${icons.length.toLocaleString()} brand SVGs`
                : "Search brand SVGs"
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedSlug(null);
            setSelectedVariant("default");
          }}
        />
      </div>

      {status === "loading" && mode === "brand" && (
        <div className="state-msg">
          <span className="spinner" />
          Loading catalog
        </div>
      )}

      {status === "error" && mode === "brand" && (
        <div className="error-msg">
          Could not load registry.
          <button type="button" className="retry-btn" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {((status === "ready" && mode === "brand") || mode === "ui") && (
        <ul className="results-list" role="listbox">
          {results.length === 0 && <li className="state-msg">No matches</li>}
          {results.map((icon) => {
            const isSelected = selected?.slug === icon.slug;
            const keys = icon.variants;
            return (
              <li
                key={icon.slug}
                className={isSelected ? "result-item selected" : "result-item"}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedSlug(isSelected ? null : icon.slug);
                  // Pick the first available variant. Not every icon has a
                  // "default" key in the registry; some only have
                  // ["color", "mono"] or ["wordmark"]. Defaulting to
                  // whatever the registry actually lists keeps the action
                  // buttons in sync with the chips.
                  const firstKey = icon.isUi
                    ? UI_DEFAULT_LOOK
                    : (icon.variants[0] ?? "default");
                  setSelectedVariant(firstKey);
                }}
              >
                <span className="result-icon">
                  <img
                    className={icon.isUi ? "ui-glyph" : undefined}
                    src={rowUrl(icon, icon.isUi ? UI_DEFAULT_LOOK : (keys[0] ?? "default"))}
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                </span>
                <span className="result-info">
                  <span className="result-name">{icon.title}</span>
                  <span className="result-meta">{icon.meta}</span>
                  {keys.length > 1 && (
                    <span className="result-variants">
                      {keys.length} {icon.isUi ? "looks" : "variants"}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <div className="action-row">
          {selected.variants.length > 1 && (
            <div className="variant-row">
              {selected.variants.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={
                    selectedVariant === v
                      ? "variant-chip active"
                      : "variant-chip"
                  }
                  onClick={() => setSelectedVariant(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <span className="action-selected-name">{selected.title}</span>
          <div className="action-buttons">
            <button
              type="button"
              className="action-btn"
              onClick={() => handleAction("svg", selected, selectedVariant)}
            >
              SVG
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => handleAction("url", selected, selectedVariant)}
            >
              URL
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => handleAction("md", selected, selectedVariant)}
            >
              MD
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
