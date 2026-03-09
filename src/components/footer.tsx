import { Github, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 md:pl-58">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Top row */}
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="font-semibold text-foreground">
                theSVG
              </Link>
              <span className="hidden text-border sm:inline">|</span>
              <span className="hidden sm:inline">The Open SVG Brand Library</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/submit" className="transition-colors hover:text-foreground">
                Submit
              </Link>
              <Link href="/contact" className="transition-colors hover:text-foreground">
                Contact
              </Link>
              <a
                href="https://github.com/glincker/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
              <a
                href="https://glincker.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-colors hover:text-foreground"
              >
                GLINR
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-border pt-4">
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
              All brand logos and trademarks are the property of their respective owners.
              Icons are provided for identification and development purposes only.
              This project is not affiliated with or endorsed by any of the brands listed.
              For official assets, visit the brand&apos;s website.{" "}
              <a
                href="https://github.com/GLINCKER/thesvg/blob/main/TRADEMARK.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
              >
                Trademark Policy
              </a>
            </p>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground/50">
              Built with <Heart className="h-2.5 w-2.5 fill-red-500/50 text-red-500/50" /> by the open-source community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
