import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PlanLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="h-5 w-28 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-3.5 w-72 bg-muted rounded animate-pulse" />
        </div>

        {/* Overall progress card skeleton */}
        <div className="rounded-lg border border-border bg-card shadow-sm p-6 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
            <div className="h-12 w-24 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full" />
        </div>

        {/* Requirement categories skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card shadow-sm p-5 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded-full" />
                </div>
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="h-1.5 bg-muted rounded-full mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 + (i % 3) }).map((_, j) => (
                  <div key={j} className="h-6 w-20 bg-muted rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
