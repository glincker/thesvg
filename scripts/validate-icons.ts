/**
 * Icon quality gate (issue #1331).
 *
 * Scans public/icons/<slug>/*.svg and reports files that are broken or not
 * publishable. Exits 1 when any problem is found.
 *
 * Usage:
 *   tsx scripts/validate-icons.ts                 scan every icon
 *   tsx scripts/validate-icons.ts <file...>       scan only the given SVG files
 *   tsx scripts/validate-icons.ts --json          machine readable output
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, basename } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ICONS_DIR = join(ROOT, "public", "icons");
const MAX_BYTES = 50 * 1024;

/**
 * Files allowed to exceed MAX_BYTES. gnu-nano is a dense ASCII-art mark made of
 * thousands of 0.1 unit glyph shapes; rounding coordinates enough to fit the
 * limit visibly degrades it (RMSE 0.21 at precision 1, still 58KB at 2).
 * The embedded PNGs in glincker/wordmark*.svg are the owner's own brand files.
 */
const EXEMPT: Record<string, ReadonlyArray<string>> = {
  size: ["public/icons/gnu-nano/default.svg"],
  raster: [
    "public/icons/glincker/wordmark.svg",
    "public/icons/glincker/wordmark-dark.svg",
    "public/icons/glincker/wordmark-light.svg",
  ],
};

export interface Problem {
  file: string;
  rule: string;
  detail: string;
}

const BAD_LITERAL = /\b(null|undefined|NaN)\b/;
const ATTR_RE = /([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
const EDITOR_RE =
  /sodipodi:|inkscape:|<metadata[\s>]|<sketch:|\bsketch:type|xmlns:serif|serif:id|<i:pgf|xmlns:i=|adobe\s+illustrator|generator:|created with|<!--\s*generator|figma:|xmlns:xlink="[^"]*"[^>]*xmlns:sketch/i;

/** Mono variants are files named mono.svg, *-mono.svg, mono-*.svg. */
export function isMonoVariant(file: string): boolean {
  return /(^|[-_])mono([-_.]|$)/i.test(basename(file));
}

const BLACK = new Set(["#000", "#000000", "black", "rgb(0,0,0)", "rgb(0, 0, 0)"]);
const WHITE = new Set(["#fff", "#ffffff", "white", "rgb(255,255,255)", "rgb(255, 255, 255)"]);
const NEUTRAL = new Set([
  "none",
  "currentcolor",
  "inherit",
  "transparent",
  "context-fill",
  "context-stroke",
]);

function isAllowedMonoPaint(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (NEUTRAL.has(v) || BLACK.has(v)) return true;
  if (/^#0{3,8}$/.test(v)) return true; // #0000, #00000000 etc (alpha variants of black)
  if (/^url\(/.test(v)) return true; // gradient/pattern refs are checked via their stops
  return false;
}

const PAINT_PROPS = ["fill", "stroke", "stop-color", "flood-color", "lighting-color"];

/**
 * White is tolerated only as a knockout detail next to a black/currentColor
 * shape. A mono variant that is white and nothing else is invisible on light
 * backgrounds, so it is reported.
 */
function monoPaints(svg: string): string[] {
  const bad = new Set<string>();
  let white = 0;
  let dark = 0;
  const check = (prop: string, value: string) => {
    const v = value.trim().toLowerCase();
    if (WHITE.has(v)) white++;
    else if (BLACK.has(v) || v === "currentcolor") dark++;
    if (!isAllowedMonoPaint(value) && !WHITE.has(v)) bad.add(`${prop}=${value.trim()}`);
  };
  // SMIL timing elements use fill="freeze"/"remove", which is not a paint.
  const markup = svg.replace(/<(animate\w*|set)\b[^>]*>/gi, "");
  for (const m of markup.matchAll(ATTR_RE)) {
    const name = m[1] ?? "";
    const value = m[3] ?? m[4] ?? "";
    if (PAINT_PROPS.includes(name)) check(name, value);
    if (name === "style") scanDeclarations(value, check);
  }
  for (const m of svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const block of (m[1] ?? "").matchAll(/\{([^}]*)\}/g)) {
      scanDeclarations(block[1] ?? "", check);
    }
  }
  if (white > 0 && dark === 0 && !/<(path|circle|rect|polygon|ellipse)\b(?![^>]*\bfill\b)[^>]*>/i.test(svg)) {
    bad.add("white-only paint");
  }
  return [...bad];
}

function scanDeclarations(css: string, check: (prop: string, value: string) => void): void {
  for (const m of css.matchAll(/([\w-]+)\s*:\s*([^;}]+)/g)) {
    const prop = m[1] ?? "";
    if (PAINT_PROPS.includes(prop)) check(prop, m[2] ?? "");
  }
}

export function validateSvg(file: string, svg: string, bytes: number): Problem[] {
  const out: Problem[] = [];
  const add = (rule: string, detail: string) => out.push({ file, rule, detail });

  if (bytes > MAX_BYTES) add("size", `${bytes} bytes (limit ${MAX_BYTES})`);
  if (!/<svg[\s>]/i.test(svg)) {
    add("no-svg-root", "missing <svg> root element");
    return out;
  }

  // Literal null/undefined/NaN in attribute values (including style attributes)
  const badAttrs = new Set<string>();
  for (const m of svg.matchAll(ATTR_RE)) {
    const value = m[3] ?? m[4] ?? "";
    if (BAD_LITERAL.test(value)) badAttrs.add(`${m[1]}="${value.slice(0, 40)}"`);
  }
  for (const m of svg.matchAll(/=\s*(null|undefined|NaN)\b/g)) badAttrs.add(m[0]);
  if (badAttrs.size) add("bad-literal", [...badAttrs].slice(0, 3).join(", "));

  const rootTag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  if (!/\bviewBox\s*=\s*["'][^"']+["']/i.test(rootTag)) add("no-viewbox", "missing viewBox on <svg>");

  // Empty paths
  const emptyPaths = [...svg.matchAll(/<path\b[^>]*>/gi)].filter((m) => {
    const d = m[0].match(/\sd\s*=\s*(?:"([^"]*)"|'([^']*)')/);
    return !d || !(d[1] ?? d[2] ?? "").trim();
  });
  if (emptyPaths.length) add("empty-path", `${emptyPaths.length} <path> without data`);
  if (!/<(path|circle|ellipse|rect|polygon|polyline|line|text|use|image)\b/i.test(svg)) {
    add("no-shapes", "no drawable elements");
  }

  // Duplicate ids
  const seen = new Map<string, number>();
  for (const m of svg.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const id = m[1] ?? m[2] ?? "";
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const dups = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  if (dups.length) add("duplicate-id", dups.slice(0, 5).join(", "));

  const editor = svg.match(EDITOR_RE);
  if (editor) add("editor-metadata", editor[0].trim());

  if (/<script\b/i.test(svg)) add("script", "contains <script>");
  if (/\son(load|click|error|mouse\w*|focus|key\w*|submit)\s*=/i.test(svg)) add("event-handler", "inline event handler");
  if (/data:image\//i.test(svg)) add("raster", "embedded raster data");

  if (isMonoVariant(file)) {
    const paints = monoPaints(svg);
    if (paints.length) add("mono-not-mono", paints.slice(0, 4).join(", "));
  }
  return out.filter((p) => !EXEMPT[p.rule]?.includes(p.file));
}

function listSvgs(): string[] {
  const files: string[] = [];
  for (const slug of readdirSync(ICONS_DIR)) {
    const dir = join(ICONS_DIR, slug);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) if (f.endsWith(".svg")) files.push(join(dir, f));
  }
  return files.sort();
}

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const explicit = args.filter((a) => !a.startsWith("--")).map((a) => resolve(a));
  const files = explicit.length ? explicit.filter((f) => f.endsWith(".svg")) : listSvgs();

  const problems: Problem[] = [];
  for (const abs of files) {
    const rel = relative(ROOT, abs);
    let svg: string;
    try {
      svg = readFileSync(abs, "utf8");
    } catch {
      continue; // deleted file in a diff
    }
    problems.push(...validateSvg(rel, svg, Buffer.byteLength(svg)));
  }

  if (json) {
    process.stdout.write(JSON.stringify(problems, null, 2) + "\n");
  } else {
    for (const p of problems) process.stderr.write(`${p.file}: [${p.rule}] ${p.detail}\n`);
    const byRule = new Map<string, number>();
    for (const p of problems) byRule.set(p.rule, (byRule.get(p.rule) ?? 0) + 1);
    const summary = [...byRule].map(([r, n]) => `${r}=${n}`).join(" ");
    process.stderr.write(`scanned ${files.length} SVGs, ${problems.length} problem(s)${summary ? ` (${summary})` : ""}\n`);
  }
  process.exit(problems.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
