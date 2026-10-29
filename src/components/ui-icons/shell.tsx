"use client";

import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DOMAINS, GLYPHS } from "@/lib/ui-icons/glyphs";
import { ICON_SIZE } from "@/lib/chrome-sizes";
import { cn } from "@/lib/ui-icons/utils";
import { THEMES, TONES } from "./category-theme";
import { useUi } from "./ui-state";

const DOMAIN_ICON: Record<string, string> = {
  interface: "sliders-horizontal", arrows: "arrow-up-right", status: "circle-check", files: "file", communication: "message-square", dev: "code",
  security: "shield", media: "play", people: "user", commerce: "shopping-cart", layout: "layout-dashboard", time: "clock", tools: "wrench",
  nature: "sun", devices: "smartphone", shapes: "diamond", places: "map", data: "chart-line", space: "orbit", robotics: "joint", agents: "bot", social: "message-circle", general: "star",
};

const CATS_KEY = "ui-sidebar-categories";

interface ItemProps {
  icon: string;
  label: string;
  rail: boolean;
  active?: boolean;
  badge?: string;
  /** Tailwind classes for the icon colour: brand orange by default, the category tone for category rows. */
  hover?: string;
  inkClass?: string;
  href?: string;
  onClick?: () => void;
}

/** One row. In the rail only the icon shows, with the label as a tooltip and for screen readers. */
function Item({ icon, label, rail, active, badge, hover = "group-hover:text-orange-500", inkClass = "text-orange-500", href, onClick }: ItemProps) {
  const cls = cn(
    "group flex w-full items-center gap-3 rounded-xl py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
    rail ? "justify-center px-0" : "px-3",
    active && "bg-accent text-foreground",
  );
  const body = (
    <>
      <UiGlyph name={icon} className={cn(ICON_SIZE.sidebar, "transition-colors", active ? inkClass : cn("text-muted-foreground", hover))} />
      {rail ? <span className="sr-only">{label}</span> : <span className="flex-1 truncate text-left">{label}</span>}
      {!rail && badge && <span className="text-[0.75rem] text-muted-foreground">{badge}</span>}
    </>
  );
  return href ? (
    <Link href={href} title={rail ? label : undefined} aria-current={active ? "page" : undefined} onClick={onClick} className={cls}>{body}</Link>
  ) : (
    <button type="button" title={rail ? label : undefined} aria-pressed={active} onClick={onClick} className={cls}>{body}</button>
  );
}

export function SidebarNav({ onNavigate, rail = false }: { onNavigate?: () => void; rail?: boolean }) {
  const ui = useUi();
  const pathname = usePathname();
  const onList = pathname === "/ui";
  const [catsOpen, setCatsOpen] = useState(true);
  useEffect(() => {
    try {
      setCatsOpen(window.localStorage.getItem(CATS_KEY) !== "0");
    } catch {
      /* storage can be blocked, the section then stays open */
    }
  }, []);
  const toggleCats = () => {
    setCatsOpen((open) => {
      try {
        window.localStorage.setItem(CATS_KEY, open ? "0" : "1");
      } catch {
        /* the choice then lasts until reload */
      }
      return !open;
    });
  };

  const domainCounts = new Map<string, number>();
  for (const g of GLYPHS) domainCounts.set(g.domain, (domainCounts.get(g.domain) ?? 0) + 1);
  const domains = DOMAINS.filter((d) => domainCounts.has(d.id));
  const newCount = GLYPHS.filter((g) => g.isNew).length;
  const allActive = onList && ui.set === "all" && ui.category === "All" && !ui.onlyFavorites;
  const go = (apply: () => void) => () => {
    onNavigate?.();
    ui.runOnList(apply);
  };

  return (
    <>
      <Item icon="layout-grid" label="All icons" rail={rail} badge={String(GLYPHS.length)} active={allActive} onClick={go(() => { ui.setSet("all"); ui.setCategory("All"); ui.setOnlyFavorites(false); })} />
      <Item icon="heart" label="Favorites" rail={rail} badge={String(ui.favorites.length)} active={onList && ui.onlyFavorites} onClick={go(() => { ui.setSet("all"); ui.setCategory("All"); ui.setOnlyFavorites(true); })} />
      <Item icon="plug" label="Extensions" rail={rail} href="/ui/extensions" active={pathname === "/ui/extensions"} onClick={() => onNavigate?.()} />
      <Item icon="sparkles" label="What is new" rail={rail} href="/ui/changelog" active={pathname === "/ui/changelog"} onClick={() => onNavigate?.()} />

      {rail ? (
        <div className="my-1 h-px bg-border/60" role="separator" />
      ) : (
        <button
          type="button"
          onClick={toggleCats}
          aria-expanded={catsOpen}
          className="mt-3 flex items-center gap-1.5 px-3 text-left text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <UiGlyph name="chevron-down" className={cn("h-4 w-4 transition-transform", !catsOpen && "-rotate-90")} />
          Categories
        </button>
      )}
      {(rail || catsOpen) && (
        <>
          {newCount > 0 && (
            <Item icon="sparkles" label="New" rail={rail} badge={String(newCount)} active={onList && ui.set === "new"} onClick={go(() => { ui.setSet("new"); ui.setCategory("All"); ui.setOnlyFavorites(false); })} />
          )}
          <Item icon="layout-grid" label="All categories" rail={rail} href="/ui/categories" active={pathname === "/ui/categories"} onClick={() => onNavigate?.()} />
          {domains.map((d) => (
            <Item
              key={d.id}
              icon={DOMAIN_ICON[d.id] ?? "layers"}
              label={d.label}
              rail={rail}
              badge={String(domainCounts.get(d.id))}
              hover={TONES[THEMES[d.id]?.tone ?? "orange"].hover}
              inkClass={TONES[THEMES[d.id]?.tone ?? "orange"].ink}
              href={`/ui/category/${d.id}`}
              active={pathname === `/ui/category/${d.id}`}
              onClick={() => onNavigate?.()}
            />
          ))}
        </>
      )}
    </>
  );
}
