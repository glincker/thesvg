"use client";

import { useCallback, useRef, useState } from "react";
import { ALPHABET } from "@/lib/category-index";
import { cn } from "@/lib/utils";

interface AlphabetRailProps {
  availableLetters: Set<string>;
  onJump: (letter: string) => void;
  className?: string;
}

/**
 * A vertical A-Z (+ #) index rail, iOS-Contacts style: drag anywhere on the
 * rail and it snaps to the nearest available letter, showing a floating
 * bubble next to the pointer while active. Letters with no categories are
 * dimmed but stay in place so the alphabet still reads as complete.
 */
export function AlphabetRail({ availableLetters, onJump, className }: AlphabetRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const letterAtY = useCallback((clientY: number): string | null => {
    const rail = railRef.current;
    if (!rail) return null;
    const rect = rail.getBoundingClientRect();
    const relativeY = Math.min(Math.max(clientY - rect.top, 0), rect.height - 1);
    const index = Math.floor((relativeY / rect.height) * ALPHABET.length);
    return ALPHABET[Math.min(index, ALPHABET.length - 1)] ?? null;
  }, []);

  const nearestAvailable = useCallback(
    (letter: string): string | null => {
      if (availableLetters.has(letter)) return letter;
      const startIndex = ALPHABET.indexOf(letter);
      if (startIndex === -1) return null;
      for (let offset = 1; offset < ALPHABET.length; offset++) {
        const before = ALPHABET[startIndex - offset];
        if (before && availableLetters.has(before)) return before;
        const after = ALPHABET[startIndex + offset];
        if (after && availableLetters.has(after)) return after;
      }
      return null;
    },
    [availableLetters],
  );

  const handlePointer = useCallback(
    (clientY: number) => {
      const rawLetter = letterAtY(clientY);
      if (!rawLetter) return;
      const letter = nearestAvailable(rawLetter);
      if (!letter) return;
      setActiveLetter(letter);
      onJump(letter);
    },
    [letterAtY, nearestAvailable, onJump],
  );

  return (
    <div
      ref={railRef}
      role="group"
      aria-label="Jump to a category by letter"
      className={cn(
        "relative flex touch-none flex-col items-center justify-between gap-px px-0.5 py-1.5 select-none",
        className,
      )}
      onPointerDown={(e) => {
        setDragging(true);
        (e.target as Element).setPointerCapture?.(e.pointerId);
        handlePointer(e.clientY);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        handlePointer(e.clientY);
      }}
      onPointerUp={() => {
        setDragging(false);
        setActiveLetter(null);
      }}
      onPointerCancel={() => {
        setDragging(false);
        setActiveLetter(null);
      }}
      onLostPointerCapture={() => {
        setDragging(false);
        setActiveLetter(null);
      }}
      onPointerLeave={() => {
        if (!dragging) setActiveLetter(null);
      }}
    >
      {ALPHABET.map((letter) => {
        const available = availableLetters.has(letter);
        const isActive = activeLetter === letter;
        return (
          <button
            key={letter}
            type="button"
            tabIndex={available ? 0 : -1}
            aria-label={available ? `Jump to ${letter}` : undefined}
            aria-hidden={!available}
            disabled={!available}
            onClick={() => {
              if (available) onJump(letter);
            }}
            className={cn(
              "relative flex h-[13px] w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              available
                ? "text-muted-foreground/70 hover:bg-accent hover:text-foreground"
                : "text-muted-foreground/20",
              isActive && "bg-accent text-foreground",
            )}
          >
            {letter}
            {dragging && isActive && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-5 z-50 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background shadow-lg"
              >
                {letter}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
