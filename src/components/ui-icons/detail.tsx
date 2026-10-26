"use client";

import { renderIcon } from "@/lib/ui-icons/engine";
import { DownloadMenu } from "@/components/icons/detail/download-menu";
import { OpenInEditorMenu } from "@/components/icons/detail/open-in-editor-menu";
import { Check, ChevronDown, ChevronRight, Copy, Grid3x3, Heart, Moon, Sun, Waypoints, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GLYPHS, VARIANTS, styleFor, type Glyph as GlyphData } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { CodeBlock } from "./code-block";
import { Glyph, svgText } from "./glyph";
import { InContext } from "./in-context";
import { StyleLab, StylePill } from "./lab";
import { useUi } from "./ui-state";

const SIZES = [16, 20, 24, 32, 48] as const;
const VB = 24;
const ZOOMS = [24, 48, 96, 160, "fit"] as const;


function useCopy(): [string | null, (key: string, text: string) => void] {
  const [done, setDone] = useState<string | null>(null);
  return [done, (key, text) => {
    navigator.clipboard.writeText(text).then(() => { setDone(key); window.setTimeout(() => setDone(null), 1400); }).catch(() => setDone(null));
  }];
}

function Section(props: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{props.title}</h2>
        {props.aside && <span className="text-[11px] text-muted-foreground">{props.aside}</span>}
      </div>
      {props.children}
    </section>
  );
}

/** The preview card. It leans towards the pointer, and the glyph floats above the card. */
function Preview(props: { glyph: GlyphData }) {
  const ui = useUi();
  const id = useId().replace(/:/g, "");
  const card = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState(false);
  const [anchors, setAnchors] = useState(false);
  const [light, setLight] = useState(false);
  // Icons are drawn for 16 to 48px, so the preview opens at a realistic size and only the construction
  // view (grid, anchors) blows it up to fill the card.
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(96);
  const fit = grid || anchors || zoom === "fit";
  const px = fit ? 320 : zoom;
  const res = useMemo(
    () => renderIcon(props.glyph.nodes, { variant: ui.variant, style: { ...styleFor(ui.variant, ui.lab), accent: ui.accent }, size: px, idPrefix: id }),
    [props.glyph.nodes, ui.variant, ui.lab, ui.accent, px, id],
  );
  const lines = Array.from({ length: VB + 1 }, (_, i) => i);
  const tilt = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 12).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
  };
  const rest = () => { card.current?.style.setProperty("--rx", "0deg"); card.current?.style.setProperty("--ry", "0deg"); };
  return (
    <div className="flex flex-col gap-2">
      <div className="[perspective:1000px]">
        <div
          ref={card}
          onPointerMove={tilt}
          onPointerLeave={rest}
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-3xl border transition-transform duration-150 ease-out [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:transform-none",
            light ? "bg-zinc-100 text-zinc-900" : "bg-gradient-to-b from-foreground/[0.07] to-transparent text-foreground",
          )}
        >
          {grid && (
            <svg viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 size-full opacity-30">
              <g stroke="currentColor" strokeWidth={0.04}>
                {lines.map((i) => (
                  <g key={i} opacity={i % 4 === 0 ? 1 : 0.45}>
                    <line x1={i} y1={0} x2={i} y2={VB} />
                    <line x1={0} y1={i} x2={VB} y2={i} />
                  </g>
                ))}
              </g>
              <rect x={2} y={2} width={20} height={20} fill="none" className="stroke-orange-500" strokeWidth={0.07} />
              <circle cx={12} cy={12} r={10} fill="none" className="stroke-orange-500" strokeWidth={0.05} />
            </svg>
          )}
          <span className={cn("ink absolute inset-0 grid place-items-center [transform:translateZ(46px)] transition-[transform] duration-200", fit && "[&_svg]:size-[78%]")} dangerouslySetInnerHTML={{ __html: res.svg }} />
          {anchors && (
            <svg viewBox={`0 0 ${VB} ${VB}`} className="pointer-events-none absolute inset-0 size-full [transform:translateZ(60px)]">
              {res.handles.map(([a, b], i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-fuchsia-400" strokeWidth={0.05} />)}
              {res.anchors.map((p, i) => <rect key={i} x={p.x - 0.2} y={p.y - 0.2} width={0.4} height={0.4} className="fill-sky-400 stroke-background" strokeWidth={0.05} />)}
            </svg>
          )}
          <button
            type="button"
            aria-label={ui.favorites.includes(props.glyph.slug) ? "Remove favorite" : "Add favorite"}
            onClick={() => ui.toggleFavorite(props.glyph.slug)}
            className="glass absolute left-3 top-3 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground [transform:translateZ(30px)]"
          >
            <Heart className={cn("size-3.5", ui.favorites.includes(props.glyph.slug) && "fill-orange-500 text-orange-500")} />
          </button>
          <span className="glass absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-muted-foreground [transform:translateZ(30px)]">
            <span className={cn("size-2 rounded-full", ui.accent ? "" : "bg-foreground")} ref={(el) => { el?.style.setProperty("background-color", ui.accent || ""); }} />
            {ui.accent || "currentColor"}
          </span>
          <span className="glass absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] capitalize text-foreground [transform:translateZ(30px)]">{ui.variant} · {fit ? "fit" : `${px}px`}</span>
          <button
            type="button"
            aria-label={zoom === "fit" ? "Back to real size" : "Zoom to fit"}
            onClick={() => { setZoom(zoom === "fit" ? 96 : "fit"); setGrid(false); setAnchors(false); }}
            className="glass absolute bottom-3 right-3 grid size-8 place-items-center rounded-full text-orange-500 transition-colors hover:text-orange-400 [transform:translateZ(30px)]"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-xl border bg-background/40 p-0.5" role="group" aria-label="Preview size">
        {ZOOMS.map((z) => (
          <button key={z} type="button" onClick={() => { setZoom(z); setGrid(false); setAnchors(false); }} className={cn("h-7 flex-1 rounded-lg text-xs capitalize text-muted-foreground transition-colors hover:text-foreground", !grid && !anchors && zoom === z && "bg-foreground text-background hover:text-background")}>
            {z === "fit" ? "Fit" : z}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {([[grid, setGrid, "Grid", Grid3x3], [anchors, setAnchors, "Anchors", Waypoints]] as const).map(([on, set, label, Icon]) => (
          <button key={label} type="button" onClick={() => set(!on)} className={cn("inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs text-muted-foreground transition-colors hover:text-foreground", on && "border-orange-500/40 text-orange-400")}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
        <button type="button" aria-label="Toggle light canvas" onClick={() => setLight(!light)} className="grid h-8 w-9 place-items-center rounded-xl border text-muted-foreground transition-colors hover:text-foreground">
          {light ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function LookPicker(props: { glyph: GlyphData }) {
  const ui = useUi();
  const wrap = useRef<HTMLDivElement>(null);
  const tiles = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // One ring that slides to the chosen tile, so a pick reads as motion and not a jump.
  useLayoutEffect(() => {
    const place = () => {
      const el = tiles.current[ui.variant];
      const host = wrap.current;
      if (el && host) setBox({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    };
    place();
    const ro = new ResizeObserver(place);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [ui.variant]);

  return (
    <div ref={wrap} className="relative grid grid-cols-4 gap-2 sm:grid-cols-7">
      {box && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 rounded-2xl ring-2 ring-orange-500/70 shadow-[0_0_28px_-8px_rgba(249,115,22,0.55)] transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: box.w, height: box.h, transform: `translate(${box.x}px, ${box.y}px)` }}
        />
      )}
      {VARIANTS.map((v) => (
        <button
          key={v}
          ref={(el) => { tiles.current[v] = el; }}
          type="button"
          onClick={() => ui.setVariant(v)}
          className="glass group/tile relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl p-1.5 pb-2 transition-shadow duration-200"
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-0 transition-opacity duration-300 [background:radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(249,115,22,0.22),transparent_72%)] group-hover/tile:opacity-100" />
          <span className="relative grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-b from-foreground/[0.07] to-transparent">
            <Glyph nodes={props.glyph.nodes} variant={v} size={30} accent={ui.accent} className={cn("text-foreground transition-transform duration-300 group-hover/tile:scale-110", ui.variant === v && "scale-110")} />
          </span>
          <span className={cn("relative text-[10px] capitalize", ui.variant === v ? "font-medium text-foreground" : "text-muted-foreground")}>{v}</span>
        </button>
      ))}
    </div>
  );
}

/** Like the completeness card on a brand page: which looks this glyph draws fully, and where it falls back. */
function Coverage({ glyph }: { glyph: GlyphData }) {
  const [open, setOpen] = useState(false);
  const lineOnly = useMemo(() => renderIcon(glyph.nodes, { variant: "fill" }).meta.fallback, [glyph.nodes]);
  const full = lineOnly ? 4 : VARIANTS.length;
  return (
    <div className="glass rounded-2xl">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs">
        <span className="font-medium">Looks</span>
        <span className="ml-auto text-muted-foreground">{full}/{VARIANTS.length}</span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <p className="border-t px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          {lineOnly
            ? "This is a line-only glyph, so fill, glass and depth use a heavier outline. Outline, duotone, offset and pixel draw it fully."
            : "Every look draws this glyph fully."}
        </p>
      )}
    </div>
  );
}

function CommandRow(props: { tag: string; text: string }) {
  const [done, copy] = useCopy();
  return (
    <div className="glass flex min-w-0 items-center gap-3 rounded-xl px-3 py-2">
      <span className="shrink-0 rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">{props.tag}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">{props.text}</code>
      <button type="button" aria-label={`Copy ${props.tag}`} onClick={() => copy(props.tag, props.text)} className="text-muted-foreground transition-colors hover:text-foreground">
        {done === props.tag ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export function Detail({ glyph }: { glyph: GlyphData }) {
  const ui = useUi();
  const [done, copy] = useCopy();
  const { setSample } = ui;
  useEffect(() => {
    setSample(glyph.slug);
    return () => setSample(null);
  }, [glyph.slug, setSample]);
  const svg = svgText(glyph.nodes, ui.variant, 24, ui.accent, ui.lab);
  const tint = ui.accent || "#111111";
  const related = GLYPHS.filter((g) => g.category === glyph.category && g.slug !== glyph.slug).slice(0, 10);
  const title = glyph.slug.replace(/-/g, " ");

  return (
    <div className="relative mx-auto flex w-full max-w-[1240px] flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/ui" className="hover:text-foreground">UI icons</Link>
        <ChevronRight className="size-3" />
        <button type="button" onClick={() => ui.runOnList(() => { ui.setCategory(glyph.category); ui.setSet("all"); ui.setQuery(""); })} className="hover:text-foreground">{glyph.category}</button>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{glyph.slug}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <aside className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:sticky lg:top-[4.4rem] lg:flex lg:flex-col lg:self-start">
          <div className="mx-auto w-full max-w-[260px] sm:mx-0 sm:max-w-none">
            <Preview glyph={glyph} />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <dl className="glass grid grid-cols-2 gap-y-2.5 rounded-2xl p-4 text-xs">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grid</dt><dd className="text-right">24 by 24</dd>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Looks</dt><dd className="text-right">{VARIANTS.length}</dd>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</dt><dd className="text-right">{glyph.category}</dd>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Color</dt><dd className="text-right">currentColor</dd>
            </dl>
            <Coverage glyph={glyph} />
            <div className="glass flex flex-wrap gap-1.5 rounded-2xl p-4">
              {glyph.tags.slice(0, 8).map((t) => <span key={t} className="rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>)}
              {glyph.tags.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold capitalize tracking-tight">{title}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{glyph.slug} · {glyph.category} UI icon</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => copy("svg", svg)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                {done === "svg" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />} {done === "svg" ? "Copied" : "Copy SVG"}
              </button>
              <OpenInEditorMenu svg={svg} title={title} slug={glyph.slug} />
              <DownloadMenu
                svgContent={svg}
                rasterSvg={svg.replace(/currentColor/g, tint)}
                rasterNote={ui.accent ? "Raster uses your picked color." : "Raster uses near black. Pick a color above to change it."}
                currentPath=""
                slug={glyph.slug}
                title={title}
                activeVariant={ui.variant}
              />
            </div>
          </header>

          <Section title="Looks" aside="pick one, everything below follows">
            <LookPicker glyph={glyph} />
          </Section>

          <Section title="Style" aside="saved in the page link">
            <StyleLab className="glass" />
            <StylePill />
          </Section>

          <div className="grid min-w-0 grid-cols-1 gap-2">
            <CommandRow tag="CLI" text={`npx @thesvg/cli add ui:${glyph.slug}${ui.variant === "outline" ? "" : ` --look ${ui.variant}`}`} />
            <CommandRow tag="CDN" text={`thesvg.org/ui/${glyph.slug}/${ui.variant}.svg`} />
          </div>

          <CodeBlock svg={svg} slug={glyph.slug} />

          <Section title="In context" aside="hover, focus, press and toggle all work">
            <InContext glyph={glyph} />
          </Section>

          <Section title="Optical sizes">
            <div className="flex items-end gap-6 rounded-2xl border bg-card/60 p-5">
              {SIZES.map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <Glyph nodes={glyph.nodes} variant={ui.variant} size={s} accent={ui.accent} className="text-foreground" />
                  <span className="text-[10px] text-muted-foreground">{s}px</span>
                </div>
              ))}
            </div>
          </Section>

          {related.length > 0 && (
            <Section title={`More in ${glyph.category}`}>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {related.map((g) => (
                  <Link key={g.slug} href={`/ui/${g.slug}`} title={g.slug} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card/60 p-2.5 transition-colors hover:border-foreground/25">
                    <Glyph nodes={g.nodes} variant={ui.variant} size={30} accent={ui.accent} className="text-foreground" />
                    <span className="w-full truncate text-center text-[9px] text-muted-foreground">{g.slug}</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <section className="rounded-2xl border bg-card/40 p-5 text-sm leading-relaxed text-muted-foreground">
            <h2 className="mb-2 text-sm font-semibold text-foreground">About the {title} icon</h2>
            <p>
              The {title} icon is a {glyph.category.toLowerCase()} UI icon drawn on a 24 by 24 grid and available in {VARIANTS.length} looks: outline, glass, duotone, offset, fill, pixel and depth. It uses currentColor, so it takes the text color around it, and every look can be copied as SVG, React, Vue, Svelte, HTML or a CSS mask.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
