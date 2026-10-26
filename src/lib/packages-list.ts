export interface PackageEntry {
  name: string;
  /** Folder under packages/, used to read the live version and description at build time. */
  dir: string;
  group: "brand" | "ui" | "tools";
  label: string;
}

/** Every package published under the thesvg umbrella. One list feeds the header menu and the /packages page. */
export const PACKAGES: PackageEntry[] = [
  { name: "thesvg", dir: "thesvg", group: "brand", label: "Everything in one" },
  { name: "@thesvg/icons", dir: "icons", group: "brand", label: "Raw SVG data" },
  { name: "@thesvg/react", dir: "react", group: "brand", label: "React" },
  { name: "@thesvg/vue", dir: "vue", group: "brand", label: "Vue" },
  { name: "@thesvg/svelte", dir: "svelte", group: "brand", label: "Svelte" },
  { name: "@thesvg/react-native", dir: "react-native", group: "brand", label: "React Native" },
  { name: "@thesvg/ui", dir: "ui", group: "ui", label: "Raw files and manifest" },
  { name: "@thesvg/ui-react", dir: "ui-react", group: "ui", label: "React" },
  { name: "@thesvg/ui-vue", dir: "ui-vue", group: "ui", label: "Vue" },
  { name: "@thesvg/ui-svelte", dir: "ui-svelte", group: "ui", label: "Svelte" },
  { name: "@thesvg/ui-react-native", dir: "ui-react-native", group: "ui", label: "React Native" },
  { name: "@thesvg/cli", dir: "cli", group: "tools", label: "Command line" },
  { name: "@thesvg/mcp-server", dir: "mcp", group: "tools", label: "MCP server" },
];

export const GROUP_TITLES: Record<PackageEntry["group"], string> = {
  brand: "Brand icons",
  ui: "UI icons",
  tools: "Tools",
};

export const npmUrl = (name: string): string => `https://www.npmjs.com/package/${name}`;
export const installCommand = (name: string): string => (name === "@thesvg/cli" ? "npx @thesvg/cli" : `npm install ${name}`);
