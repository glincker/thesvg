## 2024-05-16 - Help FAB Keyboard Accessibility
**Learning:** Icon-only buttons (like the `?` Help FAB) and small modal controls (like the close `X` button) in this design system were missing clear `focus-visible` states, rendering them functionally invisible to keyboard-only users who rely on tab navigation.
**Action:** When adding interactive elements, always include `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-offset-2` (using the relevant brand color) to ensure keyboard navigation is clear and accessible.

## 2024-05-17 - Keyboard Focus Indicators on Sidebar Navigation
**Learning:** The sidebar navigation items and related interactive elements were missing explicit keyboard focus indicators, making it difficult for keyboard-only users to track their position.
**Action:** Always include `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on interactive elements like buttons and links to ensure clear visibility during keyboard navigation.
