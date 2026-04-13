export default function CategoriesLoading() {
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

      {/* Category grid skeleton */}
      <div className="flex-1 space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted/50" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border/40 bg-card/80"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
