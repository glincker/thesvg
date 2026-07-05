---
"thesvg": patch
---

Fix conditional hook call in IconPageClient

`useMemo` was called after an early `return null`, which violates the
rules of hooks and could throw when an icon slug has no match. Hooks now
run before the early return, with null-guarded memo bodies.
