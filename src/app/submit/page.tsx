import { Suspense } from "react";
import {
  ArrowUpRight,
  CheckCircle,
  FileCode,
  GitBranch,
  GitPullRequest,
  Github,
  Upload,
  Zap,
} from "lucide-react";
import { AdaptiveErrorBoundary } from "@/components/providers/cognicatch-boundary"
import type { Metadata } from "next";
import { getAllCategories, getCategoryCounts, getIconCount } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { SubmitForm } from "@/components/submit/submit-form";

export const metadata: Metadata = {
  title: "Submit an Icon - Add Your Brand SVG",
  description:
    "Every brand deserves a place. Submit your brand SVG icon to theSVG, the open-source brand icon library. No gatekeeping, community-driven.",
  openGraph: {
    title: "Submit an Icon | theSVG",
    description: "Submit your brand SVG to the open-source icon library.",
  },
  alternates: { canonical: "https://thesvg.org/submit" },
};

export default function SubmitPage() {
  const categories = getAllCategories();
  const categoryCounts = getCategoryCounts();
  const iconCount = getIconCount();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-10 xl:grid-cols-[1fr_460px]">
            {/* Left column - Info */}
            <div className="space-y-8">
              {/* Hero header with gradient */}
              <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-orange-50/60 via-background to-amber-50/40 p-6 sm:p-8 dark:border-white/[0.06] dark:from-orange-950/20 dark:via-background dark:to-amber-950/10">
                <div className="relative z-10">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-200/50 bg-orange-50/80 px-3 py-1 text-xs font-medium text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                    <Zap className="h-3 w-3" />
                    {iconCount.toLocaleString()}+ icons and growing
                  </div>
                  <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Submit an Icon</h1>
                  <p className="max-w-lg text-muted-foreground">
                    Every brand deserves a place. No gatekeeping. Drop your SVG, fill in the details,
                    and submit directly via GitHub.
                  </p>
                </div>
                {/* Decorative blob */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl dark:bg-orange-500/5" />
              </div>

              {/* Quick steps - horizontal */}
              <div>
                <h2 className="mb-4 text-sm font-semibold text-foreground">How it works</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Step
                    number={1}
                    icon={<GitBranch className="h-4 w-4" />}
                    title="Fork the repo"
                    description="Fork github.com/GLINCKER/thesvg and clone locally."
                    accent="from-blue-500/10 to-blue-500/5 dark:from-blue-500/10 dark:to-blue-500/5"
                    iconColor="text-blue-500"
                  />
                  <Step
                    number={2}
                    icon={<Upload className="h-4 w-4" />}
                    title="Add your SVGs"
                    description="Place files in public/icons/{slug}/ with proper naming."
                    accent="from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/10 dark:to-emerald-500/5"
                    iconColor="text-emerald-500"
                  />
                  <Step
                    number={3}
                    icon={<FileCode className="h-4 w-4" />}
                    title="Update icons.json"
                    description="Add your entry to src/data/icons.json."
                    accent="from-purple-500/10 to-purple-500/5 dark:from-purple-500/10 dark:to-purple-500/5"
                    iconColor="text-purple-500"
                  />
                  <Step
                    number={4}
                    icon={<GitPullRequest className="h-4 w-4" />}
                    title="Open a PR"
                    description="Run pnpm validate, then open a pull request."
                    accent="from-orange-500/10 to-orange-500/5 dark:from-orange-500/10 dark:to-orange-500/5"
                    iconColor="text-orange-500"
                  />
                </div>
              </div>

              {/* SVG Requirements */}
              <div className="rounded-xl border border-border/40 bg-card/50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <h2 className="mb-3 text-sm font-semibold">SVG Requirements</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Valid SVG/XML markup",
                    "Under 50KB file size",
                    "No embedded scripts or external references",
                    "viewBox attribute present",
                    "Gradients and multi-color SVGs welcome",
                    "You have the right to redistribute the icon",
                  ].map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* GitHub links */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/GLINCKER/thesvg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border hover:bg-card hover:shadow-md dark:border-white/[0.06] dark:hover:border-white/[0.1]"
                >
                  <Github className="h-4 w-4" />
                  View Repository
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
                <a
                  href="https://github.com/GLINCKER/thesvg/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border hover:bg-card hover:shadow-md dark:border-white/[0.06] dark:hover:border-white/[0.1]"
                >
                  <GitPullRequest className="h-4 w-4" />
                  Open Issues
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
              </div>

              {/* Schema example */}
              <div className="rounded-xl border border-border/40 bg-card/50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="border-b border-border/30 px-5 py-3 dark:border-white/[0.04]">
                  <h2 className="text-sm font-semibold">Icon Entry Schema</h2>
                </div>
                <pre className="overflow-auto px-5 py-4 font-mono text-xs leading-relaxed text-foreground/80">
                  <code>{`{
  "slug": "your-brand",
  "title": "Your Brand",
  "aliases": [],
  "hex": "FF5733",
  "categories": ["Software"],
  "variants": {
    "default": "/icons/your-brand/default.svg",
    "mono": "/icons/your-brand/mono.svg",
    "dark": "/icons/your-brand/dark.svg"
  },
  "license": "MIT",
  "url": "https://yourbrand.com"
}`}</code>
                </pre>
              </div>
            </div>

            {/* Right column - Form (sticky) */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 shadow-xl shadow-black/[0.03] dark:border-white/[0.08] dark:from-white/[0.04] dark:to-white/[0.02] dark:shadow-black/30">
                <div className="border-b border-border/30 px-5 py-4 dark:border-white/[0.04]">
                  <h2 className="text-base font-semibold">Quick Submit</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Drop your SVG to validate and submit via GitHub
                  </p>
                </div>
                <div className="p-5">
                  <AdaptiveErrorBoundary 
                    mode="manual" 
                    severity="medium" 
                    title="Something went wrong" 
                    description="An error occurred while loading the submit form. Our team is already investigating the issue."
                  >
                    <SubmitForm availableCategories={categories} />
                  </AdaptiveErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}

function Step({
  number,
  icon,
  title,
  description,
  accent,
  iconColor,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  iconColor: string;
}) {
  return (
    <div className={`flex gap-3 rounded-xl bg-gradient-to-br ${accent} p-4 transition-all hover:shadow-md`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/80 ${iconColor} shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-medium">
          <span className="text-muted-foreground/60">#{number}</span> {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
