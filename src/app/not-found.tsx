import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated SVG illustration */}
      <div className="relative mb-8">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground/20"
        >
          {/* Broken icon frame */}
          <rect
            x="40"
            y="30"
            width="120"
            height="140"
            rx="16"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          {/* Question mark */}
          <text
            x="100"
            y="120"
            textAnchor="middle"
            className="fill-muted-foreground/30 text-7xl font-bold"
            style={{ fontSize: "80px" }}
          >
            ?
          </text>
        </svg>

        {/* Floating search icon */}
        <div className="absolute -top-2 -right-2 rounded-full border border-border bg-background p-2 shadow-lg">
          <Search className="h-5 w-5 text-orange-500" />
        </div>
      </div>

      {/* Text */}
      <h1 className="mb-2 text-4xl font-bold tracking-tight">
        <span className="text-orange-500">404</span> - Icon Not Found
      </h1>
      <p className="mb-2 max-w-md text-sm text-muted-foreground">
        This icon might have been moved, renamed, or doesn&apos;t exist yet.
      </p>
      <p className="mb-8 max-w-md text-xs text-muted-foreground/60">
        We have 5,600+ icons across brands, AWS, Azure, and GCP. Try searching for what you need.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
          <Home className="h-4 w-4" />
          Browse Icons
        </Link>
        <Link href="/collection/aws" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]">
          AWS Icons
        </Link>
        <Link href="/collection/azure" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]">
          Azure Icons
        </Link>
        <Link href="/collection/gcp" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]">
          GCP Icons
        </Link>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to home
      </Link>
    </div>
  );
}
