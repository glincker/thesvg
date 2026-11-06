1. **Optimize `USED_DOMAINS` computation**: The expression `DOMAINS.filter((d) => GLYPHS.some((g) => g.domain === d.id))` has an O(N * M) time complexity where N is the number of domains and M is the number of glyphs, since it checks every domain against all glyphs. It is also recalculated dynamically in several places (`src/app/sitemap.ts`, `src/app/ui/category/[domain]/page.tsx`, and `src/components/ui-icons/category-page.tsx`).
   - We will pre-calculate this once in `src/lib/ui-icons/glyphs.ts` to `USED_DOMAINS`.
   - We'll use an O(N) approach: iterate over `GLYPHS` to build a `Set` or `Map` of used domain IDs, then filter `DOMAINS` once.

2. **Refactor usages**:
   - In `src/app/sitemap.ts`, replace `DOMAINS.filter((d) => GLYPHS.some((g) => g.domain === d.id))` with `USED_DOMAINS`. Import it from `glyphs.ts`.
   - In `src/app/ui/category/[domain]/page.tsx`, import `USED_DOMAINS` and replace `usedDomains()`.
   - In `src/components/ui-icons/category-page.tsx`, import `USED_DOMAINS` and replace `DOMAINS.filter((d) => d.id !== domainId && GLYPHS.some((g) => g.domain === d.id))` with `USED_DOMAINS.filter((d) => d.id !== domainId)`.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**

4. **Submit changes**: Commit and push the changes for review.
