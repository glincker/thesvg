import Link from "next/link";
import { DriftScene } from "@/components/drift-scene";
import { cn } from "@/lib/utils";
import type { IconEntry } from "@/lib/icons";

// Rows alternate tile size so the grid does not read as one repeated pattern.
const ROWS = [
  { index: 0, dir: "left", speed: "b", tile: "size-14 p-3", img: "size-8" },
  { index: 1, dir: "right", speed: "d", tile: "size-12 p-2.5", img: "size-7" },
  { index: 2, dir: "left", speed: "a", tile: "size-12 p-2.5", img: "size-7" },
  { index: 3, dir: "right", speed: "c", tile: "size-14 p-3", img: "size-8" },
  { index: 4, dir: "left", speed: "e", tile: "size-12 p-2.5", img: "size-7" },
] as const;

const PER_ROW = 14;

interface IconRowsVisualProps {
  icons: IconEntry[];
  /** Positive tilts clockwise; alternating it between slides keeps the carousel from feeling repeated. */
  tilt: "left" | "right";
  tileClass: string;
  plateClass: (slug: string) => string;
}

/** Angled rows of this collection's icons drifting in opposite directions. Each tile links to its page; the repeated half is hidden from assistive tech. */
export function IconRowsVisual({ icons, tilt, tileClass, plateClass }: IconRowsVisualProps) {
  if (icons.length === 0) return null;
  return (
    <DriftScene
      className={cn(
        "relative h-[20rem] w-[32rem] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] xl:w-[38rem]",
        tilt === "left" ? "-rotate-[8deg]" : "rotate-[8deg]",
      )}
    >
      <div className="flex h-full flex-col justify-center gap-3">
        {ROWS.map((row) => {
          // Each row takes every fifth icon from its own start, so rows never show the same icons side by side.
          const items = Array.from({ length: PER_ROW }, (_, i) => icons[(row.index + i * ROWS.length) % icons.length]);
          return (
            <div key={row.index} className="flags-row relative flex w-max gap-3 hover:z-20" data-dir={row.dir} data-speed={row.speed}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1 ? true : undefined}>
                  {items.map((icon, i) => (
                    <li key={`${copy}-${i}`} className="group/tile relative">
                      <Link
                        href={`/icon/${icon.slug}`}
                        prefetch={false}
                        tabIndex={-1}
                        aria-label={icon.title}
                        className={cn("pointer-events-auto grid place-items-center rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400", row.tile, tileClass, plateClass(icon.slug))}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon.variants.light || icon.variants.default} alt="" loading="lazy" decoding="async" className={cn(row.img, "object-contain dark:hidden")} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon.variants.dark || icon.variants.default} alt="" loading="lazy" decoding="async" className={cn(row.img, "hidden object-contain dark:block")} />
                      </Link>
                      <span role="tooltip" className={cn("pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[0.6875rem] font-medium text-white opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 motion-reduce:transition-none", tilt === "left" ? "rotate-[8deg]" : "-rotate-[8deg]")}>
                        {icon.title}
                      </span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          );
        })}
      </div>
    </DriftScene>
  );
}
