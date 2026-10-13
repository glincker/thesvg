## 2024-10-08 - Accessible Custom Dropdown Toggles
**Learning:** Custom dropdown toggles (like the Ask AI button) that manage their own state need to communicate this to screen readers.
**Action:** Always add `aria-haspopup="menu"` and `aria-expanded={isOpenState}` to custom dropdown toggle buttons.
## 2024-10-11 - Add focus-visible to icon-only buttons
**Learning:** Many interactive icon-only buttons in the application were missing explicit keyboard focus styles (`focus-visible:ring`), relying only on `hover` states which are inaccessible to keyboard users. The `focus-visible` utility is crucial for providing clear focus indicators for interactive elements while avoiding the unwanted focus outline on click (which a simple `:focus` might trigger).
**Action:** Always ensure any newly added or modified interactive UI element (especially custom buttons or icon-only controls) includes explicit keyboard focus styles using Tailwind utilities like `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
