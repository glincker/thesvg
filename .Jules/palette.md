## 2024-05-16 - Help FAB Keyboard Accessibility
**Learning:** Icon-only buttons (like the `?` Help FAB) and small modal controls (like the close `X` button) in this design system were missing clear `focus-visible` states, rendering them functionally invisible to keyboard-only users who rely on tab navigation.
**Action:** When adding interactive elements, always include `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-offset-2` (using the relevant brand color) to ensure keyboard navigation is clear and accessible.
