# Usage and variants

Using icons in React, Vue, Svelte, plain HTML and the CLI, plus the variant system.

Back to the [README](../README.md).

## Usage

### React

```tsx
import { Github, Figma } from "@thesvg/react";

export function Logos() {
  return <Github width={24} height={24} className="text-white" />;
}
```

### Vue

```vue
<script setup>
import { Github, Figma } from "@thesvg/vue";
</script>

<template>
  <Github width="24" height="24" />
</template>
```

### Svelte

```svelte
<script>
  import { Github, Figma } from "@thesvg/svelte";
</script>

<Github width="24" height="24" />
```

### CDN

```html
<img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/default.svg" width="32" height="32" alt="GitHub" />
```

### CLI

```bash
npx @thesvg/cli add github
npx @thesvg/cli search "ai"
```

## Variants

Icons support up to 7 variants to match any design context:

| Variant | Key | Description |
|---------|-----|-------------|
| Default | `default` | Primary brand color |
| Mono | `mono` | Inherits text color |
| Light | `light` | White, for dark backgrounds |
| Dark | `dark` | Black, for light backgrounds |
| Wordmark | `wordmark` | Full text logo |
| Wordmark Light | `wordmarkLight` | White text logo |
| Wordmark Dark | `wordmarkDark` | Dark text logo |

Not every icon has all variants. `default` is always present.
