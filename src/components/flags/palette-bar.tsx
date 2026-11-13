import type { FlagTile } from "@/lib/flags-browser/model";

/** Thin palette strip in share order. An SVG, so widths come from attributes and no inline style is needed. */
export function PaletteBar({ colors, className = "h-1 w-full" }: Readonly<{ colors: FlagTile["colors"]; className?: string }>) {
  const total = colors.reduce((n, c) => n + c.share, 0) || 1;
  const bars = colors.map((c, i) => ({
    hex: c.hex,
    x: (colors.slice(0, i).reduce((n, p) => n + p.share, 0) / total) * 100,
    w: (c.share / total) * 100,
  }));
  return (
    <svg viewBox="0 0 100 4" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      {bars.map((b) => (
        <rect key={b.hex} x={b.x} y={0} width={b.w} height={4} fill={`#${b.hex}`} />
      ))}
    </svg>
  );
}
