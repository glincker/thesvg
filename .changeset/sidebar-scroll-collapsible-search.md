---
"thesvg": patch
---

Make the whole sidebar scrollable with collapsible Collections/Featured

Previously only the Categories list scrolled, so on short viewports the nav,
Collections, and Featured sections above it could become unreachable. The
primary nav stays pinned at the top; Collections, Featured, and Categories now
share one scroll region. Collections and Featured are collapsible to reclaim
space. Also refreshed the OpenSearch descriptor (icon count + a 32px image) so
browser address-bar search stays accurate.
