import type { Metadata } from "next";
import { Github, Mail, MessageSquare, Shield } from "lucide-react";
import { TRADEMARK_POLICY_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the thesvg team. Report issues, request icon removal, or ask questions.",
  openGraph: {
    title: "Contact | theSVG",
    description:
      "Get in touch with the thesvg team. Report issues, request icon removal, or ask questions.",
    url: "https://thesvg.org/contact",
    siteName: "theSVG",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "theSVG - The Open SVG Brand Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | theSVG",
    description:
      "Get in touch with the thesvg team. Report issues, request icon removal, or ask questions.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://thesvg.org/contact" },
};

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    description: "For trademark requests, DMCA notices, or general inquiries.",
    action: "support@glincker.com",
    href: "mailto:support@glincker.com",
    note: "We respond within 48 hours",
  },
  {
    icon: Github,
    title: "GitHub Issues",
    description: "Report bugs, request features, or submit icon corrections.",
    action: "Open an issue",
    href: "https://github.com/GLINCKER/thesvg/issues/new/choose",
    note: "Best for technical issues",
  },
  {
    icon: MessageSquare,
    title: "GitHub Discussions",
    description: "Ask questions, share ideas, or connect with the community.",
    action: "Start a discussion",
    href: "https://github.com/GLINCKER/thesvg/discussions",
    note: "Best for general questions",
  },
  {
    icon: Shield,
    title: "Trademark Request",
    description:
      "Brand owner? Request icon removal, updates, or add usage guidelines.",
    action: "File a request",
    href: "https://github.com/GLINCKER/thesvg/issues/new?labels=trademark&title=Trademark+Request:+[Brand+Name]",
    note: "Removal requests honored within 24 hours",
  },
];

export default function ContactPage() {
  return (
    <div className="md:pl-58">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">Contact</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Have a question, found a bug, or need to report a trademark issue?
            Reach out through any of the channels below.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_CHANNELS.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target={channel.href.startsWith("mailto") ? undefined : "_blank"}
              rel={
                channel.href.startsWith("mailto")
                  ? undefined
                  : "noopener noreferrer"
              }
              className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-5 transition-all hover:border-border hover:bg-card hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 dark:bg-white/[0.04]">
                  <channel.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {channel.title}
                  </h2>
                  <p className="text-[11px] text-muted-foreground/60">
                    {channel.note}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {channel.description}
              </p>
              <span className="mt-auto text-xs font-medium text-foreground/70 transition-colors group-hover:text-foreground">
                {channel.action} &rarr;
              </span>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border/30 bg-muted/20 p-5 dark:border-white/[0.04] dark:bg-white/[0.01]">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Trademark Policy
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            All brand logos and trademarks on thesvg.org are the property of
            their respective owners. Icons are provided for identification and
            development purposes only. We are not affiliated with or endorsed by
            any listed brand.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            If you are a brand owner and would like your icon removed or updated,
            please{" "}
            <a
              href="mailto:support@glincker.com"
              className="font-medium text-foreground underline underline-offset-2"
            >
              email us
            </a>{" "}
            or read our full{" "}
            <a
              href={TRADEMARK_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Trademark Policy
            </a>
            . Removal requests are honored within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
