export default function CollectionLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.75rem)] flex-col gap-6 p-4 md:flex-row md:p-6">
      {/* Sidebar skeleton */}
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-lg bg-muted/50"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </aside>

      {/* Icon grid skeleton */}
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border/40 bg-card/80"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
