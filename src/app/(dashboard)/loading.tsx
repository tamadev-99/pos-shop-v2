export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-card animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-surface animate-pulse" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-card animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-20 rounded bg-card animate-pulse" />
                <div className="h-5 w-28 rounded bg-card animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-xl border border-border bg-surface p-4 h-[300px] animate-pulse" />
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-4 h-[300px] animate-pulse" />
      </div>
    </div>
  );
}
