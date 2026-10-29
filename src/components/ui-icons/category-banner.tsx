"use client";

import { useMemo } from "react";
import { UiGlyph } from "@/components/ui-glyph";
import { DOMAINS, GLYPHS, type Glyph as GlyphData } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph } from "./glyph";
import { useUi } from "./ui-state";

// Tailwind only sees whole class names, so every tone spells its classes out.
const TONES = {
  violet: { glow: "from-violet-500/20", ink: "text-violet-400", chip: "border-violet-500/25 bg-violet-500/10 text-violet-400" },
  sky: { glow: "from-sky-500/20", ink: "text-sky-400", chip: "border-sky-500/25 bg-sky-500/10 text-sky-400" },
  emerald: { glow: "from-emerald-500/20", ink: "text-emerald-400", chip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" },
  amber: { glow: "from-amber-500/20", ink: "text-amber-400", chip: "border-amber-500/25 bg-amber-500/10 text-amber-400" },
  blue: { glow: "from-blue-500/20", ink: "text-blue-400", chip: "border-blue-500/25 bg-blue-500/10 text-blue-400" },
  lime: { glow: "from-lime-500/20", ink: "text-lime-400", chip: "border-lime-500/25 bg-lime-500/10 text-lime-400" },
  rose: { glow: "from-rose-500/20", ink: "text-rose-400", chip: "border-rose-500/25 bg-rose-500/10 text-rose-400" },
  fuchsia: { glow: "from-fuchsia-500/20", ink: "text-fuchsia-400", chip: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-400" },
  orange: { glow: "from-orange-500/20", ink: "text-orange-400", chip: "border-orange-500/25 bg-orange-500/10 text-orange-400" },
  teal: { glow: "from-teal-500/20", ink: "text-teal-400", chip: "border-teal-500/25 bg-teal-500/10 text-teal-400" },
  indigo: { glow: "from-indigo-500/25", ink: "text-indigo-400", chip: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400" },
  cyan: { glow: "from-cyan-500/20", ink: "text-cyan-400", chip: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400" },
  green: { glow: "from-green-500/20", ink: "text-green-400", chip: "border-green-500/25 bg-green-500/10 text-green-400" },
  pink: { glow: "from-pink-500/20", ink: "text-pink-400", chip: "border-pink-500/25 bg-pink-500/10 text-pink-400" },
  red: { glow: "from-red-500/20", ink: "text-red-400", chip: "border-red-500/25 bg-red-500/10 text-red-400" },
  yellow: { glow: "from-yellow-500/20", ink: "text-yellow-400", chip: "border-yellow-500/25 bg-yellow-500/10 text-yellow-400" },
} as const;

type Motif = "hero" | "wall" | "rows" | "stack" | "scatter" | "line";

interface Theme {
  tone: keyof typeof TONES;
  motif: Motif;
  icon: string;
  tagline: string;
}

const THEMES: Record<string, Theme> = {
  interface: { tone: "violet", motif: "wall", icon: "sliders-horizontal", tagline: "Controls, toggles and the small marks every screen needs." },
  arrows: { tone: "sky", motif: "line", icon: "arrow-up-right", tagline: "Direction, motion and flow, from chevrons to transfers." },
  status: { tone: "emerald", motif: "rows", icon: "circle-check", tagline: "Success, warning, loading and everything in between." },
  files: { tone: "amber", motif: "stack", icon: "file", tagline: "Documents, folders and the things you save." },
  communication: { tone: "blue", motif: "stack", icon: "message-square", tagline: "Messages, mail and signals between people and systems." },
  dev: { tone: "lime", motif: "wall", icon: "code", tagline: "Code, git, containers and the plumbing of software." },
  security: { tone: "rose", motif: "hero", icon: "shield", tagline: "Locks, shields, keys and identity." },
  media: { tone: "fuchsia", motif: "rows", icon: "play", tagline: "Play, record, capture and create." },
  people: { tone: "orange", motif: "stack", icon: "user", tagline: "Users, teams, hands and handoffs." },
  commerce: { tone: "teal", motif: "scatter", icon: "shopping-cart", tagline: "Carts, cards, coins and tickets." },
  layout: { tone: "indigo", motif: "wall", icon: "layout-dashboard", tagline: "Panels, grids, lists and the structure of a page." },
  time: { tone: "cyan", motif: "line", icon: "clock", tagline: "Clocks, calendars and schedules." },
  tools: { tone: "yellow", motif: "scatter", icon: "wrench", tagline: "Wrenches, pens and the controls that shape things." },
  nature: { tone: "green", motif: "scatter", icon: "sun", tagline: "Sun, weather, fire and growth." },
  devices: { tone: "violet", motif: "rows", icon: "smartphone", tagline: "Phones, ports, sensors and the hardware around you." },
  shapes: { tone: "pink", motif: "wall", icon: "diamond", tagline: "Primitives for diagrams and decoration." },
  places: { tone: "red", motif: "scatter", icon: "map", tagline: "Maps, routes, buildings and ways to get there." },
  data: { tone: "blue", motif: "line", icon: "chart-line", tagline: "Charts, trends and the shape of numbers." },
  space: { tone: "indigo", motif: "hero", icon: "orbit", tagline: "Orbits, launch, telemetry and everything beyond the atmosphere." },
  robotics: { tone: "orange", motif: "hero", icon: "joint", tagline: "Arms, joints, sensors and machines that move." },
  agents: { tone: "violet", motif: "hero", icon: "bot", tagline: "Tools, memory, plans and guardrails for AI agents." },
  general: { tone: "sky", motif: "scatter", icon: "star", tagline: "Everything that does not fit a box." },
};

/** Signature icons shown first in each banner, so it leads with what the category is about. The rest fill in by craft score. */
const FEATURED: Record<string, string[]> = {
  space: ["orbit", "satellite", "rocket", "telescope", "lander", "antenna", "comet", "galaxy"],
  robotics: ["rover", "drone", "gripper", "joint", "quadruped", "servo", "lidar", "end-effector"],
  agents: ["bot", "brain-circuit", "prompt", "tool-call", "memory-save", "multi-agent", "guardrail"],
  security: ["shield-check", "lock", "key", "fingerprint-pattern", "vault", "eye", "shield"],
  dev: ["git-branch", "terminal", "database", "server", "cpu", "code", "package", "plug"],
  files: ["file", "folder", "archive", "clipboard", "book-open", "save"],
  communication: ["mail", "message-square", "send", "megaphone", "radio", "messages-square"],
  data: ["chart-line", "gauge", "activity", "trending-up", "chart-column", "radar"],
  status: ["circle-check", "circle-x", "bell", "flag", "info", "loader", "siren"],
  time: ["clock", "calendar", "calendar-check", "alarm-clock", "timer", "calendar-clock"],
  media: ["play", "pause", "camera", "image", "headphones", "palette"],
  people: ["user", "users", "handshake", "thumbs-up", "user-check", "hand"],
  commerce: ["shopping-cart", "credit-card", "coins", "tag", "gift", "piggy-bank"],
  nature: ["sun", "moon", "flame", "sparkles", "droplets", "wind", "snowflake"],
  devices: ["smartphone", "monitor", "mouse", "usb", "printer", "wifi-high", "bluetooth"],
  tools: ["wrench", "hammer", "pencil", "scissors", "settings", "sliders-horizontal", "toolbox"],
  layout: ["layout-dashboard", "layout-grid", "panel-left", "list", "columns-2", "app-window"],
  arrows: ["arrow-up-right", "chevron-right", "refresh-cw", "external-link", "rotate-cw", "arrow-left-right", "repeat"],
  places: ["house", "map", "compass", "pin", "signpost", "route"],
  shapes: ["circle", "square", "diamond", "infinity", "target", "shapes"],
};

/** Fixed offsets keep the scatter motif in plain Tailwind classes, no inline styles. */
const SCATTER_OFFSET = ["translate-y-0", "translate-y-5", "-translate-y-2", "translate-y-8", "translate-y-2", "-translate-y-1", "translate-y-6", "translate-y-1"];

export function CategoryBanner({ category }: { category: string }) {
  const ui = useUi();
  const domain = DOMAINS.find((d) => d.label === category);
  const theme = domain ? THEMES[domain.id] : undefined;
  const { items, total, fresh } = useMemo(() => {
    const all = domain ? GLYPHS.filter((g) => g.domain === domain.id) : [];
    const order = FEATURED[domain?.id ?? ""] ?? [];
    const rank = (g: GlyphData): number => { const i = order.indexOf(g.slug); return i === -1 ? order.length : i; };
    const best = [...all].sort((a, b) => rank(a) - rank(b) || (b.quality?.score ?? 0) - (a.quality?.score ?? 0) || a.slug.localeCompare(b.slug));
    return { items: best.slice(0, 12), total: all.length, fresh: all.filter((g) => g.isNew).length };
  }, [domain]);
  if (!domain || !theme) return null;
  const tone = TONES[theme.tone];

  const tile = (g: GlyphData, size: number, box: string) => (
    <span key={g.slug} title={g.slug} className={cn("grid place-items-center rounded-2xl border bg-background/60 backdrop-blur", box)}>
      <Glyph nodes={g.nodes} variant={ui.variant} size={size} accent={ui.accent} className={tone.ink} />
    </span>
  );

  const art = (() => {
    switch (theme.motif) {
      case "hero":
        return (
          <div className="flex items-center gap-4">
            {items[0] && tile(items[0], 72, "size-32")}
            <div className="grid grid-cols-3 gap-2">{items.slice(1, 7).map((g) => tile(g, 28, "size-14"))}</div>
          </div>
        );
      case "wall":
        return <div className="grid -rotate-3 grid-cols-6 gap-2">{items.slice(0, 12).map((g) => tile(g, 28, "size-14"))}</div>;
      case "rows":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">{items.slice(0, 6).map((g) => tile(g, 28, "size-14"))}</div>
            <div className="flex translate-x-7 gap-2">{items.slice(6, 12).map((g) => tile(g, 28, "size-14"))}</div>
          </div>
        );
      case "stack":
        return <div className="flex -space-x-5">{items.slice(0, 6).map((g, i) => tile(g, 36, cn("size-20 shadow-lg", i % 2 ? "translate-y-3" : "-translate-y-1")))}</div>;
      case "scatter":
        return <div className="flex items-start gap-3">{items.slice(0, 8).map((g, i) => tile(g, 28, cn("size-14", SCATTER_OFFSET[i % SCATTER_OFFSET.length])))}</div>;
      case "line":
        return (
          <div className="flex items-center gap-2">
            {items.slice(0, 7).map((g, i) => (
              <span key={g.slug} className="flex items-center gap-2">
                {tile(g, 32, "size-16")}
                {i < 6 && <span className={cn("h-px w-4 bg-current opacity-40", tone.ink)} />}
              </span>
            ))}
          </div>
        );
    }
  })();

  return (
    <section className={cn("relative overflow-hidden rounded-3xl border bg-gradient-to-br via-transparent to-transparent p-6", tone.glow)}>
      <div className="relative grid items-center gap-6 xl:grid-cols-[minmax(0,24rem)_1fr]">
        <div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", tone.chip)}>
            <UiGlyph name={theme.icon} className="size-4" /> {total} icons{fresh > 0 ? `, ${fresh} new` : ""}
          </span>
          <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight md:text-3xl">{domain.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{theme.tagline}</p>
        </div>
        <div className="min-w-0 overflow-hidden pb-6 xl:justify-self-end">{art}</div>
      </div>
    </section>
  );
}
