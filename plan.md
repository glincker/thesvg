1. **Fix `client-bundle.test.ts` failure**
   - The test `client-bundle.test.ts` asserts that client components never statically import `src/data/icons.json` (directly or indirectly).
   - Our change in `src/lib/icon-quality-score.ts` added an import `countIconVariants` from `src/lib/icons.ts`.
   - `src/lib/icons.ts` imports `src/data/icons.json`.
   - `src/lib/icon-quality-score.ts` is imported by `src/components/icons/detail/quality-score-card.tsx`, which is a `"use client"` component.
   - This indirect import chain causes the test to fail.
   - To fix this without introducing the indirect import, we should revert the import of `countIconVariants` in `src/lib/icon-quality-score.ts`, and instead duplicate the loop inline, as the file previously did with `Object.values(icon.variants).filter(Boolean).length` (or use a simple `Object.values(icon.variants).filter(Boolean).length` again but without chaining... wait, to optimize it inline, just use a `for...in` loop inline in `computeQualityScore`).
   - We will modify `src/lib/icon-quality-score.ts` to implement the counting loop directly inside `computeQualityScore` and remove the `countIconVariants` import.

2. **Implement fix**
   - Replace the `countIconVariants` import and call in `src/lib/icon-quality-score.ts` with an inline `let variantCount = 0; for (const k in icon.variants) if (icon.variants[k as keyof typeof icon.variants]) variantCount++;`.

3. **Verify**
   - Run `pnpm exec vitest run src/lib/__tests__/client-bundle.test.ts`.

4. **Submit**
   - Submit the branch to push the fix.
