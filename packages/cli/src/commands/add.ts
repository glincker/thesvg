import { fetchIcon, fetchSvgContent, ApiError } from "../utils/api.js";
import {
  writeIcon,
  detectDefaultDir,
  relativeToCwd,
  type OutputFormat,
} from "../utils/writer.js";
import { success, error, info, warn, dim, colorize } from "../utils/colors.js";
import {
  DEFAULT_LOOK,
  assertValidLook,
  fetchUiIcon,
  fetchUiSvgContent,
  stripUiPrefix,
} from "../utils/ui.js";

interface AddOptions {
  slugs: string[];
  variant: string;
  dir: string | undefined;
  format: OutputFormat;
  /** Only set when --look is passed, so brand-only parsing is unchanged. */
  look?: string;
}

function isOutputFormat(value: string): value is OutputFormat {
  return value === "svg" || value === "jsx" || value === "vue";
}

export function parseAddArgs(args: string[]): AddOptions {
  const slugs: string[] = [];
  let variant = "default";
  let dir: string | undefined;
  let format: OutputFormat = "svg";
  let look: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--variant" || arg === "-v") {
      variant = args[++i] ?? "default";
    } else if (arg?.startsWith("--variant=")) {
      variant = arg.slice("--variant=".length);
    } else if (arg === "--look") {
      look = args[++i] ?? DEFAULT_LOOK;
    } else if (arg?.startsWith("--look=")) {
      look = arg.slice("--look=".length);
    } else if (arg === "--dir" || arg === "-d") {
      dir = args[++i];
    } else if (arg?.startsWith("--dir=")) {
      dir = arg.slice("--dir=".length);
    } else if (arg === "--format" || arg === "-f") {
      const val = args[++i] ?? "svg";
      if (isOutputFormat(val)) {
        format = val;
      } else {
        console.error(error(`Unknown format "${val}". Use: svg, jsx, vue`));
        process.exit(1);
      }
    } else if (arg?.startsWith("--format=")) {
      const val = arg.slice("--format=".length);
      if (isOutputFormat(val)) {
        format = val;
      } else {
        console.error(error(`Unknown format "${val}". Use: svg, jsx, vue`));
        process.exit(1);
      }
    } else if (arg && !arg.startsWith("-")) {
      slugs.push(arg);
    }
  }

  const result: AddOptions = { slugs, variant, dir, format };
  if (look !== undefined) result.look = look;
  return result;
}

/** Fetch and write one UI icon. Throws ApiError on any failure. */
async function addUiIcon(
  slug: string,
  look: string,
  outputDir: string,
  format: OutputFormat
): Promise<void> {
  await assertValidLook(look);
  const meta = await fetchUiIcon(slug);
  const svg = await fetchUiSvgContent(slug, look);
  // A UI icon and a brand icon can share a name (x, github), so UI files carry a ui- prefix and never replace a brand file.
  // Outline is the default look, so it gets the plain name like a default variant.
  const result = await writeIcon(svg, {
    dir: outputDir,
    format,
    slug: `ui-${slug}`,
    variant: look === DEFAULT_LOOK ? "default" : look,
  });
  console.log(
    success(
      `${colorize("white", meta.title)} ${dim(`(ui:${slug}, ${look})`)} → ${colorize("cyan", relativeToCwd(result.filePath))}`
    )
  );
}

export async function runAdd(args: string[]): Promise<void> {
  const opts = parseAddArgs(args);

  if (opts.slugs.length === 0) {
    console.error(error("No icon slugs provided."));
    console.error(dim("Usage: thesvg add <slug> [slug...] [options]"));
    console.error(dim("       thesvg add github vercel nextjs --format jsx"));
    console.error(dim("       thesvg add ui:arrow-down --look glass"));
    process.exit(1);
  }

  const outputDir = opts.dir ?? detectDefaultDir();

  console.log(
    info(
      `Adding ${opts.slugs.length === 1 ? `icon` : `${opts.slugs.length} icons`} to ${colorize("cyan", outputDir)} as ${colorize("yellow", opts.format.toUpperCase())}`
    )
  );

  let failCount = 0;

  for (const slug of opts.slugs) {
    try {
      const uiSlug = stripUiPrefix(slug);
      if (uiSlug !== null) {
        await addUiIcon(uiSlug, opts.look ?? DEFAULT_LOOK, outputDir, opts.format);
        continue;
      }

      // First, verify icon exists in registry
      const iconMeta = await fetchIcon(slug);

      // Check if requested variant is available
      const availableVariants = Object.keys(iconMeta.variants).filter(
        (k) => iconMeta.variants[k as keyof typeof iconMeta.variants] !== undefined
      );

      if (!availableVariants.includes(opts.variant)) {
        console.warn(
          warn(
            `Variant "${opts.variant}" not found for "${slug}". Available: ${availableVariants.join(", ")}`
          )
        );
        console.warn(dim(`  Falling back to "default" variant`));
      }

      const variantToUse = availableVariants.includes(opts.variant)
        ? opts.variant
        : "default";

      // Fetch the raw SVG
      const svgContent = await fetchSvgContent(slug, variantToUse);

      // Write to disk
      const result = await writeIcon(svgContent, {
        dir: outputDir,
        format: opts.format,
        slug,
        variant: variantToUse,
      });

      const relPath = relativeToCwd(result.filePath);
      console.log(
        success(
          `${colorize("white", iconMeta.title)} ${dim(`(${slug})`)} → ${colorize("cyan", relPath)}`
        )
      );
    } catch (err) {
      failCount++;
      if (err instanceof ApiError) {
        if (err.statusCode === 404) {
          console.error(error(`Icon "${slug}" not found in registry`));
        } else {
          console.error(error(`Failed to add "${slug}": ${err.message}`));
        }
      } else if (err instanceof Error) {
        console.error(error(`Failed to add "${slug}": ${err.message}`));
      } else {
        console.error(error(`Failed to add "${slug}": Unknown error`));
      }
    }
  }

  const total = opts.slugs.length;
  const added = total - failCount;

  if (failCount > 0 && added > 0) {
    console.log(
      warn(`\nDone: ${added}/${total} icons added, ${failCount} failed`)
    );
  } else if (failCount === total) {
    console.error(error(`\nFailed to add any icons`));
    process.exit(1);
  } else {
    console.log(
      success(
        `\nDone! ${added === 1 ? "1 icon" : `${added} icons`} added to ${outputDir}`
      )
    );
  }
}
