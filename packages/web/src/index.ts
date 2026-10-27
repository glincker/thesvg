/**
 * @thesvg/web: framework-free helpers that turn @thesvg/icons modules into inline SVG.
 * Icons are passed in by the caller, so bundlers only keep the icons you import.
 */

/** Structural subset of an @thesvg/icons module, so this package needs no runtime import of it. */
export interface WebIcon {
  slug?: string;
  title?: string;
  svg: string;
  variants?: Record<string, string>;
}

/** Icons keyed by name, e.g. `{ github }` from `import { github } from "@thesvg/icons"`. */
export type IconSet = Record<string, WebIcon>;

export interface IconSvgOptions {
  /** Icon set to look the name up in. Not needed when the first argument is an icon module. */
  icons?: IconSet;
  /** Variant name such as "mono" or "dark". Falls back to the default svg. */
  variant?: string;
  /** Sets width and height on the root svg. */
  size?: number | string;
  /** Sets the class attribute on the root svg. */
  className?: string;
  /** Adds role="img" and an aria-label. Without a title, aria-label or aria-labelledby the svg is aria-hidden. */
  title?: string;
  /** Extra attributes for the root svg. A null value removes the attribute. */
  attrs?: Record<string, string | number | null>;
}

export interface CreateIconsOptions {
  icons: IconSet;
  /** Attribute that holds the icon name. */
  nameAttr?: string;
  /** Element or document to scan. */
  root?: ParentNode;
}

const SVG_OPEN = /<svg\b[^>]*>/i;

// Module-level so every returned svg gets a fresh prefix, even across calls in one document.
let idCounter = 0;

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Prefixes every id and each reference to it (url(#), href, aria id lists, style selectors). */
function uniquifyIds(svg: string): string {
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const id = m[1] ?? m[2];
    if (id) ids.add(id);
  }
  if (ids.size === 0) return svg;
  const prefix = `thesvg-${++idCounter}-`;
  const alt = Array.from(ids)
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join("|");
  let out = svg;
  out = out.replace(/(\sid\s*=\s*)(["'])([^"']*)\2/gi, (all, head: string, q: string, id: string) =>
    ids.has(id) ? `${head}${q}${prefix}${id}${q}` : all,
  );
  out = out.replace(
    new RegExp(`url\\(\\s*(["']?)#(${alt})\\1\\s*\\)`, "g"),
    (_, q: string, id: string) => `url(${q}#${prefix}${id}${q})`,
  );
  out = out.replace(
    new RegExp(`((?:xlink:)?href\\s*=\\s*)(["'])#(${alt})\\2`, "gi"),
    (_, head: string, q: string, id: string) => `${head}${q}#${prefix}${id}${q}`,
  );
  out = out.replace(
    /(\saria-(?:labelledby|describedby|controls|owns|flowto|activedescendant|details)\s*=\s*)(["'])([^"']*)\2/gi,
    (_, head: string, q: string, list: string) =>
      `${head}${q}${list
        .split(/\s+/)
        .map((t) => (ids.has(t) ? prefix + t : t))
        .join(" ")}${q}`,
  );
  out = out.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_, open: string, css: string, close: string) =>
      `${open}${css.replace(new RegExp(`#(${alt})(?![\\w-])`, "g"), (__, id: string) => `#${prefix}${id}`)}${close}`,
  );
  return out;
}

function hasAccessibleName(attrs: IconSvgOptions["attrs"]): boolean {
  if (!attrs) return false;
  return ["aria-label", "aria-labelledby"].some((k) => attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== "");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setAttr(tag: string, name: string, value: string | null): string {
  const existing = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*')`, "i");
  const cleaned = tag.replace(existing, "");
  if (value === null) return cleaned;
  return cleaned.replace(/\/?>$/, (end) => ` ${name}="${escapeAttr(value)}"${end}`);
}

function camelCase(name: string): string {
  return name.replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""));
}

/** Finds an icon by key, slug, or camelCased key. */
export function findIcon(icons: IconSet, name: string): WebIcon | undefined {
  const direct = icons[name];
  if (direct) return direct;
  const camel = icons[camelCase(name)];
  if (camel) return camel;
  const prefixed = icons[`_${name}`];
  if (prefixed) return prefixed;
  for (const key of Object.keys(icons)) {
    if (icons[key]?.slug === name) return icons[key];
  }
  return undefined;
}

/**
 * Returns the SVG markup for an icon, or undefined when the name or variant source is missing.
 * Pass an icon module directly, or a name together with `opts.icons`.
 */
export function getIconSvg(nameOrIcon: string | WebIcon, opts: IconSvgOptions = {}): string | undefined {
  const icon = typeof nameOrIcon === "string" ? (opts.icons ? findIcon(opts.icons, nameOrIcon) : undefined) : nameOrIcon;
  if (!icon) return undefined;
  const source = (opts.variant && icon.variants?.[opts.variant]) || icon.svg;
  if (!source) return undefined;
  const match = SVG_OPEN.exec(source);
  if (!match) return undefined;

  let tag = match[0];
  if (opts.size !== undefined) {
    tag = setAttr(tag, "width", String(opts.size));
    tag = setAttr(tag, "height", String(opts.size));
  }
  if (opts.className) tag = setAttr(tag, "class", opts.className);
  if (opts.title) {
    tag = setAttr(tag, "role", "img");
    tag = setAttr(tag, "aria-label", opts.title);
  } else if (!hasAccessibleName(opts.attrs)) {
    tag = setAttr(tag, "aria-hidden", "true");
  }
  for (const [key, value] of Object.entries(opts.attrs ?? {})) {
    tag = setAttr(tag, key, value === null ? null : String(value));
  }
  return uniquifyIds(source.replace(SVG_OPEN, () => tag)).trim();
}

/**
 * Replaces every element carrying `nameAttr` with its inline SVG. Unknown names are left untouched.
 * Per-element options: `data-thesvg-variant`, `data-thesvg-size`; class and other attributes carry over.
 * Returns the number of elements replaced.
 */
export function createIcons({ icons, nameAttr = "data-thesvg", root = document }: CreateIconsOptions): number {
  const hosts = Array.from(root.querySelectorAll(`[${nameAttr}]`));
  let replaced = 0;
  for (const host of hosts) {
    const name = host.getAttribute(nameAttr);
    if (!name) continue;
    const className = host.getAttribute("class") ?? undefined;
    // A named placeholder must not come out aria-hidden.
    const attrs: Record<string, string> = {};
    for (const key of ["aria-label", "aria-labelledby"]) {
      const v = host.getAttribute(key);
      if (v) attrs[key] = v;
    }
    const markup = getIconSvg(name, {
      icons,
      variant: host.getAttribute(`${nameAttr}-variant`) ?? undefined,
      size: host.getAttribute(`${nameAttr}-size`) ?? undefined,
      className,
      attrs,
    });
    if (!markup) continue;
    const doc = host.ownerDocument;
    const holder = doc.createElement("template");
    holder.innerHTML = markup;
    const svg = holder.content.firstElementChild;
    if (!svg) continue;
    for (const attr of Array.from(host.attributes)) {
      if (attr.name === nameAttr || attr.name.startsWith(`${nameAttr}-`) || attr.name === "class") continue;
      svg.setAttribute(attr.name, attr.value);
    }
    host.replaceWith(svg);
    replaced++;
  }
  return replaced;
}
