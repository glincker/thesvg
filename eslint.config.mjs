import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Brand icons and UI icons stay separate. Each side owns its own code, data and tests, and the only crossings are the
// shared building blocks listed here. Add to an allow list on purpose, in review, never to make a lint error go away.
const UI_CODE = ["src/lib/ui-icons/**", "src/components/ui-icons/**", "src/app/ui/**"];
const UI_PATTERNS = ["@/lib/ui-icons", "@/lib/ui-icons/**", "@/components/ui-icons/**", "@/data/ui/**", "@/data/ui-icons.json"];
// The few brand files that show UI icons next to brand icons: the header switch and search, the home banner, the footer count, the sitemap.
const BRAND_TO_UI_ALLOWED = ["src/components/header.tsx", "src/components/home-hero.tsx", "src/components/footer.tsx", "src/components/search/search-groups.tsx", "src/components/ui-glyph.tsx", "src/app/sitemap.ts"];
// Chrome icons come from our own UI icons (<UiGlyph name="..." />), not from third-party icon libraries. These files are
// already converted; older files still on those libraries move over in their own PRs, and are removed from the gap here.
const OWN_ICONS_ONLY = ["src/components/header.tsx", "src/components/search/search-groups.tsx", "src/components/ui-glyph.tsx", "src/components/packages-menu.tsx", "src/components/extensions/cards.tsx", "src/components/icons/detail/quality-panel.tsx", "src/app/packages/**", "src/components/new-post-toast.tsx", "src/components/filters/category-pills.tsx", "src/components/icons/detail/contribution-cta.tsx", "src/components/icons/detail/icon-inspector-modal.tsx", "src/components/icons/detail/brand-glow.tsx"];
const ICON_LIBRARIES = {
  paths: [
    { name: "lucide-react", message: "Use our own UI icons: <UiGlyph name=\"...\" /> from @/components/ui-glyph." },
    { name: "@phosphor-icons/react", message: "Use our own UI icons: <UiGlyph name=\"...\" /> from @/components/ui-glyph." },
    { name: "@phosphor-icons/react/dist/ssr", message: "Use our own UI icons: <UiGlyph name=\"...\" /> from @/components/ui-glyph." },
  ],
};
const BRAND_ONLY = [
  "@/lib/icons",
  "@/lib/icons-manifest",
  "@/lib/icon-*",
  "@/lib/collections-meta",
  "@/lib/families*",
  "@/lib/hooks/use-icon-search",
  "@/components/home-*",
  "@/components/layout/*",
  "@/data/icons.json",
];
// Brand components UI code may reuse on purpose: the export and editor menus, the score panel, the brand-mark helpers.
const BRAND_COMPONENTS_EXCEPT_SHARED = "^@/components/icons/(?!detail/(download-menu|open-in-editor-menu|quality-panel)$|shared/brand-icons$)";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "packages/*/dist/**",
    "packages/*/node_modules/**",
    "scripts/**",
    "docs-local/**",
    "extensions/**/dist/**",
    // Generated extension build artifacts (WXT: .output/.wxt, Figma: build)
    "extensions/**/.output/**",
    "extensions/**/.wxt/**",
    "extensions/**/build/**",
  ]),
  {
    files: UI_CODE,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          ...ICON_LIBRARIES,
          patterns: [
            { group: BRAND_ONLY, message: "UI icon code must not depend on brand icon code. Share through a neutral module or the allow list in eslint.config.mjs." },
            { regex: BRAND_COMPONENTS_EXCEPT_SHARED, message: "UI icon code must not depend on brand icon components. Only the shared ones in eslint.config.mjs are allowed." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [...UI_CODE, ...BRAND_TO_UI_ALLOWED, ...OWN_ICONS_ONLY, "src/**/__tests__/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          // Phosphor is gone from this site. Files still on Lucide move to our own icons in their own PRs.
          paths: ICON_LIBRARIES.paths.filter((p) => p.name.includes("phosphor")),
          patterns: [{ group: UI_PATTERNS, message: "Brand code must not depend on UI icon code. Only the files in BRAND_TO_UI_ALLOWED may cross over." }],
        },
      ],
    },
  },
  {
    // Converted brand-side files: no icon libraries. The ones that may show UI icons next to brand icons are in BRAND_TO_UI_ALLOWED
    // and need no UI import patterns, the rest keep the brand-to-UI boundary as well.
    files: OWN_ICONS_ONLY,
    ignores: [...BRAND_TO_UI_ALLOWED],
    rules: { "no-restricted-imports": ["error", { ...ICON_LIBRARIES, patterns: [{ group: UI_PATTERNS, message: "Brand code must not depend on UI icon code." }] }] },
  },
  {
    files: BRAND_TO_UI_ALLOWED.filter((f) => OWN_ICONS_ONLY.includes(f)),
    rules: { "no-restricted-imports": ["error", ICON_LIBRARIES] },
  },
  {
    rules: {
      // We intentionally use <img> for thousands of SVG icons - Next Image is overkill for SVGs
      "@next/next/no-img-element": "off",
      // Common pattern for client-side detection (navigator, window) - downgrade to warn
      "react-hooks/set-state-in-effect": "warn",
      // Underscore-prefixed identifiers signal intentional-unused (e.g. _categoryCounts)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
