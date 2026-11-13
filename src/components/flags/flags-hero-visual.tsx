import Link from "next/link";

// Popular countries first, then a spread across regions. Each row starts at a different offset so the rows never line up.
const CODES = [
  "us", "gb", "de", "fr", "es", "it", "jp", "cn", "in", "br", "ca", "au", "mx", "kr", "ru", "nl", "se", "ch", "pl", "tr",
  "ar", "za", "ng", "eg", "sa", "ae", "id", "th", "vn", "ph", "pt", "gr", "ie", "nz", "il", "ua", "ke", "cl", "co", "no",
] as const;

const ROWS = [
  { offset: 0, dir: "left", speed: "b" },
  { offset: 8, dir: "right", speed: "d" },
  { offset: 16, dir: "left", speed: "a" },
  { offset: 24, dir: "right", speed: "c" },
  { offset: 32, dir: "left", speed: "e" },
] as const;

const PER_ROW = 16;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const flagName = (code: string): string => regionNames.of(code.toUpperCase()) ?? code.toUpperCase();

const rowCodes = (offset: number): string[] => Array.from({ length: PER_ROW }, (_, i) => CODES[(offset + i) % CODES.length]);

/** Five angled rows of flags drifting in opposite directions. Every flag links to its page; the repeated half is hidden from assistive tech. */
export function FlagsHeroVisual() {
  return (
    <div className="flags-scene relative h-[19rem] w-[34rem] -rotate-[9deg] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] xl:w-[40rem]">
      <div className="flex h-full flex-col justify-center gap-3.5">
        {ROWS.map((row) => {
          const codes = rowCodes(row.offset);
          return (
            <div key={row.offset} className="flags-row relative flex w-max gap-3.5 hover:z-20" data-dir={row.dir} data-speed={row.speed}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 gap-3.5" aria-hidden={copy === 1 ? true : undefined}>
                  {codes.map((code) => (
                    <li key={`${copy}-${code}`} className="group/flag relative">
                      <Link
                        href={`/icon/flag-${code}`}
                        prefetch={false}
                        tabIndex={copy === 1 ? -1 : undefined}
                        aria-label={`${flagName(code)} flag`}
                        className="pointer-events-auto block rounded-md ring-1 ring-white/10 transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/icons/flag-${code}/default.svg`} alt="" width={64} height={48} loading="lazy" decoding="async" className="h-12 w-16 rounded-md object-cover" />
                      </Link>
                      <span role="tooltip" className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 rotate-[9deg] whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover/flag:opacity-100 group-focus-within/flag:opacity-100 motion-reduce:transition-none">
                        {flagName(code)}
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
