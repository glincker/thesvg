import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Shield, Mail, FileText, Scale, ExternalLink } from "lucide-react";
import { getCategoryCounts } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { withUtm } from "@/lib/external-link";

export const metadata: Metadata = {
  title: "Legal Notice - Trademark Policy, Licenses & DMCA",
  description:
    "Legal information for theSVG including trademark policy, icon licenses, DMCA takedown process, and brand removal requests.",
  alternates: {
    canonical: "https://thesvg.org/legal",
  },
};

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 dark:bg-white/[0.04]">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Scale className="h-3 w-3" />
              Legal
            </div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Legal Notice</h1>
            <p className="text-muted-foreground">
              Trademark policy, licensing, and takedown process for theSVG.
            </p>
          </div>

          <div className="space-y-10">
            {/* License */}
            <Section id="license" icon={FileText} title="License">
              <p>
                The theSVG codebase (website, build tools, npm packages, CLI, API, and MCP
                server) is licensed under the{" "}
                <a
                  href={withUtm("https://github.com/GLINCKER/thesvg/blob/main/LICENSE", "legal_page")}
                  className="text-foreground underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MIT License
                </a>
                .
              </p>
            </Section>

            {/* Trademarks */}
            <Section id="trademarks" icon={Shield} title="Brand Icons & Trademarks">
              <p>
                All brand names, logos, and trademarks included in this library are the
                property of their respective owners. theSVG is <strong>not affiliated
                with, endorsed by, or sponsored by</strong> any of the companies or
                organizations whose brand icons appear here.
              </p>
              <p>
                Brand icons are provided for <strong>identification and development
                purposes only</strong>, consistent with nominative fair use of trademarks.
                This is the same legal basis used by established icon libraries such as
                Simple Icons, Font Awesome (brand icons), and svgl.
              </p>

              <div className="mt-4 rounded-lg border border-border/40 bg-card/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  What this means for users
                </h3>
                <ul className="space-y-1.5 text-xs">
                  <li>You may use these icons to identify a brand in your projects</li>
                  <li>You must comply with each brand&apos;s official usage guidelines</li>
                  <li>theSVG does not grant trademark rights - those remain with the brand owner</li>
                  <li>When in doubt, download official assets from the brand&apos;s press kit</li>
                </ul>
              </div>
            </Section>

            {/* Per-icon licenses */}
            <Section id="licenses" icon={FileText} title="Per-Icon License Metadata">
              <p>
                Every icon in our library includes a license field in its metadata. Here is
                what the common values mean:
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-border/40 dark:border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20 dark:border-white/[0.04]">
                      <th className="px-4 py-2.5 text-left font-medium text-foreground">License</th>
                      <th className="px-4 py-2.5 text-left font-medium text-foreground">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["CC0-1.0", "Public domain dedication, no restrictions"],
                      ["MIT", "Permissive, attribution required"],
                      ["Apache-2.0", "Permissive, attribution + patent grant"],
                      ["Fair Use", "No explicit open license found; included under nominative fair use for brand identification"],
                      ["Custom", "Custom license terms set by the brand"],
                      ["Proprietary", "Brand owns all rights; use only for identification"],
                    ].map(([license, meaning]) => (
                      <tr
                        key={license}
                        className="border-b border-border/10 last:border-0 dark:border-white/[0.03]"
                      >
                        <td className="px-4 py-2.5">
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.04]">
                            {license}
                          </code>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/70">
                Icons marked Fair Use or Proprietary should be used with extra care.
                Review the brand&apos;s guidelines before using in production.
              </p>
            </Section>

            {/* Removal */}
            <Section id="removal" icon={Mail} title="Takedown & Removal">
              <p>
                We respect intellectual property rights. If you are a brand owner or
                authorized representative, you can:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Request removal of your brand&apos;s icon from our library</li>
                <li>Update your brand&apos;s icon to a newer version</li>
                <li>Add usage guidelines that we will link to</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={withUtm("https://github.com/GLINCKER/thesvg/issues/new?template=icon_removal.yml", "legal_page")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open removal request
                </a>
                <a
                  href={withUtm("mailto:support@glincker.com", "legal_page")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]"
                >
                  <Mail className="h-3 w-3" />
                  support@glincker.com
                </a>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/70">
                We acknowledge requests within 48 hours and process removals within 24 hours.
              </p>
            </Section>

            {/* DMCA */}
            <Section id="dmca" icon={Scale} title="DMCA Process">
              <p>
                For copyright infringement claims under the Digital Millennium Copyright Act:
              </p>
              <ol className="list-inside list-decimal space-y-1.5">
                <li>
                  Send a written notice to <strong>support@glincker.com</strong> identifying
                  the copyrighted material, your contact information, and a statement that
                  you are the rights holder or authorized agent
                </li>
                <li>We will acknowledge receipt within 48 hours</li>
                <li>Infringing material will be removed within 24 hours of verification</li>
              </ol>
            </Section>

            {/* Prior art */}
            <Section id="prior-art" icon={FileText} title="Prior Art">
              <p>
                Distributing brand icons under nominative fair use is established practice
                in the open-source ecosystem:
              </p>
              <ul className="mt-2 space-y-1.5">
                {[
                  { name: "Simple Icons", url: "https://simpleicons.org", desc: "3,400+ brand icons under CC0" },
                  { name: "Font Awesome", url: "https://fontawesome.com", desc: "Brand icons in the free icon set" },
                  { name: "svgl", url: "https://svgl.app", desc: "600+ brand SVGs under MIT" },
                  { name: "Devicon", url: "https://devicon.dev", desc: "Developer brand icons under MIT" },
                ].map((lib) => (
                  <li key={lib.name}>
                    <a
                      href={withUtm(lib.url, "legal_page")}
                      className="text-foreground underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lib.name}
                    </a>
                    {" - "}
                    {lib.desc}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* Footer links */}
          <div className="mt-12 flex flex-wrap gap-3 border-t border-border/30 pt-6 dark:border-white/[0.04]">
            <Link
              href="/"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Home
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <a
              href={withUtm("https://github.com/GLINCKER/thesvg/blob/main/TRADEMARK.md", "legal_page")}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              TRADEMARK.md
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a
              href={withUtm("https://github.com/GLINCKER/thesvg/blob/main/CONTRIBUTING.md", "legal_page")}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              CONTRIBUTING.md
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a
              href={withUtm("https://github.com/GLINCKER/thesvg/blob/main/LICENSE", "legal_page")}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              LICENSE
            </a>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
