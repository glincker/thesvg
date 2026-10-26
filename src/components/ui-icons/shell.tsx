"use client";

import { Heart, LayoutGrid, Shapes, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GLYPHS, GLYPH_BY_SLUG, VARIANTS, VIEW_SETS } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph } from "./glyph";
import { useUi } from "./ui-state";

function NavItem(props: { icon: React.ReactNode; label: string; active?: boolean; badge?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        props.active && "bg-accent text-foreground",
      )}
    >
      {props.icon}
      <span className="flex-1 text-left">{props.label}</span>
      {props.badge && <span className="text-[10px] text-muted-foreground">{props.badge}</span>}
    </button>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const ui = useUi();
  const pathname = usePathname();
  const onList = pathname === "/ui";
  const sample = GLYPH_BY_SLUG.get(ui.sample ?? "") ?? GLYPH_BY_SLUG.get("shield-check");
  // Daily drops pile up, so they are one entry here. The What is new page lists every drop on its own.
  const sidebarSets = (() => {
    const real = VIEW_SETS.filter((st) => st.count > 0);
    const drops = real.filter((st) => st.id.startsWith("drop-"));
    const rest = real.filter((st) => !st.id.startsWith("drop-"));
    const label = (st: (typeof real)[number]): string => (st.isNew ? `New · ${st.count}` : st.released ? String(st.count) : `Draft · ${st.count}`);
    const out = rest.map((st) => ({ id: st.id, name: st.name, badge: label(st) }));
    if (drops.length) out.splice(Math.max(0, out.findIndex((x) => x.id === "backlog")), 0, { id: "drops", name: "Daily drops", badge: `${drops.reduce((n, d) => n + d.count, 0)}` });
    return out;
  })();
  return (
    <>
      <NavItem icon={<LayoutGrid className="size-4" />} label="All icons" badge={String(GLYPHS.length)} active={onList && ui.set === "all" && !ui.onlyFavorites} onClick={() => { onNavigate?.(); ui.runOnList(() => { ui.setCategory("All"); ui.setSet("all"); ui.setOnlyFavorites(false); ui.setQuery(""); }); }} />
      <NavItem icon={<Heart className="size-4" />} label="Favorites" badge={String(ui.favorites.length)} active={onList && ui.onlyFavorites} onClick={() => { onNavigate?.(); ui.runOnList(() => ui.setOnlyFavorites(onList ? !ui.onlyFavorites : true)); }} />
      <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Looks</p>
      {VARIANTS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => { ui.setVariant(v); onNavigate?.(); }}
          className={cn("flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm capitalize text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", ui.variant === v && "bg-accent text-foreground")}
        >
          {sample && <Glyph nodes={sample.nodes} variant={v} size={20} accent={ui.accent} className="text-foreground" />}
          {v}
        </button>
      ))}
      <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sets</p>
      {sidebarSets.map((st) => (
        <NavItem
          key={st.id}
          icon={<Shapes className="size-4" />}
          label={st.name}
          badge={st.badge}
          active={onList && (st.id === "drops" ? ui.set.startsWith("drop-") || ui.set === "drops" : ui.set === st.id)}
          onClick={() => { onNavigate?.(); ui.runOnList(() => { ui.setSet(st.id); ui.setOnlyFavorites(false); }); }}
        />
      ))}
      <Link href="/ui/changelog" onClick={() => onNavigate?.()} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <Sparkles className="size-4" /> <span className="flex-1">What is new</span>
      </Link>
    </>
  );
}
