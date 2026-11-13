"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import flagCodes from "@/data/flag-codes.json";

const ALL = flagCodes as [string, string][];
const NAMES = new Map(ALL);

// First paint uses a fixed, widely known set; after mount the rows are drawn at random from every flag.
const INITIAL = [
  "us", "gb", "de", "fr", "es", "it", "jp", "cn", "in", "br", "ca", "au", "mx", "kr", "ru", "nl", "se", "ch", "pl", "tr",
  "ar", "za", "ng", "eg", "sa", "ae", "id", "th", "vn", "ph", "pt", "gr", "ie", "nz", "il", "ua", "ke", "cl", "co", "no",
  "dk", "fi", "at", "be", "cz", "hu", "ro", "sg", "my", "pk", "bd", "ma", "gh", "pe", "ve", "cu", "is", "hr", "rs", "ee",
  "lv", "lt", "sk", "si", "bg", "lu", "mt", "cy", "qa", "kw", "jo", "lb", "iq", "ir", "af", "np", "lk", "mm", "kh", "la",
].filter((c) => NAMES.has(c));

const ROWS = [
  { dir: "left", speed: "b" },
  { dir: "right", speed: "d" },
  { dir: "left", speed: "a" },
  { dir: "right", speed: "c" },
  { dir: "left", speed: "e" },
  { dir: "right", speed: "b" },
] as const;

const PER_ROW = 20;

function shuffled(codes: string[]): string[] {
  const a = [...codes];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Five angled rows of flags drifting in opposite directions. Each row shows its own flags, so none repeat on screen. */
export function FlagsHeroVisual() {
  const [pool, setPool] = useState<string[]>(INITIAL);
  useEffect(() => {
    setPool(shuffled(ALL.map(([c]) => c)));
  }, []);

  return (
    <div className="flags-scene relative h-[19rem] w-[34rem] -rotate-[9deg] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] xl:w-[40rem]">
      <div className="flex h-full flex-col justify-center gap-3">
        {ROWS.map((row, r) => {
          const codes = pool.slice(r * PER_ROW, (r + 1) * PER_ROW);
          return (
            <div key={r} className="flags-row relative flex w-max gap-3 hover:z-20" data-dir={row.dir} data-speed={row.speed}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1 ? true : undefined}>
                  {codes.map((code) => (
                    <li key={`${copy}-${code}`} className="group/flag relative">
                      <Link
                        href={`/icon/flag-${code}`}
                        prefetch={false}
                        tabIndex={copy === 1 ? -1 : undefined}
                        aria-label={`${NAMES.get(code) ?? code} flag`}
                        className="pointer-events-auto block rounded-md ring-1 ring-white/10 transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/icons/flag-${code}/default.svg`} alt="" width={48} height={36} loading="lazy" decoding="async" className="h-9 w-12 rounded object-cover" />
                      </Link>
                      <span role="tooltip" className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 rotate-[9deg] whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[0.6875rem] font-medium text-white opacity-0 transition-opacity duration-150 group-hover/flag:opacity-100 group-focus-within/flag:opacity-100 motion-reduce:transition-none">
                        {NAMES.get(code) ?? code}
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
