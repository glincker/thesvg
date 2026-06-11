/**
 * Catalog 2026 motion vocabulary.
 *
 * Exactly three primitives, exported as plain strings so they can be
 * dropped into `style` or composed inside Tailwind `transition-*` and
 * CSS variables. The global `prefers-reduced-motion` guard in
 * `globals.css` collapses these to opacity-only fades.
 */

export const MOTION = {
  /** Snappy spring used for tap bounces, sheet snaps, chip pops. */
  spring: "250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Cross-fade used for content swaps, dropdown opens. */
  fade: "150ms ease-out",
  /** Sheet/drawer entrance — long, easeOut, no overshoot. */
  slide: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/**
 * Tap-bounce keyframe used for haptic-equivalent feedback. Apply via
 * `data-tap-bounce` or the `.tap-bounce` utility in globals.css.
 */
export const TAP_BOUNCE_DURATION_MS = 120;
