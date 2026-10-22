// Rules for supersedes/supersededBy links between icons.json entries.
// Used by tools/validate-lineage.mjs and by the Vitest suite.

/**
 * Returns a human-readable message for every one-way or dangling lineage link
 * in `entries` (the parsed icons.json array). Empty when the catalog is clean.
 *
 * @param {Array<{ slug: string, supersedes?: string, supersededBy?: string }>} entries
 * @returns {string[]}
 */
export function findLineageIssues(entries) {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const issues = [];

  for (const e of entries) {
    if (e.supersedes && e.supersededBy) {
      issues.push(
        `${e.slug} has both supersedes and supersededBy; an entry cannot be newer and older in the same chain`,
      );
    }
    if (e.supersedes) {
      const target = bySlug.get(e.supersedes);
      if (!target) {
        issues.push(
          `${e.slug}.supersedes points at unknown slug "${e.supersedes}"`,
        );
      } else if (target.supersededBy !== e.slug) {
        issues.push(
          `${e.slug}.supersedes = "${e.supersedes}" but ${target.slug}.supersededBy = "${
            target.supersededBy ?? ""
          }" (expected "${e.slug}")`,
        );
      }
    }
    if (e.supersededBy) {
      const target = bySlug.get(e.supersededBy);
      if (!target) {
        issues.push(
          `${e.slug}.supersededBy points at unknown slug "${e.supersededBy}"`,
        );
      } else if (target.supersedes !== e.slug) {
        issues.push(
          `${e.slug}.supersededBy = "${e.supersededBy}" but ${target.slug}.supersedes = "${
            target.supersedes ?? ""
          }" (expected "${e.slug}")`,
        );
      }
    }
  }

  return issues;
}
