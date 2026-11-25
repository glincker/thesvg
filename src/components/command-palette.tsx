"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Clock, Copy, Folder, Plug, Upload } from "@/components/own-icons";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { IconEntry } from "@/lib/icons";
import { getIconsBySlugMap, loadIconsManifest } from "@/lib/icons-manifest";
import { formatSvg } from "@/lib/copy-formats";
import { useIconSearch } from "@/lib/hooks/use-icon-search";
import { useCommandPaletteStore } from "@/lib/stores/command-palette-store";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { useT } from "@/i18n/use-t";
import { categoryUrl } from "@/lib/categories";
import {
  PALETTE_ICON_LIMIT,
  buildActions,
  categoriesFromIcons,
  filterActions,
  filterCategories,
  recentSearchQueries,
  resolveRecentIcons,
  type PaletteAction,
} from "@/lib/command-palette";

const NOTICE_MS = 2000;

function IconThumb({ icon }: { icon: IconEntry }) {
  return <img src={icon.variants.default} alt="" className="size-5 shrink-0 object-contain" />;
}

function actionIcon(action: PaletteAction) {
  if (action.kind === "copy") return <Copy />;
  if (action.id === "submit") return <Upload />;
  if (action.id === "docs") return <BookOpen />;
  return <Plug />;
}

export function CommandPalette() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const viewed = useRecentsStore((s) => s.viewed);
  const searched = useRecentsStore((s) => s.searched);
  const copied = useRecentsStore((s) => s.copied);
  const recordCopy = useRecentsStore((s) => s.recordCopy);

  const [query, setQuery] = useState("");
  const [manifest, setManifest] = useState<IconEntry[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // The header search bar owns Cmd+K whenever it is on screen; the palette is the fallback for pages without one.
        const headerSearch = document.querySelector<HTMLInputElement>("input[data-global-search]");
        if (headerSearch && headerSearch.offsetParent !== null) return;
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    if (!open || manifest.length > 0) return;
    let active = true;
    loadIconsManifest()
      .then((icons) => {
        if (active) setManifest(icons);
      })
      .catch(() => {
        // Search results and recents stay empty; navigation actions still work.
      });
    return () => {
      active = false;
    };
  }, [open, manifest.length]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [notice]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) setQuery("");
    },
    [setOpen],
  );

  // Close on any route change so the dialog never lingers over the next page.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  const { results: iconResults, isLoading: iconsLoading } = useIconSearch({
    query: open ? query : "",
    source: "command_palette",
    limit: PALETTE_ICON_LIMIT,
  });

  const bySlug = useMemo(() => {
    // ⚡ Bolt: Reuse the centrally cached map instead of re-allocating a new Map per consumer.
    return manifest.length > 0 ? getIconsBySlugMap() : new Map<string, IconEntry>();
  }, [manifest]);
  const categories = useMemo(() => categoriesFromIcons(manifest), [manifest]);
  const lastCopied = copied.length > 0 ? bySlug.get(copied[0].slug) : undefined;

  const isSearching = query.trim().length > 0;
  const recentIcons = useMemo(() => resolveRecentIcons(viewed, bySlug), [viewed, bySlug]);
  const recentQueries = useMemo(() => recentSearchQueries(searched), [searched]);
  const matchedCategories = useMemo(() => filterCategories(categories, query), [categories, query]);
  const actions = useMemo(
    () => filterActions(buildActions(lastCopied), query),
    [lastCopied, query],
  );

  // Action labels are built in lib in English; ids map to locale keys here.
  const actionLabel = (action: PaletteAction): string => {
    const keys: Record<string, string> = {
      submit: "submit",
      docs: "docs",
      integrations: "integrations",
      "copy-svg": "copySvg",
      "copy-jsx": "copyJsx",
    };
    const key = keys[action.id];
    if (!key) return action.label;
    return t(`chrome.palette.action.${key}`, { title: lastCopied?.title ?? "" });
  };

  const goTo = useCallback(
    (href: string) => {
      handleOpenChange(false);
      router.push(href);
    },
    [handleOpenChange, router],
  );

  const runAction = useCallback(
    async (action: PaletteAction) => {
      if (action.kind === "navigate") {
        goTo(action.href);
        return;
      }
      const icon = bySlug.get(action.slug);
      if (!icon) return;
      try {
        const res = await fetch(icon.variants.default);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const svg = await res.text();
        await navigator.clipboard.writeText(formatSvg(svg, action.format, icon.slug, "default"));
        recordCopy(icon.slug, action.format);
        setNotice(t("chrome.palette.copied", { title: icon.title, format: action.format.toUpperCase() }));
      } catch {
        setNotice(t("chrome.palette.copyFailed"));
      }
    },
    [bySlug, goTo, recordCopy, t],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("chrome.palette.title")}
      description={t("chrome.palette.description")}
      className="motion-reduce:animate-none motion-reduce:transition-none sm:max-w-lg"
    >
      <Command shouldFilter={false} className="rounded-none! bg-transparent p-0">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("chrome.palette.placeholder")}
        />
        <CommandList className="max-h-80">
          {!iconsLoading && <CommandEmpty>{t("chrome.palette.empty")}</CommandEmpty>}

          {isSearching && iconResults.length > 0 && (
            <CommandGroup heading={t("chrome.palette.icons")}>
              {iconResults.map((icon) => (
                <CommandItem
                  key={icon.slug}
                  value={`icon-${icon.slug}`}
                  onSelect={() => goTo(`/icon/${icon.slug}`)}
                >
                  <IconThumb icon={icon} />
                  <span className="truncate">{icon.title}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {icon.categories[0]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!isSearching && (recentIcons.length > 0 || recentQueries.length > 0) && (
            <CommandGroup heading={t("chrome.palette.recent")}>
              {recentIcons.map((icon) => (
                <CommandItem
                  key={`recent-${icon.slug}`}
                  value={`recent-${icon.slug}`}
                  onSelect={() => goTo(`/icon/${icon.slug}`)}
                >
                  <IconThumb icon={icon} />
                  <span className="truncate">{icon.title}</span>
                </CommandItem>
              ))}
              {recentQueries.map((recentQuery) => (
                <CommandItem
                  key={`search-${recentQuery}`}
                  value={`search-${recentQuery}`}
                  onSelect={() => setQuery(recentQuery)}
                >
                  <Clock />
                  <span className="truncate">{recentQuery}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {matchedCategories.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("chrome.palette.categories")}>
                {matchedCategories.map((category) => (
                  <CommandItem
                    key={category.name}
                    value={`category-${category.name}`}
                    onSelect={() => goTo(categoryUrl(category.name))}
                  >
                    <Folder />
                    <span className="truncate">{category.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{category.count}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {actions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("chrome.palette.quickActions")}>
                {actions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={`action-${action.id}`}
                    onSelect={() => void runAction(action)}
                  >
                    {actionIcon(action)}
                    <span className="truncate">{actionLabel(action)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <span aria-live="polite">{notice}</span>
          <span className="hidden gap-3 sm:flex">
            <span>
              <kbd className="font-mono">&uarr;&darr;</kbd> {t("chrome.palette.navigate")}
            </span>
            <span>
              <kbd className="font-mono">&crarr;</kbd> {t("chrome.palette.select")}
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> {t("chrome.palette.close")}
            </span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
