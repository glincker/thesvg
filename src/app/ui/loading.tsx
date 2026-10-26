import { Pulse } from "@/components/skeletons";

/** Same shape as the UI icons home (hero, pills, grid), so the page does not jump when it arrives. */
export default function UiLoading() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <Pulse className="h-[300px] rounded-3xl border border-border/40 bg-muted-foreground/[0.06]" />
      <Pulse className="h-11 rounded-xl border border-border/40 bg-muted-foreground/[0.06]" />
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-20 rounded-full bg-muted-foreground/[0.08]" />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
        {Array.from({ length: 14 }).map((_, i) => (
          <Pulse key={i} className="h-[176px] rounded-2xl border border-border/40 bg-muted-foreground/[0.06]" />
        ))}
      </div>
    </div>
  );
}
