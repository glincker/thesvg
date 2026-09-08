"use client";

import { MagnifyingGlassPlus } from "@phosphor-icons/react/dist/ssr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SizePlaygroundModalProps {
  title: string;
  src: string;
}

const SIZES = [16, 24, 32, 48, 64, 96, 128, 192];

export function SizePlaygroundModal({ title, src }: SizePlaygroundModalProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:text-orange-500"
            aria-label={`View ${title} at different sizes`}
          />
        }
      >
        <MagnifyingGlassPlus className="h-4 w-4" weight="bold" />
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] gap-5 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title} at a glance</DialogTitle>
          <DialogDescription>
            How this icon holds up across common UI sizes, on light and dark
            backgrounds.
          </DialogDescription>
        </DialogHeader>

        {(["light", "dark"] as const).map((theme) => (
          <div
            key={theme}
            className={cn(
              "rounded-xl border p-4",
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-200 bg-white"
            )}
          >
            <div
              className={cn(
                "mb-4 text-[10px] font-semibold uppercase tracking-wider",
                theme === "dark" ? "text-zinc-500" : "text-zinc-400"
              )}
            >
              {theme === "dark" ? "On dark" : "On light"}
            </div>
            <div className="flex flex-wrap items-end justify-center gap-6">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1.5">
                  <img
                    src={src}
                    alt=""
                    style={{ width: size, height: size }}
                    className="object-contain"
                  />
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                    )}
                  >
                    {size}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}
