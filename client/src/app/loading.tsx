import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Search + stats skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-card border border-border rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-px bg-border" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-px bg-border" />
            <div className="h-5 w-12 bg-muted rounded-full animate-pulse" />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Recommendations skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-4 animate-pulse shadow-sm"
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <div className="h-4 w-24 bg-muted rounded mb-2" />
                      <div className="h-3 w-40 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-12 bg-muted rounded-lg" />
                  </div>
                  <div className="h-1 bg-muted rounded mb-3" />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                  </div>
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className="w-full lg:w-80 shrink-0 space-y-5">
            {/* My Courses */}
            <div className="border border-border rounded-lg p-4 bg-card shadow-sm space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-muted rounded" />
                <div className="flex-1 h-8 bg-muted rounded" />
              </div>
            </div>

            {/* Degree Progress */}
            <div className="border border-border rounded-lg p-4 bg-card shadow-sm animate-pulse">
              <div className="flex items-baseline justify-between mb-2">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-7 w-12 bg-muted rounded" />
              </div>
              <div className="h-2.5 bg-muted rounded-full mb-2" />
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-3 w-12 bg-muted rounded" />
                    </div>
                    <div className="h-1.5 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Weight Controls */}
            <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden animate-pulse">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted rounded" />
                </div>
                <div className="h-3 w-3 bg-muted rounded" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
