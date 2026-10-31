import taxonomy from "@/data/ui/taxonomy.json";

// Pure helpers with no icon data, so the build script and the app can both import them.

export const DOMAINS: readonly { id: string; label: string }[] = taxonomy.domains;
export const MODIFIERS: readonly string[] = taxonomy.modifiers;

// ⚡ Bolt: Use a single-pass loop to avoid intermediate array allocations
const LABELS = new Map<string, string>();
for (const d of DOMAINS) {
  LABELS.set(d.id, d.label);
}

const MODIFIER_SET = new Set(MODIFIERS);

export function domainLabel(id: string): string {
  return LABELS.get(id) ?? "General";
}

export function isDomain(id: string): boolean {
  return LABELS.has(id);
}

/** Splits a slug into the thing it shows and the variations on it: "folder-plus" is concept "folder" with modifier "plus". */
export function conceptOf(slug: string): { concept: string; modifiers: string[] } {
  const words = slug.split("-");
  const concept: string[] = [];
  const modifiers: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const pair = words[i + 1] ? `${words[i]}-${words[i + 1]}` : "";
    if (concept.length > 0 && pair && MODIFIER_SET.has(pair)) {
      modifiers.push(pair);
      i++;
    } else if (concept.length > 0 && MODIFIER_SET.has(words[i])) {
      modifiers.push(words[i]);
    } else {
      concept.push(words[i]);
    }
  }
  return { concept: concept.join("-"), modifiers };
}
