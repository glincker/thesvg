"use client";

import { useCallback, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ClipboardCopy,
  Codepen,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEEP_LINK_TARGETS,
  type DeepLinkTarget,
  openDeepLink,
} from "@/lib/svg-utils";

interface DeepLinkActionsProps {
  svg: string;
  title: string;
  layout?: "stack" | "grid";
  className?: string;
}

function TargetIcon({ id }: { id: string }) {
  if (id === "codepen") return <Codepen className="h-3.5 w-3.5" />;
  if (id === "jsfiddle") return <ExternalLink className="h-3.5 w-3.5" />;
  if (id === "filagram") {
    return (
      <img
        src="/icons/filagram/default.svg"
        alt=""
        className="h-3.5 w-3.5 object-contain"
      />
    );
  }
  if (id === "figma") {
    return (
      <img
        src="/icons/figma/default.svg"
        alt=""
        className="h-3.5 w-3.5 object-contain"
      />
    );
  }
  if (id === "sketch") {
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
  }
  if (id === "illustrator") return <Download className="h-3.5 w-3.5" />;
  return <ExternalLink className="h-3.5 w-3.5" />;
}

function ActionRow({
  target,
  toast,
  onClick,
}: {
  target: DeepLinkTarget;
  toast: string | null;
  onClick: (t: DeepLinkTarget) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(target)}
      className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2 text-left text-xs transition-colors hover:border-border hover:bg-card"
    >
      <span className="flex items-center gap-2.5">
        <TargetIcon id={target.id} />
        <span>
          <span className="block font-medium text-foreground">
            {target.label}
          </span>
          <span className="block text-[10px] text-muted-foreground/70">
            {toast ?? target.hint}
          </span>
        </span>
      </span>
      {toast ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : target.kind === "copy" ? (
        <ClipboardCopy className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
      ) : target.kind === "download" ? (
        <Download className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
      ) : (
        <ArrowUpRight className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

export function DeepLinkActions({
  svg,
  title,
  layout = "stack",
  className,
}: DeepLinkActionsProps) {
  const [toasts, setToasts] = useState<Record<string, string>>({});

  const handleClick = useCallback(
    async (target: DeepLinkTarget) => {
      const result = await openDeepLink(target, svg, title);
      if (result.ok) {
        const msg = result.message ?? "Opened in new tab.";
        setToasts((prev) => ({ ...prev, [target.id]: msg }));
        setTimeout(() => {
          setToasts((prev) => {
            const next = { ...prev };
            delete next[target.id];
            return next;
          });
        }, 2400);
      } else {
        setToasts((prev) => ({
          ...prev,
          [target.id]: result.message ?? "Could not open.",
        }));
        setTimeout(() => {
          setToasts((prev) => {
            const next = { ...prev };
            delete next[target.id];
            return next;
          });
        }, 3000);
      }
    },
    [svg, title],
  );

  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-1 gap-1.5 sm:grid-cols-2"
          : "flex flex-col gap-1.5",
        className,
      )}
    >
      {DEEP_LINK_TARGETS.map((t) => (
        <ActionRow
          key={t.id}
          target={t}
          toast={toasts[t.id] ?? null}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
