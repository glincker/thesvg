## 2024-05-18 - Optimized Array Filters for Large Data Sets
**Learning:** When using React `useMemo` to filter through thousands of objects, string allocations (like `String.toLowerCase()`) or `Array.includes()` within `.filter()` operations can become bottlenecks. The `categoryParam` filtering in `home-content.tsx` performed `categoryParam.toLowerCase()` inside a nested loop for every category of every icon.
**Action:** Hoist repetitive string operations like `toLowerCase()` outside of `.filter()` and `.some()` loops. Convert constraint arrays (like `favorites`) to a `Set` before `.filter()` loop checks to optimize lookup times to O(1).

## Performance Journal

* When doing multiple lookups of items by a unique property (e.g. `slug`) within `useMemo` hooks, pre-computing a single Map and sharing it between hooks (like `iconsBySlug`) is significantly faster than using `Array.prototype.find()` on every item. In `home-hero.tsx`, this optimization (creating a Map vs repeated `.find()` calls on a 10,000 item list) reduced lookup time for 10k iterations from ~3.5 seconds to ~10ms (Map creation time ~3.7ms, map.get lookups ~6.8ms), resolving O(N*M) lookup bottlenecks.

## Recents Time Filtering
O(N) operations inside `.filter()` loops during array memoization are extremely detrimental, particularly if they include array `.find()` lookups on static constants or repeating `Date.now()` calls. Convert these cases to a pre-calculated cutoff value at the start of the `useMemo` block, turning the O(N) internal operation into O(1).
