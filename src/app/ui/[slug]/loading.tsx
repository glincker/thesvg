import { Pulse } from "@/components/skeletons";

/** Same two-column shape as the icon page: preview card on the left, looks, style and code on the right. */
export default function UiIconLoading() {
  return (
    <div aria-hidden className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
      <Pulse className="h-4 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Pulse className="aspect-square rounded-3xl border border-border/40 bg-muted-foreground/[0.06]" />
          <Pulse className="h-24 rounded-2xl bg-muted-foreground/[0.06]" />
        </div>
        <div className="flex flex-col gap-5">
          <Pulse className="h-9 w-56" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Pulse key={i} className="aspect-[4/5] rounded-2xl bg-muted-foreground/[0.06]" />
            ))}
          </div>
          <Pulse className="h-28 rounded-2xl bg-muted-foreground/[0.06]" />
          <Pulse className="h-56 rounded-2xl bg-muted-foreground/[0.06]" />
        </div>
      </div>
    </div>
  );
}
