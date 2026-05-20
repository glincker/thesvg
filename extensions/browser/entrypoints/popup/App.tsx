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
const REGISTRY_URL =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json";
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";
const CACHE_KEY = "registry_cache";
const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  timestamp: number;
  data: RegistryResponse;
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

async function fetchSvgBody(slug: string, variant = "default"): Promise<string> {
  const res = await fetch(cdnUrl(slug, variant));
  if (!res.ok) {
    throw new Error(`svg fetch failed: ${res.status}`);
  }
  return res.text();
}

type Status = "loading" | "ready" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("loading");
  const [icons, setIcons] = useState<IconEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("default");
  const [toast, setToast] = useState<string | null>(null);

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

  const fuse = useMemo(
    () =>
      new Fuse(icons, {
        keys: ["title", "slug", "aliases"],
        threshold: 0.3,
        distance: 100,
      }),
    [icons]
  );

  const results = useMemo(() => {
    if (status !== "ready") return [];
    if (!query.trim()) return icons.slice(0, 20);
    return fuse.search(query, { limit: 20 }).map((r) => r.item);
  }, [fuse, icons, query, status]);

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
    icon: IconEntry,
    variant: string
  ): Promise<void> {
    try {
      if (kind === "url") {
        await navigator.clipboard.writeText(cdnUrl(icon.slug, variant));
        notify("URL copied");
      } else if (kind === "md") {
        await navigator.clipboard.writeText(
          `![${icon.title}](${cdnUrl(icon.slug, variant)})`
        );
        notify("Markdown copied");
      } else {
        const body = await fetchSvgBody(icon.slug, variant);
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
        <span className="header-count">{icons.length || ""}</span>
      </header>

      <div className="search-wrap">
        <input
          autoFocus
          type="text"
          className="search-input"
          placeholder="Search 6,030+ brand SVGs"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedSlug(null);
            setSelectedVariant("default");
          }}
        />
      </div>

      {status === "loading" && (
        <div className="state-msg">
          <span className="spinner" />
          Loading catalog
        </div>
      )}

      {status === "error" && (
        <div className="error-msg">
          Could not load registry.
          <button type="button" className="retry-btn" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {status === "ready" && (
        <ul className="results-list" role="listbox">
          {results.length === 0 && <li className="state-msg">No matches</li>}
          {results.map((icon) => {
            const isSelected = selected?.slug === icon.slug;
            const keys = variantKeys(icon);
            return (
              <li
                key={icon.slug}
                className={isSelected ? "result-item selected" : "result-item"}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedSlug(isSelected ? null : icon.slug);
                  setSelectedVariant("default");
                }}
              >
                <span className="result-icon">
                  <img
                    src={cdnUrl(icon.slug)}
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                </span>
                <span className="result-info">
                  <span className="result-name">{icon.title}</span>
                  <span className="result-meta">{icon.slug}</span>
                  {keys.length > 1 && (
                    <span className="result-variants">
                      {keys.length} variants
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
          {variantKeys(selected).length > 1 && (
            <div className="variant-row">
              {variantKeys(selected).map((v) => (
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
