import { Clock } from "@/components/own-icons";

export interface SectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}

export function Section({ title, icon, count, onClear, children }: SectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground dark:bg-white/[0.04]">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.04]">
          {count}
        </span>
        <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Clock className="h-3 w-3" />
          Clear
        </button>
      </div>
      {children}
    </section>
  );
}
