import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Shield, Database, Globe, Clipboard, BarChart3, Mail } from "lucide-react";
import { getCategoryCounts } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export const metadata: Metadata = {
  title: "Privacy Policy - thesvg Browser Extension",
  description:
    "Privacy policy for the thesvg browser extension. No personal data collected, no tracking, no analytics. Local-only preferences and public CDN requests.",
  alternates: {
    canonical: "https://thesvg.org/privacy",
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

export default function PrivacyPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Shield className="h-3 w-3" />
              Privacy
            </div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Applies to the thesvg browser extension for Chrome, Firefox, and Edge.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Effective date: 2026-06-12
            </p>
          </div>

          <div className="space-y-10">
            <Section id="summary" icon={Shield} title="Summary">
              <p>
                The thesvg browser extension collects no personal data. It does not
                track you, does not phone home, and does not share anything with
                anyone. Your search history, copy actions, and preferences stay on
                your device.
              </p>
            </Section>

            <Section id="what-it-does" icon={Globe} title="What the extension does">
              <p>
                The thesvg extension lets you search and copy brand SVG icons
                directly from your browser toolbar. When you open the popup, you can
                search for a brand by name, preview icon variants, and copy the SVG
                code, a CDN URL, or a markdown snippet to your clipboard.
              </p>
            </Section>

            <Section id="data-collected" icon={Database} title="Data collected">
              <p>
                <strong>None.</strong> The extension does not collect, store
                remotely, or transmit any personally identifiable information.
              </p>
            </Section>

            <Section id="local-storage" icon={Database} title="Local storage">
              <p>
                The extension uses the browser&apos;s built-in{" "}
                <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.04]">
                  storage.local
                </code>{" "}
                API to save:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Your recently viewed icons, stored as icon slugs such as &quot;github&quot;</li>
                <li>Your preferred copy format (SVG, CDN URL, or Markdown)</li>
                <li>Your preferred display mode if you toggle light or dark</li>
              </ul>
              <p>
                This data lives only in your browser&apos;s local storage on your
                device. It is never synced to any server, never included in any
                network request, and is deleted when you uninstall the extension.
              </p>
            </Section>

            <Section id="network" icon={Globe} title="Network requests">
              <p>
                The extension fetches SVG files from the jsDelivr public CDN (
                <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.04]">
                  https://cdn.jsdelivr.net/
                </code>
                ) when you preview or copy an icon. This is a standard public HTTP
                request to retrieve a publicly available file. No cookies,
                authentication tokens, or user identifiers are included in these
                requests.
              </p>
              <p>
                jsDelivr&apos;s own privacy policy applies to requests made to their
                CDN:{" "}
                <a
                  href="https://www.jsdelivr.com/privacy-policy-jsdelivr-net"
                  className="text-foreground underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  jsdelivr.com/privacy-policy-jsdelivr-net
                </a>
              </p>
              <p>The extension makes no other network requests.</p>
            </Section>

            <Section id="clipboard" icon={Clipboard} title="Clipboard access">
              <p>
                The extension uses the browser{" "}
                <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.04]">
                  clipboardWrite
                </code>{" "}
                permission to copy content to your clipboard when you click a copy
                button. The extension never reads from your clipboard.
              </p>
            </Section>

            <Section id="analytics" icon={BarChart3} title="Analytics and tracking">
              <p>
                None. The extension contains no analytics SDK, no error reporting
                service, no tracking pixels, and no remote logging.
              </p>
            </Section>

            <Section id="remote-code" icon={Shield} title="Remote code">
              <p>
                None. All extension logic is bundled locally and reviewed as part of
                the open-source codebase at{" "}
                <a
                  href="https://github.com/GLINCKER/thesvg"
                  className="text-foreground underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/GLINCKER/thesvg
                </a>
                . The extension does not load or execute any code from remote
                servers.
              </p>
            </Section>

            <Section id="third-parties" icon={Globe} title="Third-party services">
              <p>
                The only third-party service the extension interacts with is the
                jsDelivr CDN for fetching SVG files, as described above.
              </p>
            </Section>

            <Section id="children" icon={Shield} title="Children's privacy">
              <p>
                The extension is a developer tool and is not directed at children
                under 13. It collects no data from any user.
              </p>
            </Section>

            <Section id="changes" icon={Shield} title="Changes to this policy">
              <p>
                If this policy changes materially, the updated version will be
                published at this URL and the extension listing will be updated
                accordingly.
              </p>
            </Section>

            <Section id="contact" icon={Mail} title="Contact">
              <p>
                Questions about privacy:{" "}
                <a
                  href="mailto:support@glincker.com"
                  className="text-foreground underline underline-offset-2"
                >
                  support@glincker.com
                </a>
              </p>
            </Section>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-border/30 pt-6 dark:border-white/[0.04]">
            <Link
              href="/"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Home
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link
              href="/legal"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Legal Notice
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <a
              href="https://github.com/GLINCKER/thesvg"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
