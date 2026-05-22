"use client";

import { useCallback, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardCopy,
  Codepen,
  Download as DownloadIcon,
  ExternalLink,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  DEEP_LINK_TARGETS,
  type DeepLinkTarget,
  openDeepLink,
} from "@/lib/svg-utils";
import Link from "next/link";

interface OpenInEditorMenuProps {
  svg: string;
  title: string;
  slug: string;
  /** Public URL to the SVG (used for partners that accept ?src= deep links). */
  srcUrl?: string;
}

function TargetIcon({ id }: { id: string }) {
  if (id === "codepen") return <Codepen className="h-3.5 w-3.5" />;
  if (id === "filagram")
    return (
      <img
        src="/icons/filagram/default.svg"
        alt=""
        className="h-3.5 w-3.5 object-contain"
      />
    );
  if (id === "figma")
    return (
      <img
        src="/icons/figma/default.svg"
        alt=""
        className="h-3.5 w-3.5 object-contain"
      />
    );
  if (id === "sketch")
    return (
      <>
        <img
          src="/icons/sketch/light.svg"
          alt=""
          className="h-3.5 w-3.5 object-contain dark:hidden"
        />
        <img
          src="/icons/sketch/dark.svg"
          alt=""
          className="hidden h-3.5 w-3.5 object-contain dark:block"
        />
      </>
    );
  if (id === "illustrator") return <DownloadIcon className="h-3.5 w-3.5" />;
  return <ExternalLink className="h-3.5 w-3.5" />;
}

function KindIcon({ kind }: { kind: DeepLinkTarget["kind"] }) {
  if (kind === "copy")
    return <ClipboardCopy className="h-3 w-3 opacity-40" />;
  if (kind === "download")
    return <DownloadIcon className="h-3 w-3 opacity-40" />;
  return <ArrowUpRight className="h-3 w-3 opacity-40" />;
}

export function OpenInEditorMenu({
  svg,
  title,
  slug,
  srcUrl,
}: OpenInEditorMenuProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; msg: string } | null>(null);

  const handleClick = useCallback(
    async (target: DeepLinkTarget) => {
      if (busy) return;
      setBusy(target.id);
      const result = await openDeepLink(target, svg, title, { srcUrl });
      setBusy(null);
      if (result.ok) {
        const msg = result.message ?? "Opened in new tab.";
        setToast({ id: target.id, msg });
        setTimeout(() => setToast(null), 2400);
      } else {
        setToast({ id: target.id, msg: result.message ?? "Could not open." });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [busy, svg, title, srcUrl],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Open SVG in editor"
            className="h-9 gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open in</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-72"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Open SVG in editor</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {DEEP_LINK_TARGETS.length} targets
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {DEEP_LINK_TARGETS.map((target) => {
            const isBusy = busy === target.id;
            const isToast = toast?.id === target.id;
            return (
              <DropdownMenuItem
                key={target.id}
                onClick={(e) => {
                  e.preventDefault();
                  void handleClick(target);
                }}
                disabled={busy !== null && !isBusy}
                className="items-start gap-2.5 py-2"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isToast ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TargetIcon id={target.id} />
                  )}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">
                    {target.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] leading-relaxed",
                      isToast
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground/70",
                    )}
                  >
                    {isToast ? toast.msg : target.hint}
                  </span>
                </span>
                <KindIcon kind={target.kind} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link
                href={`/viewer?from=${slug}`}
                prefetch={false}
                className="items-center gap-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="flex-1">Inspect in SVG Viewer</span>
                <ArrowUpRight className="h-3 w-3 opacity-40" />
              </Link>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
