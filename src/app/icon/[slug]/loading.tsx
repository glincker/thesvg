export default function IconLoading() {
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

      {/* Main content skeleton */}
      <div className="flex-1 space-y-6">
        {/* Icon preview area */}
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="h-64 w-full animate-pulse rounded-xl border border-border/40 bg-card/80 lg:w-96" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/50" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-16 animate-pulse rounded-full bg-muted/50"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 animate-pulse rounded-lg bg-muted/50"
            />
          ))}
        </div>

        {/* Related icons skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded bg-muted/50" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-border/40 bg-card/80"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
