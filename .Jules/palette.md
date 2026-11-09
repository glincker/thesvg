## 2025-02-12 - Help FAB Accessibility
**Learning:** Adding screen reader properties (`aria-haspopup`, `aria-expanded`) to custom interactive elements and removing redundant screen reader announcements (via `aria-hidden` on nested visual icons) creates a significant accessibility improvement for screen readers when the element controls modal dialogs without native `<button>` mappings.
**Action:** Always verify custom FAB elements have `aria-haspopup` if opening menus/dialogs and hide inner visual icons with `aria-hidden` if the wrapper already has an `aria-label`.
