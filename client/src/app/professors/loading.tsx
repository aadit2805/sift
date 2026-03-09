import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ProfessorsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        <div className="mb-6">
          <div className="h-5 w-24 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-3 w-56 bg-muted rounded animate-pulse" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-card border border-border rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="h-3 w-8 bg-muted rounded animate-pulse mr-2" />
            <div className="h-7 w-16 bg-muted rounded-md animate-pulse" />
            <div className="h-7 w-20 bg-muted rounded-md animate-pulse" />
            <div className="h-7 w-14 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-14 bg-muted rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card shadow-sm p-4 animate-pulse"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="h-8 w-12 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-muted rounded-full" />
                <div className="h-5 w-14 bg-muted rounded-full" />
                <div className="h-5 w-18 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
