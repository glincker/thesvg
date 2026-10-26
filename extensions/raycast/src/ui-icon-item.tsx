import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  List,
  environment,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import {
  UI_LOOKS,
  getUiIconPageUrl,
  getUiIconUrl,
  getUiSvg,
  toDataUri,
  toJsx,
  toPreviewDataUri,
  toUiHtmlImg,
  type UiIconEntry,
  type UiLook,
} from "./api";

function previewColor(): string {
  return environment.appearance === "dark" ? "#E5E7EB" : "#1F2937";
}

async function copyUiSvg(
  icon: UiIconEntry,
  look: UiLook,
  format: "svg" | "jsx" | "dataUri",
) {
  try {
    const svg = await getUiSvg(icon.slug, look);
    const content =
      format === "jsx"
        ? toJsx(svg, icon.slug)
        : format === "dataUri"
          ? toDataUri(svg)
          : svg;
    await Clipboard.copy(content);
    await showToast({
      style: Toast.Style.Success,
      title: `Copied ${icon.title} (${look})`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to copy SVG",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export function UiIconListItem({
  icon,
  look,
  onLookChange,
}: {
  icon: UiIconEntry;
  look: UiLook;
  onLookChange: (look: UiLook) => void;
}) {
  const { data: svg } = useCachedPromise(getUiSvg, [icon.slug, look]);
  const preview = svg ? toPreviewDataUri(svg, previewColor()) : undefined;

  return (
    <List.Item
      id={`ui:${icon.slug}`}
      title={icon.title}
      subtitle={icon.category}
      icon={preview ? { source: preview } : Icon.Image}
      accessories={[
        ...icon.tags.slice(0, 3).map((tag) => ({ tag })),
        { text: look, icon: Icon.Layers },
        { tag: { value: "UI" } },
      ]}
      keywords={[icon.slug, icon.category, ...icon.tags]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Copy">
            <Action
              title="Copy SVG"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
              onAction={() => copyUiSvg(icon, look, "svg")}
            />
            <Action
              title="Copy as JSX Component"
              icon={Icon.Code}
              shortcut={{ modifiers: ["cmd", "shift"], key: "j" }}
              onAction={() => copyUiSvg(icon, look, "jsx")}
            />
            <Action.CopyToClipboard
              title="Copy as HTML Img Tag"
              content={toUiHtmlImg(icon.slug, icon.title, look)}
              icon={Icon.Globe}
              shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
            />
            <Action
              title="Copy as Data URI"
              icon={Icon.Link}
              shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
              onAction={() => copyUiSvg(icon, look, "dataUri")}
            />
            <Action.CopyToClipboard
              title="Copy Direct URL"
              content={getUiIconUrl(icon.slug, look)}
              shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Look">
            <ActionPanel.Submenu
              title="Choose Look"
              icon={Icon.Layers}
              shortcut={{ modifiers: ["cmd"], key: "l" }}
            >
              {UI_LOOKS.map((l) => (
                <Action
                  key={l}
                  title={l === look ? `${l} (current)` : l}
                  onAction={() => onLookChange(l)}
                />
              ))}
            </ActionPanel.Submenu>
          </ActionPanel.Section>
          <ActionPanel.Section title="Open">
            <Action.OpenInBrowser
              title="Open on TheSVG"
              url={getUiIconPageUrl(icon.slug)}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
