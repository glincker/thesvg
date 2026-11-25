"use client";

import { useT } from "@/i18n/use-t";
import { CategorySection, type Category } from "@/components/extensions/cards";

// Button labels that repeat across cards; item descriptions stay English because they are product copy.
const CTA_KEYS: Record<string, string> = {
  Install: "install",
  "Build this": "buildThis",
  Docs: "docs",
  "Browse libraries": "browseLibraries",
  "Browse sets": "browseSets",
  "Coming Soon": "comingSoon",
  "View on skills.sh": "viewSkills",
  "View source": "viewSource",
  "Track progress": "trackProgress",
};

/** Quick nav plus category sections with translated headings and button labels. */
export function ExtensionsCategories({ categories }: Readonly<{ categories: Category[] }>) {
  const { t } = useT();
  const translated = categories.map((category) => ({
    ...category,
    label: t(`pages.extensions.cat.${category.id}.label`, { defaultValue: category.label }),
    description: t(`pages.extensions.cat.${category.id}.description`, { defaultValue: category.description }),
    items: category.items.map((item) => {
      const ctaKey = CTA_KEYS[item.cta];
      return ctaKey ? { ...item, cta: t(`pages.extensions.cta.${ctaKey}`, { defaultValue: item.cta }) } : item;
    }),
  }));

  return (
    <>
      <nav
        aria-label={t("pages.extensions.jump", { defaultValue: "Jump to category" })}
        className="mb-12 flex flex-wrap gap-2"
      >
        {translated.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1]"
          >
            {category.label}
          </a>
        ))}
      </nav>

      <div className="space-y-14">
        {translated.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>
    </>
  );
}
