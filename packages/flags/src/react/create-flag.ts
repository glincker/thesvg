import { createElement, forwardRef, useId, useMemo, type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from "react";
import type { FlagVariant } from "../types.js";

export interface FlagShape {
  viewBox: string;
  /** SVG children, with root presentation attributes moved onto a wrapping g. */
  inner: string;
  /** Element ids used inside `inner`; rewritten per instance so two flags on one page never collide. */
  ids?: string[];
}

export type FlagShapes = Record<FlagVariant, FlagShape>;

export interface FlagProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "children" | "dangerouslySetInnerHTML"> {
  /** Shape: "4x3" (default), "square" or "circle". */
  variant?: FlagVariant;
  /** Rendered height in px; width follows the shape (4:3 or 1:1). Default 24. */
  size?: number | string;
  /** Accessible name. Omit when the flag is decorative and visible text names the country. */
  title?: string;
}

export type FlagComponent = ForwardRefExoticComponent<FlagProps & RefAttributes<SVGSVGElement>>;

const escapeXml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Prefix every id and each reference to it (url(#id), href, xlink:href) so instances stay independent. */
export function scopeIds(inner: string, ids: readonly string[] | undefined, prefix: string): string {
  if (!ids || ids.length === 0) return inner;
  const alt = ids.map(escapeRe).join("|");
  return inner
    .replace(new RegExp(`(\\sid=")(${alt})(")`, "g"), `$1${prefix}$2$3`)
    .replace(new RegExp(`url\\(#(${alt})\\)`, "g"), `url(#${prefix}$1)`)
    .replace(new RegExp(`((?:xlink:)?href="#)(${alt})(")`, "g"), `$1${prefix}$2$3`);
}

/**
 * Width for a given height keeping the unit: 2em gives 2.67em for 4:3. Percentages, calc() and other
 * expressions have no safe arithmetic, so width is left out and the viewBox ratio applies.
 */
export function deriveWidth(height: number | string, ratio: number): number | string | undefined {
  if (typeof height === "number") return Math.round(height * ratio * 100) / 100;
  const m = height.trim().match(/^(\d*\.?\d+)([a-z]*)$/i);
  if (!m) return undefined;
  const n = Math.round(Number(m[1]) * ratio * 100) / 100;
  return m[2] === "" ? n : `${n}${m[2]}`;
}

/** Build a flag component from the three shapes of one flag. */
export function createFlag(displayName: string, shapes: FlagShapes): FlagComponent {
  const Flag = forwardRef<SVGSVGElement, FlagProps>(function Flag(
    { variant = "4x3", size = 24, width, height, title, ...rest },
    ref,
  ) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const shape = shapes[variant] ?? shapes["4x3"];
    const h = height ?? size;
    const ratio = variant === "4x3" ? 4 / 3 : 1;
    const w = width ?? deriveWidth(h, ratio);
    const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
    const html = useMemo(
      () => (title ? `<title>${escapeXml(title)}</title>` : "") + scopeIds(shape.inner, shape.ids, `f${uid}-`),
      [shape, uid, title],
    );
    return createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: shape.viewBox,
      width: w,
      height: h,
      focusable: "false",
      ...a11y,
      ...rest,
      ref,
      dangerouslySetInnerHTML: { __html: html },
    });
  });
  Flag.displayName = displayName;
  return Flag;
}
