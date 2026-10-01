## 2024-05-16 - Help FAB Keyboard Accessibility
**Learning:** Icon-only buttons (like the `?` Help FAB) and small modal controls (like the close `X` button) in this design system were missing clear `focus-visible` states, rendering them functionally invisible to keyboard-only users who rely on tab navigation.
**Action:** When adding interactive elements, always include `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-offset-2` (using the relevant brand color) to ensure keyboard navigation is clear and accessible.

## 2024-05-17 - Keyboard Focus Indicators on Sidebar Navigation
**Learning:** The sidebar navigation items and related interactive elements were missing explicit keyboard focus indicators, making it difficult for keyboard-only users to track their position.
**Action:** Always include `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on interactive elements like buttons and links to ensure clear visibility during keyboard navigation.

## 2024-05-24 - Interactive Sidebar Collapsible Regions Need Native ARIA Wiring
**Learning:** This Next.js UI relies on headless/custom collapsible regions in the sidebar for elements like "Extensions," "Collections," and "Featured." These components lack native `<details>` behavior or established headless UI library equivalents, meaning `aria-expanded` and `aria-controls` states are completely decoupled and often forgotten. Screen readers encounter these as generic buttons with no semantic hint that they reveal content.
**Action:** When working on interactive sidebar navigational or hierarchical elements in this specific codebase, manually audit and enforce `aria-expanded` tied to the state variable and `aria-controls` referencing an explicitly `id`-tagged container. Do not assume the presence of generic `onClick` handlers implies accessible state management here.

## 2024-05-14 - Keyboard focus invisible on structural wrapper elements
**Learning:** Adding focus styles directly to wrapper elements (like the full-height `group/rail` in `sidebar-collapse-toggle.tsx`) without visible backgrounds means the keyboard focus indicator vanishes completely. This breaks accessibility for key interactive navigation patterns.
**Action:** For invisible interaction wrappers that contain a visible inner element (like an icon span), apply `focus-visible:outline-none` to the invisible outer button, and use `group-focus-visible/[name]:ring-2 ...` on the visible interior element so the focus ring highlights the actual visual target.

## 2024-10-24 - Hand-rolled Modal Accessibility
**Learning:** Custom hand-rolled modal overlays (like the Help FAB) may omit native dialog primitives and roles since they do not use standard UI libraries like `@radix-ui/react-dialog`. This renders them effectively invisible or confusing to screen readers because they lack `role="dialog"` and `aria-modal="true"`.
**Action:** When inspecting or adding custom full-screen overlays or modals, verify that the container element includes `role="dialog"`, `aria-modal="true"`, and is properly labeled via `aria-labelledby` or `aria-label`.
