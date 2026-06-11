"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomSheetSnap = "peek" | "half" | "full";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  snap?: BottomSheetSnap;
  onSnapChange?: (snap: BottomSheetSnap) => void;
  /** Disables drag-to-resize (used for the More sheet, single height). */
  fixedSnap?: BottomSheetSnap;
  label: string;
  children: React.ReactNode;
  className?: string;
  allowOverscroll?: boolean;
}

const SNAP_VH: Record<BottomSheetSnap, number> = {
  peek: 45,
  half: 70,
  full: 95,
};

export function BottomSheet({
  open,
  onClose,
  snap = "peek",
  onSnapChange,
  fixedSnap,
  label,
  children,
  className,
  allowOverscroll = false,
}: BottomSheetProps) {
  const labelId = useId();
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const startSnap = useRef<BottomSheetSnap>(snap);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while sheet is open. Restore previous overflow.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (fixedSnap) return;
      startY.current = e.clientY;
      startSnap.current = snap;
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [snap, fixedSnap],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (fixedSnap) return;
      if (startY.current == null) return;
      const delta = e.clientY - startY.current;
      // Allow only downward drag (positive) and a small negative buffer.
      setDragOffset(Math.max(-40, delta));
    },
    [fixedSnap],
  );

  const handlePointerUp = useCallback(() => {
    if (fixedSnap) return;
    if (startY.current == null) return;
    const delta = dragOffset;
    startY.current = null;
    setDragOffset(0);
    setDragging(false);

    // Threshold-based snap. >120 px down from peek closes; up to next
    // snap point with >60 px upward; otherwise stays put.
    const order: BottomSheetSnap[] = ["peek", "half", "full"];
    const idx = order.indexOf(startSnap.current);
    if (delta > 120 && idx === 0) {
      onClose();
      return;
    }
    if (delta > 80 && idx > 0) {
      onSnapChange?.(order[idx - 1]);
      return;
    }
    if (delta < -60 && idx < order.length - 1) {
      onSnapChange?.(order[idx + 1]);
      return;
    }
  }, [dragOffset, fixedSnap, onClose, onSnapChange]);

  if (!mounted) return null;

  const activeSnap = fixedSnap ?? snap;
  const vh = SNAP_VH[activeSnap];

  return createPortal(
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      style={{ transitionDuration: "var(--motion-fade)" }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        ref={popupRef}
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-2xl border-t border-border/40 bg-background shadow-[0_-12px_40px_-6px_rgba(0,0,0,0.3)] dark:border-white/[0.08]",
          className,
        )}
        style={{
          height: `${vh}vh`,
          transform: `translateY(${open ? Math.max(0, dragOffset) : 16}px)`,
          transition: dragging ? "none" : "transform var(--motion-slide)",
          paddingBottom: "var(--safe-bottom)",
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center pt-1 pb-1 active:cursor-grabbing"
          aria-hidden="true"
        >
          <span className="sheet-handle" />
        </div>
        <div className="flex shrink-0 items-center justify-between px-4 pb-1">
          <h2 id={labelId} className="text-sm font-semibold text-foreground">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            allowOverscroll ? "sheet-scroll-auto" : "sheet-scroll",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
