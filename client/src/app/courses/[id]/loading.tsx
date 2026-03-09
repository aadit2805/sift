import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        <div className="h-3.5 w-28 bg-muted rounded animate-pulse mb-5" />

        {/* Header skeleton */}
        <div className="bg-card shadow-sm border border-border rounded-lg p-5 mb-6 animate-pulse">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-12 bg-muted rounded-full" />
              </div>
              <div className="h-6 w-64 bg-muted rounded mb-2" />
              <div className="h-4 w-96 bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-4 pt-3 border-t border-border/50">
            <div className="flex gap-1">
              <div className="h-4 w-16 bg-muted rounded-full" />
              <div className="h-4 w-20 bg-muted rounded-full" />
            </div>
            <div className="flex gap-1">
              <div className="h-4 w-12 bg-muted rounded-full" />
              <div className="h-4 w-12 bg-muted rounded-full" />
            </div>
          </div>
        </div>

        {/* Professor breakdown skeleton */}
        <div className="h-3 w-48 bg-muted rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card shadow-sm border border-border rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-5 w-12 bg-muted rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
