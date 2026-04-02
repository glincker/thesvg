import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  ]),
  {
    rules: {
      // We intentionally use <img> for 3,847+ SVG icons - Next Image is overkill for SVGs
      "@next/next/no-img-element": "off",
      // Common pattern for client-side detection (navigator, window) - downgrade to warn
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
