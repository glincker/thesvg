import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IconEntry } from "@/lib/icons";

const ROWS = [
  { offset: 0, dir: "left", speed: "b" },
  { offset: 3, dir: "right", speed: "d" },
  { offset: 6, dir: "left", speed: "a" },
  { offset: 9, dir: "right", speed: "c" },
] as const;

const PER_ROW = 12;

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
    <div
      className={cn(
        "flags-scene relative h-[19rem] w-[32rem] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] xl:w-[38rem]",
        tilt === "left" ? "-rotate-[8deg]" : "rotate-[8deg]",
      )}
    >
      <div className="flex h-full flex-col justify-center gap-3.5">
        {ROWS.map((row) => {
          const items = Array.from({ length: PER_ROW }, (_, i) => icons[(row.offset + i) % icons.length]);
          return (
            <div key={row.offset} className="flags-row relative flex w-max gap-3.5 hover:z-20" data-dir={row.dir} data-speed={row.speed}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 gap-3.5" aria-hidden={copy === 1 ? true : undefined}>
                  {items.map((icon, i) => (
                    <li key={`${copy}-${i}`} className="group/tile relative">
                      <Link
                        href={`/icon/${icon.slug}`}
                        prefetch={false}
                        tabIndex={copy === 1 ? -1 : undefined}
                        aria-label={icon.title}
                        className={cn("pointer-events-auto grid size-[4.25rem] place-items-center rounded-2xl border p-3 shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400", tileClass, plateClass(icon.slug))}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon.variants.light || icon.variants.default} alt="" loading="lazy" decoding="async" className="size-full object-contain dark:hidden" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon.variants.dark || icon.variants.default} alt="" loading="lazy" decoding="async" className="hidden size-full object-contain dark:block" />
                      </Link>
                      <span role="tooltip" className={cn("pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 motion-reduce:transition-none", tilt === "left" ? "rotate-[8deg]" : "-rotate-[8deg]")}>
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
    </div>
  );
}
