## 2024-10-08 - Accessible Custom Dropdown Toggles
**Learning:** Custom dropdown toggles (like the Ask AI button) that manage their own state need to communicate this to screen readers.
**Action:** Always add `aria-haspopup="menu"` and `aria-expanded={isOpenState}` to custom dropdown toggle buttons.
