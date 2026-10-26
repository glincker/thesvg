"use client";

import { type IconNode, type StyleParams, type Variant, renderIcon } from "@/lib/ui-icons/engine";
import { useId, useMemo } from "react";
import { styleFor } from "@/lib/ui-icons/glyphs";
import { useUi } from "./ui-state";

/** Renders one glyph with the house style for the chosen variant. Color comes from currentColor. */
export function Glyph(props: { nodes: IconNode[]; variant: Variant; size: number; accent?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const { lab } = useUi();
  const svg = useMemo(() => {
    const style = { ...styleFor(props.variant, lab), accent: props.accent ?? "" };
    return renderIcon(props.nodes, { variant: props.variant, style, size: props.size, idPrefix: id }).svg;
  }, [props.nodes, props.variant, props.size, props.accent, lab, id]);
  return <span className={`${props.className ?? ""} ink`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Plain SVG text for copy and download, always themeable through currentColor. */
export function svgText(nodes: IconNode[], variant: Variant, size = 24, accent = "", lab: Partial<StyleParams> = {}): string {
  const style = { ...styleFor(variant, lab), accent };
  return renderIcon(nodes, { variant, style, size, idPrefix: "x" }).svg;
}
