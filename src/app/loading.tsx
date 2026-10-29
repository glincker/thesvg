import { IconGridSkeleton, Pulse } from "@/components/skeletons";

/** Shaped like a browse page so the route does not flash an empty screen while it streams in. */
export default function Loading() {
  return (
    <div aria-hidden role="status" aria-label="Loading" className="mx-auto flex min-h-[calc(100vh-3.75rem)] max-w-7xl flex-col gap-4 px-3 py-6 sm:px-4">
      <Pulse className="h-8 w-48" />
      <Pulse className="h-4 w-full max-w-md bg-muted-foreground/[0.06]" />
      <IconGridSkeleton count={18} className="mt-2" />
    </div>
  );
}
