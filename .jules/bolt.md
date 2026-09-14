## 2024-05-18 - Optimized Array Filters for Large Data Sets
**Learning:** When using React `useMemo` to filter through thousands of objects, string allocations (like `String.toLowerCase()`) or `Array.includes()` within `.filter()` operations can become bottlenecks. The `categoryParam` filtering in `home-content.tsx` performed `categoryParam.toLowerCase()` inside a nested loop for every category of every icon.
**Action:** Hoist repetitive string operations like `toLowerCase()` outside of `.filter()` and `.some()` loops. Convert constraint arrays (like `favorites`) to a `Set` before `.filter()` loop checks to optimize lookup times to O(1).
## Performance Journal

* When doing multiple lookups of items by a unique property (e.g. `slug`) within `useMemo` hooks, pre-computing a single Map and sharing it between hooks (like `iconsBySlug`) is significantly faster than using `Array.prototype.find()` on every item. In `home-hero.tsx`, this optimization (creating a Map vs repeated `.find()` calls on a 10,000 item list) reduced lookup time for 10k iterations from ~3.5 seconds to ~10ms (Map creation time ~3.7ms, map.get lookups ~6.8ms), resolving O(N*M) lookup bottlenecks.

## Recents Time Filtering
O(N) operations inside `.filter()` loops during array memoization are extremely detrimental, particularly if they include array `.find()` lookups on static constants or repeating `Date.now()` calls. Convert these cases to a pre-calculated cutoff value at the start of the `useMemo` block, turning the O(N) internal operation into O(1).

## Performance Optimization: `icons.find` vs Map Lookups in React

**Date:** 2024-03-22
**Component:** `src/components/home-hero.tsx`

**Anti-pattern found:**
Using `.map()` over a list of items (`slugs`) and calling `.find()` on a large dataset (`icons`) inside a `useMemo`. This leads to `O(N * M)` complexity. Furthermore, inside `recentViewedIcons`, a `new Map()` was being instantiated on every `recentViewed` state change, creating unnecessary overhead.

**Solution applied:**
1. Created a memoized `Map` dictionary (`iconsBySlug`) bounded to the `icons` manifest update.
2. Re-used `iconsBySlug` across multiple local render components, allowing `O(1)` resolution for both `popularIcons` and `recentViewedIcons`.

**Measured Impact (Benchmark):**
Simulating with N=5000 icons, M=20 slugs:
- Original implementation `O(N*M)` execution: ~377ms
- Optimized map-based lookup `O(N) initialization + O(M)`: ~6ms
- Resulting speed boost ~60x for dictionary iterations inside the rendering tree.

## Performance Optimizations

* Fixed an O(N^2) issue in `google-2026-landing.tsx` where `.find()` was nested inside a `.map()`.
  * Reduced the lookup complexity from O(M) to O(1) by leveraging a map exported from `src/lib/color-bucket.ts` named `COLOR_BUCKETS_BY_ID`.
  * Re-benchmarking (1,000,000 iterations) resulted in roughly a ~3-5% perf improvement due to the small size of the arrays.

### Date: 2025-03-09
**Optimization:** Avoid allocating Set / map arrays in hot path loops, instead iterate directly over origin arrays. Add fast-path checks (e.g., `str.length === 4`) before executing regular expressions (e.g., `/^\d{4}$/`) in iterations to save significant CPU cycles.

## `pushUnique` array iteration optimization

**What:** Replaced `Array.find` + `Array.filter` + spread operations with `Array.findIndex` + `Array.splice` + `Array.unshift` in state updates (`pushUnique` and `recordCopy` inside `recents-store.ts`).
**Why:** The `Array.filter` method iterated over the entire array to check against a condition, whereas the `findIndex` allows us to instantly jump to the target item, avoiding multiple iterations over the same collection.
**Impact:** ~40% faster execution time for state updates, reducing JS thread blocking in state modification events by effectively halving the operations (especially avoiding a full-array filter on upsert).
## 2025-05-10 - Sorting performance bottleneck
**Learning:** `String.prototype.localeCompare` is a known performance bottleneck for large dataset sorting, it performs up to 3x slower compared to basic string equality (`a < b ? -1 : a > b ? 1 : 0`). In large `useMemo` hooks sorting thousands of elements this can cause UI jank.
**Action:** Default to standard string inequalities when sorting lists on predictable non-localized data types (like slugs, ISO 8601 date strings, ASCII filenames). Furthermore, do not put higher order functions inside loops `(e.g., .filter(icon => icon.categories.some(c => c.toLowerCase())))`. By re-writing to a `for` loop in hot paths, we avoid continuous closure initialisation overhead leading to a ~25-35% faster filter.
