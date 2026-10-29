"use client";

import type { ComponentType, CSSProperties } from "react";
import { UiGlyph } from "@/components/ui-glyph";

/**
 * Our own icons under the names and props the site already uses, so every icon on the site is drawn by our set.
 * Props that only make sense for a stroke-only icon library (strokeWidth) are accepted and ignored. A size is honoured,
 * a "fill-current" class asks for the solid look, and below 16px the icon draws as outline on its own.
 */
export interface OwnIconProps {
  className?: string;
  style?: CSSProperties;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  fill?: string;
  absoluteStrokeWidth?: boolean;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

export type OwnIcon = ComponentType<OwnIconProps>;

function make(slug: string, displayName: string): OwnIcon {
  const Icon = ({ className, style, size, color, fill }: OwnIconProps) => {
    const boxed = size !== undefined ? { width: size, height: size } : undefined;
    const classes = className ?? (size === undefined ? "size-6" : "");
    return (
      <UiGlyph
        name={slug}
        look={/\bfill-current\b/.test(classes) || (fill !== undefined && fill !== "none") ? "fill" : undefined}
        className={classes}
        style={boxed || color || style ? { ...boxed, ...(color ? { color } : null), ...style } : undefined}
      />
    );
  };
  Icon.displayName = displayName;
  return Icon;
}

export const Activity = make("activity", "Activity");
export const AlertTriangle = make("triangle-alert", "AlertTriangle");
export const Anchor = make("anchor", "Anchor");
export const ArrowDownAZ = make("sort-az", "ArrowDownAZ");
export const ArrowDownZA = make("sort-za", "ArrowDownZA");
export const ArrowLeft = make("arrow-left", "ArrowLeft");
export const ArrowLeftRight = make("arrow-left-right", "ArrowLeftRight");
export const ArrowRight = make("arrow-right", "ArrowRight");
export const ArrowUpDown = make("arrow-up-down", "ArrowUpDown");
export const ArrowUpRight = make("arrow-up-right", "ArrowUpRight");
export const BarChart3 = make("chart-column", "BarChart3");
export const Binary = make("binary", "Binary");
export const Blocks = make("blocks", "Blocks");
export const BookOpen = make("book-open", "BookOpen");
export const Bot = make("bot", "Bot");
export const Braces = make("braces", "Braces");
export const Calendar = make("calendar", "Calendar");
export const Check = make("check", "Check");
export const CheckCircle = make("circle-check", "CheckCircle");
export const CheckIcon = make("check", "CheckIcon");
export const ChevronDown = make("chevron-down", "ChevronDown");
export const ChevronRight = make("chevron-right", "ChevronRight");
export const ChevronRightIcon = make("chevron-right", "ChevronRightIcon");
export const Clipboard = make("clipboard", "Clipboard");
export const ClipboardCopy = make("clipboard-copy", "ClipboardCopy");
export const Clock = make("clock", "Clock");
export const Cloud = make("cloud", "Cloud");
export const Code = make("code", "Code");
export const Code2 = make("code", "Code2");
export const Compass = make("compass", "Compass");
export const Component = make("component", "Component");
export const Copy = make("copy", "Copy");
export const Database = make("database", "Database");
export const Download = make("download", "Download");
export const ExternalLink = make("external-link", "ExternalLink");
export const Eye = make("eye", "Eye");
export const FileCode = make("file-code", "FileCode");
export const FileCode2 = make("file-code", "FileCode2");
export const FileText = make("file-text", "FileText");
export const Flame = make("flame", "Flame");
export const Folder = make("folder", "Folder");
export const FolderTree = make("folder-tree", "FolderTree");
export const GitBranch = make("git-branch", "GitBranch");
export const GitCompare = make("git-compare", "GitCompare");
export const GitPullRequest = make("git-pull-request", "GitPullRequest");
export const Globe = make("globe", "Globe");
export const Grid2X2 = make("grid-2x2", "Grid2X2");
export const Grid3X3 = make("grid-3x3", "Grid3X3");
export const Hash = make("hash", "Hash");
export const Heart = make("heart", "Heart");
export const HelpCircle = make("circle-question-mark", "HelpCircle");
export const Home = make("house", "Home");
export const Image = make("image", "Image");
export const ImageIcon = make("image", "ImageIcon");
export const Keyboard = make("keyboard", "Keyboard");
export const Layers = make("layers", "Layers");
export const LayoutGrid = make("layout-grid", "LayoutGrid");
export const Lightbulb = make("lightbulb", "Lightbulb");
export const Link = make("link", "Link");
export const Link2 = make("link", "Link2");
export const ListChecks = make("list-checks", "ListChecks");
export const Mail = make("mail", "Mail");
export const MessageSquare = make("message-square", "MessageSquare");
export const Minimize2 = make("minimize-2", "Minimize2");
export const Minus = make("minus", "Minus");
export const Moon = make("moon", "Moon");
export const MoreHorizontal = make("ellipsis", "MoreHorizontal");
export const MousePointerClick = make("mouse-pointer-click", "MousePointerClick");
export const Network = make("network", "Network");
export const Package = make("package", "Package");
export const Palette = make("palette", "Palette");
export const PanelLeftClose = make("panel-left-close", "PanelLeftClose");
export const PanelLeftOpen = make("panel-left-open", "PanelLeftOpen");
export const Pencil = make("pencil", "Pencil");
export const Plug = make("plug", "Plug");
export const Plus = make("plus", "Plus");
export const RefreshCw = make("refresh-cw", "RefreshCw");
export const Rocket = make("rocket", "Rocket");
export const RotateCcw = make("rotate-ccw", "RotateCcw");
export const Rss = make("rss", "Rss");
export const Scale = make("scale", "Scale");
export const Search = make("search", "Search");
export const SearchIcon = make("search", "SearchIcon");
export const Server = make("server", "Server");
export const Shapes = make("shapes", "Shapes");
export const Share = make("share", "Share");
export const Shield = make("shield", "Shield");
export const ShieldCheck = make("shield-check", "ShieldCheck");
export const SlidersHorizontal = make("sliders-horizontal", "SlidersHorizontal");
export const Smartphone = make("smartphone", "Smartphone");
export const Sparkles = make("sparkles", "Sparkles");
export const Star = make("star", "Star");
export const Sun = make("sun", "Sun");
export const Tag = make("tag", "Tag");
export const Terminal = make("terminal", "Terminal");
export const ThumbsDown = make("thumbs-down", "ThumbsDown");
export const ThumbsUp = make("thumbs-up", "ThumbsUp");
export const Trash2 = make("trash", "Trash2");
export const TrendingUp = make("trending-up", "TrendingUp");
export const Upload = make("upload", "Upload");
export const Users = make("users", "Users");
export const Wrench = make("wrench", "Wrench");
export const X = make("x", "X");
export const XCircle = make("circle-x", "XCircle");
export const XIcon = make("x", "XIcon");
export const Zap = make("zap", "Zap");

// Network marks drawn for the social set.
export const Github = make("social-github", "Github");
export const Codepen = make("social-codepen", "Codepen");
export const SocialX = make("social-x", "SocialX");
export const SocialLinkedin = make("social-linkedin", "SocialLinkedin");
export const SocialReddit = make("social-reddit", "SocialReddit");
