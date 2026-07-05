---
"thesvg": patch
---

Fix announcement bar overlap and prioritize brand categories in the sidebar

- The top announcement bar no longer overlaps the header and sidebar. The bar
  publishes its height as a `--banner-h` CSS variable, and the sticky header and
  fixed sidebar offset by it, so they always sit below the bar (and revert
  cleanly when it is dismissed). Also polished the bar styling (pulse dot,
  subtle orange gradient, clearer link and dismiss affordance).
- The sidebar Categories list now counts brand and community icons only, so
  cloud architecture taxonomy (Compute, Integration, Kubernetes, General, ...)
  no longer buries brand categories. Architecture categories still appear when
  the AWS/Azure/GCP/Kubernetes collection is selected.
