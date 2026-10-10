import type { CopyFormat } from "@/lib/copy-formats";

export const VARIANT_LABELS: Record<string, string> = {
  default: "Default",
  mono: "Mono",
  light: "Light",
  dark: "Dark",
  wordmark: "Wordmark",
  wordmarkLight: "WM Light",
  wordmarkDark: "WM Dark",
};

export const FORMAT_BUTTONS: {
  value: CopyFormat;
  label: string;
  description: string;
}[] = [
  { value: "svg", label: "SVG", description: "Raw SVG markup" },
  { value: "jsx", label: "JSX", description: "React component" },
  { value: "vue", label: "Vue", description: "Vue single-file component" },
  { value: "cdn", label: "CDN", description: "jsDelivr CDN link" },
  { value: "data-uri", label: "URI", description: "Base64 data URI" },
];

export const FORMAT_LABELS = (() => {
  const map = new Map<string, string>();
  for (let i = 0; i < FORMAT_BUTTONS.length; i++) {
    map.set(FORMAT_BUTTONS[i].value, FORMAT_BUTTONS[i].label);
  }
  return map;
})();

export const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

export function variantToFilename(variant: string): string {
  return variant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function getJsDelivrUrl(slug: string, variant: string): string {
  const filename = variantToFilename(variant);
  return `${CDN_BASE}/${slug}/${filename}.svg`;
}
