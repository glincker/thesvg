import { createElement, forwardRef, type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from "react";
import type { FlagVariant } from "../types.js";

export interface FlagShape {
  viewBox: string;
  /** SVG children without the <title>. */
  inner: string;
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

/** Build a flag component from the three shapes of one flag. */
export function createFlag(displayName: string, shapes: FlagShapes): FlagComponent {
  const Flag = forwardRef<SVGSVGElement, FlagProps>(function Flag(
    { variant = "4x3", size = 24, width, height, title, ...rest },
    ref,
  ) {
    const shape = shapes[variant] ?? shapes["4x3"];
    const h = height ?? size;
    const numeric = typeof h === "number" ? h : Number.parseFloat(String(h));
    const ratio = variant === "4x3" ? 4 / 3 : 1;
    const w = width ?? (Number.isFinite(numeric) ? Math.round(numeric * ratio * 100) / 100 : undefined);
    const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
    return createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: shape.viewBox,
      width: w,
      height: h,
      focusable: "false",
      ...a11y,
      ...rest,
      ref,
      dangerouslySetInnerHTML: { __html: (title ? `<title>${escapeXml(title)}</title>` : "") + shape.inner },
    });
  });
  Flag.displayName = displayName;
  return Flag;
}
