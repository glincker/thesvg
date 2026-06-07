import { forwardRef, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Local replacements for brand glyphs that were dropped from lucide-react v1.0.
 * These are simple line-icon versions intended for UI chrome (matching the
 * lucide visual style), not the rich brand SVGs in /public/icons. Used for
 * GitHub repo links, Codepen deep-links, and similar affordances.
 */

export const Github = forwardRef<SVGSVGElement, IconProps>(function Github(
  { size = 24, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      {...baseProps}
      width={size}
      height={size}
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
});

export const Codepen = forwardRef<SVGSVGElement, IconProps>(function Codepen(
  { size = 24, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      {...baseProps}
      width={size}
      height={size}
      {...props}
    >
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
      <polyline points="2 15.5 12 8.5 22 15.5" />
      <line x1="12" y1="2" x2="12" y2="8.5" />
    </svg>
  );
});
