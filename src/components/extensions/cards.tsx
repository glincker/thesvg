import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import { withUtm } from "@/lib/external-link";

export type Status = "available" | "coming-soon" | "community";

export interface Integration {
  name: string;
  description: string;
  status: Status;
  cta: string;
  href: string;
  iconSlug?: string;
  iconFallback?: React.ReactNode;
}

export interface Category {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  items: Integration[];
}

const STATUS_CONFIG: Record<Status, { dot: string; label: string }> = {
  available: { dot: "bg-green-500", label: "Published" },
  "coming-soon": { dot: "bg-orange-500", label: "Planned" },
  community: { dot: "bg-blue-500", label: "Open" },
};

function BrandIcon({ slug, fallback }: { slug?: string; fallback?: React.ReactNode }) {
  if (slug) {
    return (
       
      <img
        src={`/icons/${slug}/default.svg`}
        alt=""
        width={24}
        height={24}
        className="h-6 w-6"
      />
    );
  }
  return <>{fallback}</>;
}

function ExtLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={withUtm(href, "extensions_page")}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
        <UiGlyph name="arrow-up-right" className="h-4 w-4 opacity-50 transition-opacity group-hover/link:opacity-100" />
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
      <UiGlyph name="arrow-right" className="h-4 w-4 opacity-50 transition-opacity group-hover/link:opacity-100" />
    </Link>
  );
}

export function IntegrationCard({ item }: { item: Integration }) {
  const status = STATUS_CONFIG[item.status];

  return (
    <div className="group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-all duration-200 hover:border-border/70 hover:bg-card/60 hover:shadow-xl hover:shadow-black/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04] dark:hover:shadow-black/40">
      {/* Header row: icon + status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80">
          <BrandIcon slug={item.iconSlug} fallback={item.iconFallback} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          <span className="text-[11px] text-muted-foreground">{status.label}</span>
        </div>
      </div>

      {/* Name */}
      <h3 className="mb-1.5 text-sm font-semibold">{item.name}</h3>

      {/* Description */}
      <p className="mb-5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {item.description}
      </p>

      {/* CTA link */}
      <ExtLink
        href={item.href}
        className="group/link inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        {item.cta}
      </ExtLink>
    </div>
  );
}

export function CategorySection({ category }: { category: Category }) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <div className="mb-5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/80 text-foreground/80">
            {category.icon}
          </div>
          <h2 className="text-base font-semibold">{category.label}</h2>
        </div>
        <p className="ml-[38px] text-sm text-muted-foreground">{category.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <IntegrationCard key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

