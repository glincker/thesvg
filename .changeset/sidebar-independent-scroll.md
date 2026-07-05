---
"thesvg": patch
---

Make the sidebar category list scroll independently

The sidebar is a fixed-height flex column, but the categories ScrollArea
had `flex-1` without `min-h-0`, so it could not shrink below its content
height and the list overflowed the sidebar instead of scrolling. Adding
`min-h-0` lets the ScrollArea shrink within the column so the long
category list scrolls on its own while the top navigation stays in place.
