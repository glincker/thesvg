"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Download,
  Globe,
  Heart,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IconEntry } from "@/lib/icons";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";
import { JsDelivrButton } from "@/components/icons/detail/jsdelivr-button";
import { VariantPicker } from "@/components/icons/detail/variant-picker";
import { QuickCommands } from "@/components/icons/detail/quick-commands";
import { CodeBlock } from "@/components/icons/detail/code-block";
import { PngExport } from "@/components/icons/detail/png-export";
import { ContributionCta } from "@/components/icons/detail/contribution-cta";

interface IconDetailPageProps {
  icon: IconEntry;
  relatedIcons?: IconEntry[];
}

export function IconDetailPage({
  icon,
  relatedIcons = [],
}: IconDetailPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read variant from URL param, fallback to "default"
  const variantParam = searchParams.get("variant");
  const initialVariant =
    variantParam && icon.variants[variantParam as keyof typeof icon.variants]
      ? variantParam
      : "default";
  const [activeVariant, setActiveVariant] = useState(initialVariant);
  const [svgContent, setSvgContent] = useState("");

  const [downloaded, setDownloaded] = useState(false);

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.favorites.includes(icon.slug));

  // Update URL when variant changes (shareable link)
  const handleVariantSelect = useCallback(
    (variant: string) => {
      setActiveVariant(variant);
      posthog.capture("icon_variant_selected", {
        slug: icon.slug,
        variant,
        source: "detail_page",
      });
      const params = new URLSearchParams(searchParams.toString());
      if (variant === "default") {
        params.delete("variant");
      } else {
        params.set("variant", variant);
      }
      const qs = params.toString();
      const queryString = qs ? `?${qs}` : "";
      const newUrl = `${pathname}${queryString}`;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router, icon.slug],
  );

  const variants = Object.entries(icon.variants).filter(
    ([, v]) => v !== undefined && v !== "",
  );

  // Track page view once
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    posthog.capture("icon_page_viewed", {
      slug: icon.slug,
      title: icon.title,
      collection: icon.collection,
      categories: icon.categories,
      variant_count: variants.length,
    });
  }, [
    icon.slug,
    icon.title,
    icon.collection,
    icon.categories,
    variants.length,
  ]);

  const currentPath =
    icon.variants[activeVariant as keyof typeof icon.variants] ||
    icon.variants.default;

  useEffect(() => {
    if (!currentPath) return;
    let cancelled = false;
    fetch(currentPath)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setSvgContent(text);
      })
      .catch(() => {
        if (!cancelled) setSvgContent("");
      });
    return () => { cancelled = true; };
  }, [currentPath]);

  const handleDownload = useCallback(async () => {
    if (!currentPath || downloaded) return;
    try {
      const res = await fetch(currentPath);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const variantSuffix =
        activeVariant === "default"
          ? ""
          : `-${activeVariant.replaceAll(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
      a.download = `${icon.slug}${variantSuffix}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      posthog.capture("icon_downloaded", {
        slug: icon.slug,
        title: icon.title,
        variant: activeVariant,
        source: "detail_page",
      });
      setTimeout(() => setDownloaded(false), 2000);
    } catch {
      window.open(currentPath, "_blank");
    }
  }, [currentPath, icon.slug, activeVariant, downloaded, icon.title]);

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
        <span className="min-w-0 truncate font-semibold text-foreground">
          {icon.title}
        </span>
      </nav>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Left column: large preview - sticky on desktop */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit">
          {/* Preview card */}
          <div className="icon-preview-bg relative flex items-center justify-center rounded-2xl p-16 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <img
              src={currentPath}
              alt={icon.title}
              className="h-40 w-40 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
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
            <button
              type="button"
              onClick={() => toggleFavorite(icon.slug)}
              className={cn(
                "absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/70 backdrop-blur-sm transition-colors",
                isFavorite
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500",
              )}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
          </div>

          {/* Quick metadata */}
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2.5">
            {icon.license && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  License
                </span>
                <span className="text-xs text-muted-foreground">
                  {icon.license}
                </span>
              </div>
            )}
            {variants.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Variants
                </span>
                <span className="text-xs text-muted-foreground">
                  {variants.length}
                </span>
              </div>
            )}
            {icon.categories.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </span>
                <span className="text-xs text-muted-foreground">
                  {icon.categories[0]}
                </span>
              </div>
            )}
          </div>

          {/* Categories */}
          {icon.categories.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {icon.categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-[10px] transition-colors hover:bg-accent hover:text-accent-foreground"
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
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Also known as
              </p>
              <p className="text-xs text-muted-foreground">
                {icon.aliases.join(", ")}
              </p>
            </div>
          )}

          {/* Website + Guidelines links */}
          {(icon.url || icon.guidelines) && (
            <div className="space-y-1.5">
              {icon.url &&
                (() => {
                  const hostname = new URL(icon.url).hostname.replace(
                    "www.",
                    "",
                  );
                  return (
                    <a
                      href={icon.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
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
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="flex-1 truncate">Brand guidelines</span>
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
              )}
            </div>
          )}

          {/* Contribution CTA in sidebar */}
          <ContributionCta
            slug={icon.slug}
            title={icon.title}
            hasMultipleVariants={variants.length > 1}
          />
        </div>

        {/* Right column: info + actions */}
        <div className="flex flex-col gap-5">
          {/* Title + slug + download + jsDelivr */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {icon.title}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {icon.slug}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <JsDelivrButton slug={icon.slug} activeVariant={activeVariant} />
              <Button
                size="sm"
                onClick={handleDownload}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  downloaded
                    ? "bg-green-600 hover:bg-green-600 text-white shadow-green-500/25 shadow-lg"
                    : "",
                )}
              >
                {downloaded ? (
                  <Check className="mr-1.5 h-4 w-4 animate-bounce" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                {downloaded ? "Downloaded!" : "Download"}
                {downloaded && (
                  <span className="absolute inset-0 animate-ping rounded-lg bg-green-400/20" />
                )}
              </Button>
            </div>
          </div>

          {/* Variant switcher with thumbnails */}
          <VariantPicker
            variants={variants as [string, string | undefined][]}
            activeVariant={activeVariant}
            onSelect={handleVariantSelect}
            slug={icon.slug}
          />

          {/* Quick Commands - CLI + CDN (variant-aware) */}
          <QuickCommands slug={icon.slug} activeVariant={activeVariant} />

          {/* Unified code block: Usage (React/Vue/HTML/Next.js/CSS) + Copy (SVG/JSX/CDN/URI) */}
          <CodeBlock
            svgContent={svgContent}
            slug={icon.slug}
            title={icon.title}
            activeVariant={activeVariant}
          />

          {/* Export PNG with visual cards */}
          <PngExport
            currentPath={currentPath}
            slug={icon.slug}
            activeVariant={activeVariant}
          />

          {/* Related icons - inline in right column */}
          {relatedIcons.length > 0 && primaryCategory && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Related in {primaryCategory}
                </p>
                <Link
                  href={`/?category=${encodeURIComponent(primaryCategory)}`}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {relatedIcons.slice(0, 12).map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/icon/${rel.slug}`}
                    prefetch={false}
                    className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all hover:border-foreground/20 hover:bg-accent hover:shadow-md"
                  >
                    <div className="icon-preview-bg flex h-10 w-10 items-center justify-center rounded-lg p-1.5">
                      <img
                        src={rel.variants.default}
                        alt={rel.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="line-clamp-1 w-full text-center text-[9px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {rel.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEO content section - server-rendered unique text for Google */}
      <section className="mt-10 rounded-xl border border-border/40 bg-card/30 p-6 dark:border-white/[0.04] dark:bg-white/[0.01]">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          About {icon.title} Icon
        </h2>
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            The {icon.title} SVG icon is available for free download on theSVG.
            {variants.length > 1
              ? ` This icon comes in ${variants.length} variants: ${variants.map(([name]) => (name === "default" ? "color" : name)).join(", ")}.`
              : ""}
            {icon.categories.length > 0
              ? ` Categorized under ${icon.categories.join(", ")}.`
              : ""}
          </p>
          <p>
            Use this icon in your projects with React, Vue, Svelte, or plain
            HTML. Available via npm (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              @thesvg/react
            </code>
            ), CLI (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              npx @thesvg/cli add {icon.slug}
            </code>
            ), or CDN (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              cdn.jsdelivr.net/npm/@thesvg/icons/icons/{icon.slug}.svg
            </code>
            ).
          </p>
          {icon.collection !== "brands" && (
            <p>
              Part of the{" "}
              {icon.collection === "aws"
                ? "AWS Architecture"
                : icon.collection === "azure"
                  ? "Microsoft Azure"
                  : icon.collection === "gcp"
                    ? "Google Cloud Platform"
                    : icon.collection}{" "}
              icon collection on theSVG.
              {icon.collectionMeta?.type === "service"
                ? " This is a service-level icon used in architecture diagrams and documentation."
                : ""}
            </p>
          )}
          <p>
            License: {icon.license}. Free for personal and commercial use.
            {icon.hex && icon.hex !== "000"
              ? ` Brand color: #${icon.hex}.`
              : ""}
          </p>
        </div>

        {/* Quick usage reference - crawlable text */}
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Quick usage reference
          </summary>
          <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
            <p>
              <strong>React:</strong>{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">{`import { ${icon.title.replace(/[^a-zA-Z0-9]/g, "")}Icon } from "@thesvg/react"`}</code>
            </p>
            <p>
              <strong>HTML:</strong>{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">{`<img src="https://cdn.jsdelivr.net/npm/@thesvg/icons/icons/${icon.slug}.svg" alt="${icon.title}" />`}</code>
            </p>
            <p>
              <strong>CLI:</strong>{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">{`npx @thesvg/cli add ${icon.slug}`}</code>
            </p>
          </div>
        </details>
      </section>

      {/* Trademark disclaimer */}
      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        &ldquo;{icon.title}&rdquo; is a trademark of its respective owner. This
        icon is provided for identification purposes only.{" "}
        {icon.url &&
          (() => {
            try {
              const urlObj = new URL(icon.url);
              if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
                return null;
              }
              return (
                <>
                  For official brand assets, visit{" "}
                  <a
                    href={urlObj.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-muted-foreground"
                  >
                    {urlObj.hostname.replace(/^www\./, "")}
                  </a>
                  .
                </>
              );
            } catch {
              return null;
            }
          })()}
      </p>
    </div>
  );
}
