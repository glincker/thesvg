"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { loadIconsManifest } from "@/lib/icons-manifest";
import {
  ArrowUpRight,
  Braces,
  Check,
  Copy,
  Download,
  Minimize2,
  Moon,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeSvgMetrics,
  formatBytes,
  formatSvg,
  isLikelySvg,
  minifySvg,
} from "@/lib/svg-utils";
import { DeepLinkActions } from "@/components/viewer/deep-link-actions";
import { QuickImport } from "@/components/viewer/quick-import";

type PreviewBg = "checker" | "light" | "dark";

export function SvgViewer() {
  const searchParams = useSearchParams();
  const fromSlug = searchParams.get("from");

  const [source, setSource] = useState("");
  const [title, setTitle] = useState("thesvg export");
  const [previewBg, setPreviewBg] = useState<PreviewBg>("checker");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoloading, setAutoloading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Auto-load icon from ?from=slug query param (set when arriving from
  // /icon/[slug]'s "Inspect in SVG Viewer" link or the editor menu).
  useEffect(() => {
    if (!fromSlug || source) return;
    let cancelled = false;
    setAutoloading(fromSlug);
    (async () => {
      try {
        const manifest = await loadIconsManifest();
        const icon = manifest.find((m) => m.slug === fromSlug);
        if (!icon) {
          if (!cancelled) {
            setAutoloading(null);
            setError(`No icon with slug "${fromSlug}" in the library.`);
          }
          return;
        }
        const text = await fetch(icon.variants.default).then((r) => r.text());
        if (cancelled) return;
        setSource(text);
        setTitle(icon.title);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not auto-load that icon.");
      } finally {
        if (!cancelled) setAutoloading(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromSlug, source]);

  const metrics = useMemo(() => computeSvgMetrics(source), [source]);
  const hasContent = source.trim().length > 0;
  const isValid = hasContent && metrics !== null;

  const lineCount = useMemo(
    () => Math.max(1, source.split("\n").length),
    [source],
  );

  const handleScrollSync = useCallback(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    handleScrollSync();
  }, [source, handleScrollSync]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
      setError("File is larger than 2 MB. Please use a smaller SVG.");
      return;
    }
    try {
      const text = await file.text();
      if (!isLikelySvg(text)) {
        setError("That does not look like a valid SVG file.");
        return;
      }
      setError(null);
      setSource(text);
      const cleanName = file.name.replace(/\.svg$/i, "");
      setTitle(cleanName || "uploaded.svg");
    } catch {
      setError("Could not read that file.");
    }
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      void handleFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFiles],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleCopy = useCallback(async () => {
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard write failed.");
    }
  }, [source]);

  const handleDownload = useCallback(() => {
    if (!source) return;
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe =
      title.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "viewer";
    a.download = `${safe}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [source, title]);

  const handleClear = useCallback(() => {
    setSource("");
    setError(null);
  }, []);

  const handleFormat = useCallback(() => {
    if (!isValid) return;
    setSource((prev) => formatSvg(prev));
  }, [isValid]);

  const handleMinify = useCallback(() => {
    if (!isValid) return;
    setSource((prev) => minifySvg(prev));
  }, [isValid]);

  const handleImport = useCallback((svg: string, importedTitle: string) => {
    setSource(svg);
    setTitle(importedTitle);
    setError(null);
  }, []);

  const bgClass =
    previewBg === "checker"
      ? "bg-[conic-gradient(at_50%_50%,#0001_25%,transparent_0_50%,#0001_0_75%,transparent_0)] bg-[length:16px_16px] dark:bg-[conic-gradient(at_50%_50%,#fff1_25%,transparent_0_50%,#fff1_0_75%,transparent_0)]"
      : previewBg === "light"
        ? "bg-white"
        : "bg-neutral-900";

  return (
    <div className="flex flex-col gap-4">
      {/* Import bar */}
      <QuickImport onImport={handleImport} />

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: editor + preview */}
        <div className="flex flex-col gap-4">
          {/* Code editor */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ backgroundColor: "#0c0f14" }}
            className={cn(
              "overflow-hidden rounded-2xl border border-border/60 text-neutral-100 shadow-sm transition-colors",
              dragOver && "border-amber-400/60 ring-2 ring-amber-400/20",
            )}
          >
            {/* Editor chrome — traffic lights + filename + actions */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-neutral-400">
                {title}.svg
              </span>
              <div className="ml-auto flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={handleFormat}
                  disabled={!isValid}
                  className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Braces className="h-3 w-3" />
                  Format
                </button>
                <button
                  type="button"
                  onClick={handleMinify}
                  disabled={!isValid}
                  className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minimize2 className="h-3 w-3" />
                  Minify
                </button>
                {hasContent && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Editor body with line gutter */}
            <div className="relative flex">
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="hidden max-h-[18rem] overflow-hidden border-r border-white/[0.04] bg-white/[0.015] py-3 pr-3 pl-3 text-right font-mono text-[11px] leading-[1.55] text-neutral-500/60 select-none sm:block"
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setError(null);
                }}
                onScroll={handleScrollSync}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const next =
                      source.slice(0, start) + "  " + source.slice(end);
                    setSource(next);
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 2;
                    });
                  } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                    e.preventDefault();
                    handleFormat();
                  }
                }}
                placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
                spellCheck={false}
                style={{ color: "#e6e8eb", caretColor: "#fbbf24" }}
                className="h-72 w-full resize-none bg-transparent p-3 font-mono text-[12px] leading-[1.55] outline-none placeholder:text-neutral-500/60"
              />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-white/[0.02] px-3 py-1.5 font-mono text-[10px] text-neutral-500">
              <div className="flex items-center gap-3">
                <span>
                  <span className="text-neutral-300">{lineCount}</span> ln
                </span>
                <span>
                  <span className="text-neutral-300">{source.length.toLocaleString()}</span> ch
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    isValid
                      ? "text-emerald-400"
                      : hasContent
                        ? "text-rose-400"
                        : "text-neutral-500",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {isValid ? "valid svg" : hasContent ? "invalid" : "empty"}
                </span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">
                  Tab
                </kbd>
                <span>indent</span>
                <span className="text-neutral-700">·</span>
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">
                  ⌘S
                </kbd>
                <span>format</span>
              </div>
            </div>
          </div>

          {autoloading && (
            <p className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground/30 border-t-foreground" />
              Loading <span className="font-mono">{autoloading}</span> from
              library...
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* Preview */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </p>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewBg("checker")}
                  aria-label="Checker background"
                  aria-pressed={previewBg === "checker"}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent",
                    previewBg === "checker" && "bg-accent text-foreground",
                  )}
                >
                  <span className="block h-3.5 w-3.5 rounded-sm bg-[conic-gradient(at_50%_50%,#0002_25%,transparent_0_50%,#0002_0_75%,transparent_0)] bg-[length:6px_6px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg("light")}
                  aria-label="Light background"
                  aria-pressed={previewBg === "light"}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent",
                    previewBg === "light" && "bg-accent text-foreground",
                  )}
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg("dark")}
                  aria-label="Dark background"
                  aria-pressed={previewBg === "dark"}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent",
                    previewBg === "dark" && "bg-accent text-foreground",
                  )}
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div
              className={cn(
                "flex min-h-[280px] items-center justify-center p-8",
                bgClass,
              )}
            >
              {isValid ? (
                <div
                  className="flex items-center justify-center [&_svg]:max-h-64 [&_svg]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: source }}
                />
              ) : (
                <p className="text-center text-xs text-muted-foreground/60">
                  {hasContent
                    ? "Cannot render — check the SVG syntax above."
                    : "Paste, drop, or import an SVG to preview"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: metadata + actions + deep links — sticky on desktop */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-2xl border border-border/60 bg-card/30 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              File info
            </p>
            {metrics ? (
              <dl className="space-y-2 text-xs">
                <Row label="Size" value={formatBytes(metrics.bytes)} />
                <Row label="ViewBox" value={metrics.viewBox ?? "—"} mono />
                <Row label="Width" value={metrics.width ?? "—"} mono />
                <Row label="Height" value={metrics.height ?? "—"} mono />
                <Row
                  label="Elements"
                  value={metrics.elementCount.toLocaleString()}
                />
                <Row
                  label="Gradients"
                  value={metrics.hasGradients ? "Yes" : "No"}
                />
                <Row
                  label="Masks/Clips"
                  value={metrics.hasMasks ? "Yes" : "No"}
                />
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground/60">
                Add an SVG to see file info.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleCopy}
              disabled={!isValid}
              className="justify-start gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy SVG"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={!isValid}
              className="justify-start gap-2"
            >
              <Download className="h-4 w-4" />
              Download .svg
            </Button>
          </div>

          {/* Deep links */}
          <div className="rounded-2xl border border-border/60 bg-card/30 p-4">
            <p className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Open in editor
              <span className="font-mono text-[9px] normal-case text-muted-foreground/60">
                6 targets
              </span>
            </p>
            <DeepLinkActions svg={source} title={title} />
          </div>

          {/* Partner CTA */}
          <a
            href="https://www.filagram.com/svg-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-2xl border border-border/40 bg-card/30 p-4 transition-colors hover:border-border hover:bg-card/60"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 p-1.5 dark:bg-white/[0.06]">
              <img
                src="/icons/filagram/default.svg"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">
                Powered by Filagram
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Need to edit, optimize, or convert to PNG, JPG, PDF, or WebP?
                Filagram has the heavy-lift tooling.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                Visit Filagram
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </a>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </dt>
      <dd
        className={cn(
          "truncate text-right text-xs text-foreground",
          mono && "font-mono text-[11px]",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
