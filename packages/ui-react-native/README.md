# @thesvg/ui-react-native

React Native components for the UI icons from [thesvg.org/ui](https://thesvg.org/ui). Needs `react-native-svg`.

```tsx
import { BellIcon, BellFillIcon } from "@thesvg/ui-react-native";

<BellIcon size={24} color="#111111" />
<BellFillIcon size={24} color="#f97316" />
```

One export per look: `BellIcon` is outline, the others add the look (`BellGlassIcon`, `BellDuotoneIcon`, `BellOffsetIcon`, `BellFillIcon`, `BellGlassOutlineIcon`, `BellDepthIcon`). Unused looks are dropped by your bundler.
