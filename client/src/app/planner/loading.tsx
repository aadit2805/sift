export default function PlannerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl h-14" />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Header skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="h-5 w-40 bg-muted rounded mb-2" />
          <div className="h-3.5 w-72 bg-muted rounded" />
        </div>

        {/* Controls skeleton */}
        <div className="border border-border rounded-lg bg-card shadow-sm p-4 mb-6 animate-pulse">
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1">
                <div className="h-3 w-20 bg-muted rounded mb-2" />
                <div className="h-9 bg-muted rounded-md" />
              </div>
            ))}
            <div className="h-9 w-32 bg-muted rounded-md self-end" />
          </div>
        </div>

        {/* Empty state skeleton */}
        <div className="text-center py-20 border border-dashed border-border rounded-lg animate-pulse">
          <div className="h-8 w-8 bg-muted rounded mx-auto mb-3" />
          <div className="h-3.5 w-40 bg-muted rounded mx-auto mb-2" />
          <div className="h-3 w-64 bg-muted rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
