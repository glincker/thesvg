"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Download,
  FileCode2,
  Globe,
  Heart,
  Home,
  Image as ImageIcon,
  Link2,
  Loader2,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IconEntry } from "@/lib/icons";
import type { CopyFormat } from "@/lib/copy-formats";
import { formatSvg } from "@/lib/copy-formats";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";
import { svgToPng, downloadPng } from "@/lib/svg-to-png";
import {
  generateSnippet,
  type SnippetFormat,
} from "@/lib/code-snippets";

interface IconDetailPageProps {
  icon: IconEntry;
  relatedIcons?: IconEntry[];
}

const VARIANT_LABELS: Record<string, string> = {
  default: "Default",
  mono: "Mono",
  light: "Light",
  dark: "Dark",
  wordmark: "Wordmark",
  wordmarkLight: "WM Light",
  wordmarkDark: "WM Dark",
};

const FORMAT_BUTTONS: {
  value: CopyFormat;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "svg", label: "SVG", icon: <Copy className="h-3.5 w-3.5" /> },
  { value: "jsx", label: "JSX", icon: <Code className="h-3.5 w-3.5" /> },
  { value: "vue", label: "Vue", icon: <FileCode2 className="h-3.5 w-3.5" /> },
  { value: "cdn", label: "CDN", icon: <Link2 className="h-3.5 w-3.5" /> },
  { value: "data-uri", label: "URI", icon: <Globe className="h-3.5 w-3.5" /> },
];

const SNIPPET_TABS: { value: SnippetFormat; label: string; iconSlug?: string }[] = [
  { value: "react", label: "React", iconSlug: "react" },
  { value: "vue", label: "Vue", iconSlug: "vue" },
  { value: "html", label: "HTML", iconSlug: "html5" },
  { value: "nextjs", label: "Next.js", iconSlug: "nextdotjs" },
  { value: "css", label: "CSS", iconSlug: "css" },
];

const DEMO_SIZES = [16, 24, 32, 48, 64];
const PNG_EXPORT_SIZES = [32, 64, 128, 256, 512];

function formatSvgCode(raw: string): string {
  return raw
    .replace(/>\s*</g, ">\n<")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Escape HTML so raw code is safe inside dangerouslySetInnerHTML */
function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Wrap text in a colored span using placeholder markers first, then expand */
function colorize(line: string, format: SnippetFormat): string {
  // Escape HTML first
  let s = esc(line);

  // Use Unicode private-use markers so regex steps don't interfere
  const S = "\uE000"; // start marker
  const E = "\uE001"; // end marker
  const tag = (cls: string, text: string) => `${S}${cls}${E}${text}${S}/${E}`;

  if (format === "css") {
    s = s
      .replace(/([\w-]+)(\s*:\s*)/g, (_, p, c) => tag("text-purple-400", p) + c)
      .replace(/:\s*([^;]+)(;?)/g, (_, v, sc) => ": " + tag("text-green-400", v) + sc)
      .replace(/^(\.[^\s{]+)/gm, (_, sel) => tag("text-blue-400", sel));
  } else if (format === "html" || format === "vue") {
    s = s
      .replace(/(&lt;)(\/?\w+)/g, (_, lt, t) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a, eq) => tag("text-purple-400", a) + eq)
      .replace(/"([^"]*)"/g, (_, v) => tag("text-green-400", `"${v}"`));
  } else {
    s = s
      .replace(/\b(import|from|export|default|function|return|const)\b/g, (_, k) => tag("text-purple-400", k))
      .replace(/"([^"]*)"/g, (_, v) => tag("text-green-400", `"${v}"`))
      .replace(/'([^']*)'/g, (_, v) => tag("text-green-400", `'${v}'`))
      .replace(/(&lt;)(\/?\w+)/g, (_, lt, t) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a, eq) => tag("text-orange-300", a) + eq);
  }

  // Expand markers to real HTML: close tags first to avoid regex collision
  s = s.replace(new RegExp(`${S}/${E}`, "g"), "</span>");
  s = s.replace(new RegExp(`${S}([^${E}]+)${E}`, "g"), '<span class="$1">');
  return s;
}

function colorizeSnippet(code: string, format: SnippetFormat): React.ReactNode {
  return code.split("\n").map((line, i, arr) => (
    <span key={i}>
      <span dangerouslySetInnerHTML={{ __html: colorize(line, format) }} />
      {i < arr.length - 1 ? "\n" : ""}
    </span>
  ));
}

function colorizeSvgCode(code: string): React.ReactNode {
  return code.split("\n").map((line, i, arr) => {
    let s = esc(line);
    const S = "\uE000", E = "\uE001";
    const tag = (cls: string, text: string) => `${S}${cls}${E}${text}${S}/${E}`;
    s = s
      .replace(/(&lt;)(\/?\w[\w-]*)/g, (_, lt, t) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a, eq) => tag("text-purple-400", a) + eq)
      .replace(/"([^"]*)"/g, (_, v) => tag("text-green-400", `"${v}"`));
    s = s.replace(new RegExp(`${S}/${E}`, "g"), "</span>");
    s = s.replace(new RegExp(`${S}([^${E}]+)${E}`, "g"), '<span class="$1">');
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: s }} />
        {i < arr.length - 1 ? "\n" : ""}
      </span>
    );
  });
}

export function IconDetailPage({ icon, relatedIcons = [] }: IconDetailPageProps) {
  const [activeVariant, setActiveVariant] = useState("default");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [showSnippets, setShowSnippets] = useState(true);
  const [activeSnippetFormat, setActiveSnippetFormat] =
    useState<SnippetFormat>("react");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [exportingSize, setExportingSize] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) =>
    s.favorites.includes(icon.slug)
  );

  const variants = Object.entries(icon.variants).filter(
    ([, v]) => v !== undefined && v !== ""
  );

  const formattedCode = useMemo(
    () => (svgContent ? formatSvgCode(svgContent) : ""),
    [svgContent]
  );

  const currentPath =
    icon.variants[activeVariant as keyof typeof icon.variants] ||
    icon.variants.default;

  useEffect(() => {
    if (!currentPath) return;
    fetch(currentPath)
      .then((r) => r.text())
      .then(setSvgContent)
      .catch(() => setSvgContent(""));
  }, [currentPath]);

  const handleCopy = useCallback(
    async (format: CopyFormat) => {
      if (!svgContent) return;
      const text = formatSvg(svgContent, format, icon.slug, activeVariant);
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 1500);
    },
    [svgContent, icon.slug, activeVariant]
  );

  const handleCopyRaw = useCallback(async () => {
    if (!svgContent) return;
    await navigator.clipboard.writeText(svgContent);
    setCopiedFormat("raw");
    setTimeout(() => setCopiedFormat(null), 1500);
  }, [svgContent]);

  const activeSnippet = useMemo(
    () =>
      generateSnippet(icon.slug, icon.title, activeSnippetFormat, activeVariant),
    [icon.slug, icon.title, activeSnippetFormat, activeVariant]
  );

  const handleCopySnippet = useCallback(async () => {
    await navigator.clipboard.writeText(activeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 1500);
  }, [activeSnippet]);

  const handleDownload = useCallback(async () => {
    if (!currentPath) return;
    try {
      const res = await fetch(currentPath);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const variantSuffix =
        activeVariant !== "default"
          ? `-${activeVariant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
          : "";
      a.download = `${icon.slug}${variantSuffix}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentPath, "_blank");
    }
  }, [currentPath, icon.slug, activeVariant]);

  const handlePngExport = useCallback(
    async (size: number) => {
      if (!currentPath || exportingSize !== null) return;
      setExportingSize(size);
      setExportError(null);
      try {
        const blob = await svgToPng(currentPath, size);
        const variantSuffix =
          activeVariant !== "default"
            ? `-${activeVariant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
            : "";
        downloadPng(blob, `${icon.slug}${variantSuffix}-${size}px`);
      } catch {
        setExportError("Could not convert this SVG to PNG. Try another variant.");
        setTimeout(() => setExportError(null), 3000);
      } finally {
        setExportingSize(null);
      }
    },
    [currentPath, activeVariant, icon.slug, exportingSize]
  );

  const primaryCategory = icon.categories[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
      >
        <Link
          href="/"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        {primaryCategory && (
          <>
            <span className="text-border">/</span>
            <Link
              href={`/?category=${encodeURIComponent(primaryCategory)}`}
              className="font-medium transition-colors hover:text-foreground"
            >
              {primaryCategory}
            </Link>
          </>
        )}
        <span className="text-border">/</span>
        <span className="min-w-0 truncate font-semibold text-foreground">{icon.title}</span>
      </nav>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Left column: large preview - sticky on desktop */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit">
          {/* Preview card */}
          <div className="icon-preview-bg relative flex items-center justify-center rounded-2xl p-16">
            <img
              src={currentPath}
              alt={icon.title}
              className="h-40 w-40 object-contain"
            />

            {/* Hex badge */}
            {icon.hex && icon.hex !== "000000" && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-border/40 bg-background/70 px-2.5 py-1 backdrop-blur-sm">
                <div
                  className="h-3 w-3 rounded-full ring-1 ring-border/30"
                  style={{ backgroundColor: `#${icon.hex}` }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  #{icon.hex}
                </span>
              </div>
            )}

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => toggleFavorite(icon.slug)}
              className={cn(
                "absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/70 backdrop-blur-sm transition-colors",
                isFavorite
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn("h-4 w-4", isFavorite && "fill-current")}
              />
            </button>
          </div>

          {/* Size preview */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Size Preview
            </p>
            <div className="flex flex-wrap items-end gap-2 sm:gap-4">
              {DEMO_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1.5">
                  <div className="icon-preview-bg flex items-center justify-center rounded-lg p-1.5">
                    <img
                      src={currentPath}
                      alt={`${icon.title} at ${size}px`}
                      style={{ width: size, height: size }}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {size}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick metadata */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
            {icon.license && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">License</span>
                <span className="text-xs text-muted-foreground">{icon.license}</span>
              </div>
            )}
            {variants.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Variants</span>
                <span className="text-xs text-muted-foreground">{variants.length}</span>
              </div>
            )}
            {icon.categories.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
                <span className="text-xs text-muted-foreground">{icon.categories[0]}</span>
              </div>
            )}
          </div>

          {/* Website + Guidelines links */}
          {(icon.url || icon.guidelines) && (
            <div className="space-y-1.5">
              {icon.url && (() => {
                const hostname = new URL(icon.url).hostname.replace("www.", "");
                return (
                  <a
                    href={icon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                      alt=""
                      className="h-3.5 w-3.5 rounded-sm"
                    />
                    <span className="flex-1 truncate">{hostname}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-50" />
                  </a>
                );
              })()}
              {icon.guidelines && (
                <a
                  href={icon.guidelines}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="flex-1 truncate">Brand guidelines</span>
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right column: info + actions */}
        <div className="flex flex-col gap-5">
          {/* Title + slug + download */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{icon.title}</h1>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {icon.slug}
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              className="shrink-0"
              onClick={handleDownload}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Categories */}
          {icon.categories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {icon.categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {cat}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Aliases */}
          {icon.aliases.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Also known as
              </p>
              <p className="text-sm text-muted-foreground">
                {icon.aliases.join(", ")}
              </p>
            </div>
          )}

          {/* Variant switcher */}
          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Variants
              </p>
              <div className="scrollbar-none flex flex-wrap gap-1.5">
                {variants.map(([key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveVariant(key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      activeVariant === key
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {VARIANT_LABELS[key] || key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Copy format buttons */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Copy as
            </p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_BUTTONS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-all duration-150",
                    copiedFormat === fmt.value
                      ? "scale-[1.03] border-green-500/30 bg-green-500/10 text-green-600 shadow-sm dark:text-green-400"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleCopy(fmt.value)}
                >
                  {copiedFormat === fmt.value ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    fmt.icon
                  )}
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Commands - CLI, MCP, CDN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
              <span className="shrink-0 rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-orange-500">CLI</span>
              <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                npx @thesvg/cli add {icon.slug}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`npx @thesvg/cli add ${icon.slug}`);
                  setCopiedCmd("cli");
                  setTimeout(() => setCopiedCmd(null), 1500);
                }}
                className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                {copiedCmd === "cli" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
              <span className="shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-purple-500">MCP</span>
              <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                npx -y @thesvg/mcp-server
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`npx -y @thesvg/mcp-server`);
                  setCopiedCmd("mcp");
                  setTimeout(() => setCopiedCmd(null), 1500);
                }}
                className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                {copiedCmd === "mcp" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
              <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-500">CDN</span>
              <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                cdn.jsdelivr.net/.../icons/{icon.slug}/default.svg
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/${icon.slug}/default.svg`);
                  setCopiedCmd("cdn");
                  setTimeout(() => setCopiedCmd(null), 1500);
                }}
                className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                {copiedCmd === "cdn" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Export PNG */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-orange-500/70" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Export PNG
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PNG_EXPORT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  disabled={exportingSize !== null}
                  onClick={() => handlePngExport(size)}
                  className={cn(
                    "group/png relative flex h-9 items-center gap-2 overflow-hidden rounded-lg border px-3.5 text-xs font-semibold transition-all duration-200",
                    exportingSize === size
                      ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : "border-border bg-card text-muted-foreground hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-500 hover:shadow-sm disabled:opacity-50 dark:hover:text-orange-400"
                  )}
                >
                  {exportingSize === size ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3 opacity-40 transition-opacity group-hover/png:opacity-100" />
                  )}
                  <span className="font-mono tabular-nums">{size}</span>
                  <span className="text-[10px] opacity-50">px</span>
                </button>
              ))}
            </div>
            {exportError && (
              <p className="mt-2 text-xs text-red-500">{exportError}</p>
            )}
          </div>

          {/* Usage snippets */}
          <div className="overflow-hidden rounded-xl border border-border bg-card/30 shadow-sm">
            <button
              type="button"
              onClick={() => setShowSnippets(!showSnippets)}
              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                Usage Snippets
              </span>
              {showSnippets ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            {showSnippets && (
              <div className="border-t border-border/50">
                {/* Format tabs */}
                <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2">
                  {SNIPPET_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveSnippetFormat(tab.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                        activeSnippetFormat === tab.value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {tab.iconSlug && (
                         
                        <img
                          src={`/icons/${tab.iconSlug}/default.svg`}
                          alt=""
                          className={cn(
                            "h-3 w-3",
                            activeSnippetFormat === tab.value
                              ? "brightness-0 invert dark:invert-0"
                              : "dark:invert"
                          )}
                        />
                      )}
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* Code block with syntax coloring */}
                <div className="relative px-4 pb-4">
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className={cn(
                      "absolute top-2 right-7 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                      copiedSnippet
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-zinc-800/80 text-zinc-400 backdrop-blur-sm hover:bg-zinc-700 hover:text-zinc-200"
                    )}
                  >
                    {copiedSnippet ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSnippet ? "Copied" : "Copy"}
                  </button>
                  <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                    <pre className="max-h-64 overflow-auto p-4 pr-16 font-mono text-[11px] leading-6 text-zinc-300">
                      <code className="block whitespace-pre-wrap break-all">
                        {colorizeSnippet(activeSnippet, activeSnippetFormat)}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SVG code viewer */}
          <div className="overflow-hidden rounded-xl border border-border bg-card/30 shadow-sm">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                SVG Code
              </span>
              {showCode ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            {showCode && formattedCode && (
              <div className="relative border-t border-border/50">
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className={cn(
                    "absolute top-2 right-3 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    copiedFormat === "raw"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-zinc-800/80 text-zinc-400 backdrop-blur-sm hover:bg-zinc-700 hover:text-zinc-200"
                  )}
                >
                  {copiedFormat === "raw" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedFormat === "raw" ? "Copied" : "Copy"}
                </button>
                <div className="overflow-hidden rounded-b-xl bg-zinc-950">
                  <pre className="max-h-64 overflow-auto p-4 pr-16 font-mono text-[11px] leading-5 text-zinc-300">
                    <code className="block whitespace-pre-wrap break-all">
                      {colorizeSvgCode(formattedCode)}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Removed: Links + license section - now in left sidebar */}
        </div>
      </div>

      {/* Related icons */}
      {relatedIcons.length > 0 && primaryCategory && (
        <section className="mt-12 border-t border-border pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Related in{" "}
              <span className="text-muted-foreground">{primaryCategory}</span>
            </h2>
            <Link
              href={`/?category=${encodeURIComponent(primaryCategory)}`}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {relatedIcons.map((rel) => (
              <Link
                key={rel.slug}
                href={`/icon/${rel.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:border-foreground/20 hover:bg-accent hover:shadow-sm"
              >
                <div className="icon-preview-bg flex h-12 w-12 items-center justify-center rounded-lg p-2">
                  <img
                    src={rel.variants.default}
                    alt={rel.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="line-clamp-1 w-full text-center text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {rel.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
