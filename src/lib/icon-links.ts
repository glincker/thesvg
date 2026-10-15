/**
 * Extra official links for an icon (source repo, docs, social accounts).
 *
 * `url` stays the product website and `guidelines` stays the brand or
 * license page. `links` holds everything else, keyed by type, so the
 * detail page can show a compact row of destinations and agents can read
 * them from the API.
 */

export type IconLinkType =
  | "github"
  | "gitlab"
  | "codeberg"
  | "docs"
  | "x"
  | "mastodon"
  | "bluesky"
  | "discord"
  | "youtube"
  | "linkedin"
  | "reddit";

export type IconLinks = Partial<Record<IconLinkType, string>>;

interface LinkMeta {
  label: string;
  /** Slug of the thesvg icon used as this link's mark, or null for a generic glyph. */
  iconSlug: string | null;
  /** Hostnames a link of this type is allowed to point at. Empty means any https host. */
  hosts: string[];
}

export const LINK_META: Record<IconLinkType, LinkMeta> = {
  github: { label: "GitHub", iconSlug: "github", hosts: ["github.com"] },
  gitlab: { label: "GitLab", iconSlug: "gitlab", hosts: ["gitlab.com"] },
  codeberg: { label: "Codeberg", iconSlug: "codeberg", hosts: ["codeberg.org"] },
  docs: { label: "Docs", iconSlug: null, hosts: [] },
  x: { label: "X", iconSlug: "x", hosts: ["x.com", "twitter.com"] },
  mastodon: { label: "Mastodon", iconSlug: "mastodon", hosts: [] },
  bluesky: { label: "Bluesky", iconSlug: "bluesky", hosts: ["bsky.app"] },
  discord: {
    label: "Discord",
    iconSlug: "discord",
    hosts: ["discord.gg", "discord.com"],
  },
  youtube: {
    label: "YouTube",
    iconSlug: "youtube",
    hosts: ["youtube.com", "youtu.be"],
  },
  linkedin: { label: "LinkedIn", iconSlug: "linkedin", hosts: ["linkedin.com"] },
  reddit: { label: "Reddit", iconSlug: "reddit", hosts: ["reddit.com"] },
};

/** Display order: code first, then docs, then community and social. */
export const LINK_ORDER: IconLinkType[] = [
  "github",
  "gitlab",
  "codeberg",
  "docs",
  "discord",
  "x",
  "mastodon",
  "bluesky",
  "youtube",
  "linkedin",
  "reddit",
];

export interface ResolvedIconLink {
  type: IconLinkType;
  label: string;
  href: string;
  iconSlug: string | null;
}

function hostMatches(hostname: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const h = hostname.replace(/^www\./, "").toLowerCase();
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

/**
 * Returns the links that are safe to render, in display order. Anything
 * that is not https, not parseable, or on the wrong host for its type is
 * dropped rather than shown.
 */
export function getIconLinks(
  links: IconLinks | undefined | null,
): ResolvedIconLink[] {
  if (!links) return [];
  const out: ResolvedIconLink[] = [];
  for (const type of LINK_ORDER) {
    const raw = links[type];
    if (!raw) continue;
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:") continue;
    if (!hostMatches(parsed.hostname, LINK_META[type].hosts)) continue;
    out.push({
      type,
      label: LINK_META[type].label,
      href: parsed.toString(),
      iconSlug: LINK_META[type].iconSlug,
    });
  }
  return out;
}
