import adoptersJson from "@/data/adopters.json";
import historyJson from "@/data/adopters-history.json";

export type AdopterKind = "dependency" | "code" | "docs";

export interface AdopterByKind {
  dependency: number;
  code: number;
  docs: number;
}

export interface AdopterRepo {
  repo: string;
  url: string;
  stars: number;
  kind: AdopterKind;
  description: string;
}

export interface AdoptersSnapshot {
  generatedAt: string;
  method: string;
  total: number;
  byKind: AdopterByKind;
  repos: AdopterRepo[];
}

export interface AdoptersHistoryEntry {
  date: string;
  total: number;
  byKind: AdopterByKind;
}

const SOURCE_EXTENSIONS: ReadonlySet<string> = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "vue", "svelte", "py", "rs", "go", "rb",
  "php", "java", "kt", "swift", "html", "css",
]);
const DOC_EXTENSIONS: ReadonlySet<string> = new Set(["md", "mdx", "txt", "rst"]);

function extensionOf(path: string): string {
  const base = path.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
}

/** Classify a repo from the file paths code search matched. `null` means drop. */
export function classifyPaths(paths: readonly string[]): AdopterKind | null {
  if (paths.some((p) => p.toLowerCase().endsWith("package.json"))) return "dependency";
  if (paths.some((p) => SOURCE_EXTENSIONS.has(extensionOf(p)))) return "code";
  if (paths.some((p) => DOC_EXTENSIONS.has(extensionOf(p)))) return "docs";
  return null;
}

export function getAdoptersSnapshot(): AdoptersSnapshot {
  return adoptersJson as AdoptersSnapshot;
}

export function getAdoptersHistory(): AdoptersHistoryEntry[] {
  return historyJson as AdoptersHistoryEntry[];
}
