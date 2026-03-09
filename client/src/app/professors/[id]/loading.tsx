import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ProfessorDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        <div className="h-3.5 w-32 bg-muted rounded animate-pulse mb-5" />

        {/* Header skeleton */}
        <div className="border border-border rounded-lg bg-card shadow-sm p-5 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex-1">
              <div className="h-6 w-48 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded mb-3" />
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-28 bg-muted rounded" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center space-y-1">
                <div className="h-3 w-12 bg-muted rounded mx-auto" />
                <div className="h-9 w-14 bg-muted rounded mx-auto" />
                <div className="h-3 w-8 bg-muted rounded mx-auto" />
              </div>
              <div className="h-14 w-px bg-border" />
              <div className="text-center space-y-1">
                <div className="h-3 w-16 bg-muted rounded mx-auto" />
                <div className="h-9 w-14 bg-muted rounded mx-auto" />
                <div className="h-3 w-8 bg-muted rounded mx-auto" />
              </div>
              <div className="h-14 w-px bg-border" />
              <div className="text-center space-y-1">
                <div className="h-3 w-16 bg-muted rounded mx-auto" />
                <div className="h-9 w-14 bg-muted rounded mx-auto" />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 w-20 bg-muted rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Grade history skeleton */}
        <div className="h-3 w-28 bg-muted rounded mb-4 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-border rounded-lg bg-card shadow-sm mb-4 animate-pulse"
          >
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            </div>
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="flex-1 h-5 bg-muted rounded" />
                  <div className="flex gap-4">
                    <div className="h-6 w-10 bg-muted rounded" />
                    <div className="h-6 w-10 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}
