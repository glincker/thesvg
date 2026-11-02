import { Github } from "@/components/own-icons";

const REPO = "glincker/thesvg";

// The count is read at build time, so the card renders without it if GitHub is unreachable.
async function getStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export async function GithubStarCard() {
  const stars = await getStars();
  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-8 flex items-center gap-4 rounded-xl border border-border/40 bg-muted/30 p-4 transition-colors hover:border-orange-500/40 dark:border-white/[0.06] dark:bg-white/[0.03]"
    >
      <Github className="h-8 w-8 shrink-0 text-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">Star theSVG on GitHub</span>
        <span className="block text-xs text-muted-foreground">
          7,600+ brand icons, open source under the MIT license. A star helps other developers find it.
        </span>
      </span>
      <span className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-orange-400">
        {stars !== null ? `Star · ${stars.toLocaleString("en-US")}` : "Star"}
      </span>
    </a>
  );
}
