import {
  Action,
  ActionPanel,
  Clipboard,
  Color,
  Detail,
  Icon,
  List,
  getPreferenceValues,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState, useCallback } from "react";
import {
  searchIcons,
  getIcon,
  getCategories,
  getIconUrl,
  getIconPageUrl,
  getCdnUrl,
  type IconEntry,
  type SearchResult,
} from "./api";

interface Preferences {
  defaultVariant: string;
}

export default function SearchIcons() {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("all");

  const { data: categories } = useCachedPromise(getCategories);

  const fetchIcons = useCallback(
    () => searchIcons(searchText || undefined, category, 100),
    [searchText, category],
  );

  const { data, isLoading } = useCachedPromise(
    fetchIcons,
    [],
    { keepPreviousData: true },
  );

  const icons = data?.icons ?? [];

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search 4,000+ brand icons..."
      filtering={false}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by category"
          value={category}
          onChange={setCategory}
        >
          <List.Dropdown.Item title="All Categories" value="all" />
          <List.Dropdown.Section title="Categories">
            {(categories ?? []).map((cat) => (
              <List.Dropdown.Item
                key={cat.name}
                title={`${cat.name} (${cat.count})`}
                value={cat.name}
              />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {icons.map((icon) => (
        <IconListItem key={icon.slug} icon={icon} />
      ))}
      {icons.length === 0 && !isLoading && (
        <List.EmptyView
          title="No icons found"
          description={searchText ? `No results for "${searchText}"` : "Try a different category"}
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}

function IconListItem({ icon }: { icon: IconEntry }) {
  const iconUrl = getIconUrl(icon.slug);
  const hexColor = icon.hex && icon.hex !== "fff" && icon.hex !== "000" ? `#${icon.hex}` : undefined;

  return (
    <List.Item
      id={icon.slug}
      title={icon.title}
      subtitle={icon.categories.slice(0, 2).join(", ")}
      icon={{ source: iconUrl, fallback: Icon.Image }}
      accessories={[
        ...(icon.variants.length > 1
          ? [{ text: `${icon.variants.length} variants`, icon: Icon.Layers }]
          : []),
        ...(hexColor
          ? [{ tag: { value: icon.hex, color: hexColor as Color } }]
          : []),
      ]}
      keywords={[icon.slug, ...icon.categories]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Copy">
            <CopySvgAction slug={icon.slug} title={icon.title} />
            <Action.CopyToClipboard
              title="Copy CDN URL"
              content={getIconUrl(icon.slug)}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action.CopyToClipboard
              title="Copy jsDelivr URL"
              content={getCdnUrl(icon.slug)}
              shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
            />
            {icon.hex && (
              <Action.CopyToClipboard
                title={`Copy Color #${icon.hex}`}
                content={`#${icon.hex}`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section title="Open">
            <Action.OpenInBrowser
              title="Open on theSVG"
              url={getIconPageUrl(icon.slug)}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
            {icon.url && (
              <Action.OpenInBrowser
                title="Open Brand Website"
                url={icon.url}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section title="View">
            <Action.Push
              title="View Details"
              icon={Icon.Eye}
              target={<IconDetailView slug={icon.slug} />}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function CopySvgAction({ slug, title }: { slug: string; title: string }) {
  const { defaultVariant } = getPreferenceValues<Preferences>();

  return (
    <Action
      title="Copy SVG"
      icon={Icon.Clipboard}
      shortcut={{ modifiers: ["cmd"], key: "c" }}
      onAction={async () => {
        try {
          const toast = await showToast({ style: Toast.Style.Animated, title: "Fetching SVG..." });
          const detail = await getIcon(slug);
          const variant = detail.variants[defaultVariant] ?? detail.variants["default"];
          if (variant?.svg) {
            await Clipboard.copy(variant.svg);
            toast.style = Toast.Style.Success;
            toast.title = `Copied ${title} SVG`;
          } else {
            toast.style = Toast.Style.Failure;
            toast.title = "SVG not available";
          }
        } catch (error) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Failed to copy SVG",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }}
    />
  );
}

function IconDetailView({ slug }: { slug: string }) {
  const { data: icon, isLoading } = useCachedPromise(getIcon, [slug]);

  if (!icon) {
    return <Detail isLoading={isLoading} markdown="Loading icon details..." />;
  }

  const variantKeys = Object.keys(icon.variants);
  const defaultSvg = icon.variants["default"]?.svg ?? "";
  const svgPreview = defaultSvg
    ? `<img src="${getIconUrl(slug)}" width="128" height="128" />`
    : "";

  const markdown = `
# ${icon.title}

${svgPreview}

## Variants (${variantKeys.length})

${variantKeys.map((v) => `- \`${v}\` - [Preview](${getIconUrl(slug, v)})`).join("\n")}

## SVG Source

\`\`\`xml
${defaultSvg.substring(0, 2000)}${defaultSvg.length > 2000 ? "\n... (truncated)" : ""}
\`\`\`
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Slug" text={icon.name} />
          <Detail.Metadata.Label
            title="Color"
            text={`#${icon.hex}`}
            icon={{ source: Icon.CircleFilled, tintColor: `#${icon.hex}` as Color }}
          />
          <Detail.Metadata.TagList title="Categories">
            {icon.categories.map((cat) => (
              <Detail.Metadata.TagList.Item key={cat} text={cat} />
            ))}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label
            title="Variants"
            text={variantKeys.join(", ")}
          />
          <Detail.Metadata.Separator />
          {icon.url && (
            <Detail.Metadata.Link title="Website" text={icon.url} target={icon.url} />
          )}
          {icon.guidelines && (
            <Detail.Metadata.Link
              title="Brand Guidelines"
              text="View Guidelines"
              target={icon.guidelines}
            />
          )}
          <Detail.Metadata.Link
            title="theSVG Page"
            text={`thesvg.org/icon/${icon.name}`}
            target={getIconPageUrl(icon.name)}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="CDN" text={getIconUrl(slug)} />
          <Detail.Metadata.Label title="jsDelivr" text={getCdnUrl(slug)} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Copy">
            {variantKeys.map((variant) => (
              <Action
                key={variant}
                title={`Copy ${variant} SVG`}
                icon={Icon.Clipboard}
                onAction={async () => {
                  const svg = icon.variants[variant]?.svg;
                  if (svg) {
                    await Clipboard.copy(svg);
                    await showToast({
                      style: Toast.Style.Success,
                      title: `Copied ${icon.title} (${variant})`,
                    });
                  }
                }}
              />
            ))}
          </ActionPanel.Section>
          <ActionPanel.Section title="Copy URLs">
            <Action.CopyToClipboard
              title="Copy CDN URL"
              content={getIconUrl(slug)}
            />
            <Action.CopyToClipboard
              title="Copy jsDelivr URL"
              content={getCdnUrl(slug)}
            />
            <Action.CopyToClipboard
              title="Copy Color"
              content={`#${icon.hex}`}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Open">
            <Action.OpenInBrowser
              title="Open on theSVG"
              url={getIconPageUrl(slug)}
            />
            {icon.url && (
              <Action.OpenInBrowser title="Open Brand Website" url={icon.url} />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
