export interface Pt {
  x: number;
  y: number;
}

export type Seg =
  | { t: "L"; to: Pt }
  | { t: "C"; c1: Pt; c2: Pt; to: Pt }
  | { t: "A"; rx: number; ry: number; rot: number; large: 0 | 1; sweep: 0 | 1; to: Pt };

export interface Subpath {
  start: Pt;
  segs: Seg[];
  closed: boolean;
}

/** One source element (path, rect, circle...) after parsing. */
export interface Shape {
  subpaths: Subpath[];
}

export type IconNode = [tag: string, attrs: Record<string, string>];

export type CornerStyle = "source" | "sharp" | "round" | "chamfer" | "squircle";
export type CapStyle = "round" | "butt" | "square";
export type JoinStyle = "round" | "miter" | "bevel";
export type Variant = "outline" | "duotone" | "offset" | "fill" | "glass" | "glass-outline" | "depth";

export interface StyleParams {
  strokeWidth: number;
  cap: CapStyle;
  join: JoinStyle;
  corner: CornerStyle;
  /** Corner radius in viewBox units, used by round, chamfer and squircle. */
  radius: number;
  /** Squircle control handle ratio, 0.5523 is a circle, higher is squarer. */
  squircleK: number;
  /** Opacity of the duotone back layer. */
  duotoneOpacity: number;
  /** Gap between a knocked-out detail and the fill body in the fill variant. */
  fillGap: number;
  /** Largest turn in degrees allowed for one chord, 0 keeps curves smooth. 45 turns circles into octagons. */
  facetAngle: number;
  /** Second tone for duotone, offset and glass panes as a hex like #f5c542. Empty means the same color as the ink. */
  accent: string;
  /** Depth variant: extrusion length in viewBox units. */
  depth: number;
  /** Depth variant: direction the extrusion falls towards, degrees, 45 is down and to the right. */
  depthAngle: number;
  /** Glass variant: strength of the blurred inner shade that gives the pane thickness, 0 turns it off. */
  glassDepth: number;
  /** Glyph scale about the canvas centre, below 1 gives more air around every icon. */
  scale: number;
  /** Slice every open stroke end at 45 degrees. Needs a mask, so use the path export for fonts. */
  cutTerminals: boolean;
  /** Fill variant on line-only glyphs: stroke weight multiplier so they match filled neighbours. */
  fillFallbackBoost: number;
  /** Offset duotone: shift of the back layer in viewBox units. */
  offsetX: number;
  offsetY: number;
  /** Glass outline: fill opacity of the translucent pane inside closed bodies. */
  glassPane: number;
  /** Glass outline: opacity of the inner highlight stroke, 0 turns it off. */
  glassShine: number;
  /** Glass outline: width of the highlight band in viewBox units. */
  glassShineWidth: number;
  /** Glass outline: gap between the outline and the highlight band in viewBox units. */
  glassShineGap: number;
  /** Lift shadow under the whole icon, any look: opacity from 0 (off) to 1. */
  shadow: number;
  /** Shadow blur radius and downward offset in viewBox units. */
  shadowBlur: number;
  shadowOffset: number;
}
