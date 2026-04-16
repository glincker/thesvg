export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-muted/50" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border/40 bg-card/80 p-6"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
