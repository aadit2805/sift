"use client";

export function SiteFooter({
  apiStatus = "loading",
}: {
  apiStatus?: "connected" | "error" | "loading";
}) {
  return (
    <>
      <footer className="border-t border-border bg-card/50 py-3 px-5 text-xs text-muted-foreground">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus === "connected"
                    ? "bg-sift-green"
                    : apiStatus === "error"
                      ? "bg-sift-red"
                      : "bg-sift-amber animate-pulse"
                }`}
              />
              {apiStatus === "connected"
                ? "Connected"
                : apiStatus === "error"
                  ? "Disconnected"
                  : "Connecting..."}
            </span>
            <span className="hidden sm:inline">CS B.S. / 2024-2025 catalog</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Data: Spring 2015 - Summer 2025</span>
            <span className="font-mono text-sift-amber-dim">v0.1</span>
          </div>
        </div>
      </footer>
    </>
  );
}
