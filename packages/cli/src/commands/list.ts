import { fetchIconList, ApiError } from "../utils/api.js";
import { error, info, header, dim, colorize } from "../utils/colors.js";
import { fetchUiIconList } from "../utils/ui.js";

interface ListOptions {
  category: string | undefined;
  limit: number;
  /** Only set when --ui is passed, so brand-only parsing is unchanged. */
  ui?: boolean;
}

export function parseListArgs(args: string[]): ListOptions {
  let category: string | undefined;
  let limit = 50;
  let ui = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--ui") {
      ui = true;
    } else if (arg === "--category" || arg === "-c") {
      category = args[++i];
    } else if (arg?.startsWith("--category=")) {
      category = arg.slice("--category=".length);
    } else if (arg === "--limit" || arg === "-l") {
      const val = parseInt(args[++i] ?? "50", 10);
      if (!isNaN(val) && val > 0) limit = val;
    } else if (arg?.startsWith("--limit=")) {
      const val = parseInt(arg.slice("--limit=".length), 10);
      if (!isNaN(val) && val > 0) limit = val;
    }
  }

  const result: ListOptions = { category, limit };
  if (ui) result.ui = true;
  return result;
}

async function runListUi(opts: ListOptions): Promise<void> {
  console.log(
    info(
      opts.category
        ? `Fetching UI icons in category "${opts.category}"...`
        : "Fetching UI icons..."
    )
  );

  let result;
  try {
    result = await fetchUiIconList({ category: opts.category, limit: opts.limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(error(`Failed to fetch UI icon list: ${message}`));
    process.exit(1);
  }

  const { icons, total } = result;
  if (icons.length === 0) {
    console.log(dim("No UI icons found"));
    return;
  }

  console.log(header(`\n${total} UI icon${total === 1 ? "" : "s"} total`));
  if (icons.length < total) console.log(dim(`  (showing ${icons.length} of ${total})`));
  console.log();

  const maxSlug = Math.max(4, ...icons.map((i) => i.slug.length));
  const maxTitle = Math.max(5, ...icons.map((i) => i.title.length));
  console.log(
    `  ${colorize("bold", "Slug".padEnd(maxSlug))}  ${colorize("bold", "Title".padEnd(maxTitle))}  ${colorize("bold", "Category")}`
  );
  for (const icon of icons) {
    console.log(
      `  ${colorize("cyan", icon.slug.padEnd(maxSlug))}  ${icon.title.padEnd(maxTitle)}  ${dim(icon.category)}`
    );
  }
  console.log();
  console.log(dim(`  Run "thesvg add ui:<slug> [--look glass]" to add a UI icon.`));
}

export async function runList(args: string[]): Promise<void> {
  const opts = parseListArgs(args);
  if (opts.ui) return runListUi(opts);

  const label = opts.category
    ? `icons in category "${opts.category}"`
    : "available icons";

  console.log(info(`Fetching ${label}...`));

  let result;
  try {
    result = await fetchIconList({
      category: opts.category,
      limit: opts.limit,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(error(`Failed to fetch icon list: ${err.message}`));
    } else if (err instanceof Error) {
      console.error(error(`Failed to fetch icon list: ${err.message}`));
    } else {
      console.error(error("Failed to fetch icon list: Unknown error"));
    }
    process.exit(1);
  }

  const { icons, total } = result;

  if (icons.length === 0) {
    console.log(
      dim(
        opts.category
          ? `No icons found in category "${opts.category}"`
          : "No icons found"
      )
    );
    return;
  }

  console.log(
    header(
      `\n${opts.category ? `Category: ${opts.category}  -  ` : ""}${total} icon${total === 1 ? "" : "s"} total`
    )
  );

  if (icons.length < total) {
    console.log(dim(`  (showing ${icons.length} of ${total})`));
  }

  console.log();

  // Determine column widths
  const maxSlug = Math.max(4, ...icons.map((i) => i.slug.length));
  const maxTitle = Math.max(5, ...icons.map((i) => i.title.length));

  const slugCol = "Slug".padEnd(maxSlug);
  const titleCol = "Title".padEnd(maxTitle);
  const catCol = "Categories";

  console.log(
    `  ${colorize("bold", slugCol)}  ${colorize("bold", titleCol)}  ${colorize("bold", catCol)}`
  );
  console.log(
    `  ${"-".repeat(maxSlug)}  ${"-".repeat(maxTitle)}  ${"-".repeat(20)}`
  );

  for (const icon of icons) {
    const slug = colorize("cyan", icon.slug.padEnd(maxSlug));
    const title = icon.title.padEnd(maxTitle);
    const categories = dim(icon.categories.join(", "));
    console.log(`  ${slug}  ${title}  ${categories}`);
  }

  console.log();

  if (icons.length < total) {
    console.log(
      dim(
        `  Use --limit <n> to show more. Try --limit ${total} to show all.`
      )
    );
  }

  console.log(
    dim(
      `  Run "thesvg add <slug>" to add an icon to your project.`
    )
  );
}
