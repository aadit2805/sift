"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/professors", label: "Professors" },
  { href: "/plan", label: "Plan" },
];

function getSemesterOptions(): string[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // Generate 4 upcoming semesters starting from the next one
  const semesters: string[] = [];
  let startSeason: "Spring" | "Summer" | "Fall" = month <= 4 ? "Fall" : month <= 6 ? "Fall" : "Spring";
  let startYear = startSeason === "Spring" ? year + 1 : year;
  const order: ("Spring" | "Summer" | "Fall")[] = ["Spring", "Summer", "Fall"];
  let idx = order.indexOf(startSeason);
  let y = startYear;
  for (let i = 0; i < 4; i++) {
    semesters.push(`${order[idx]} ${y}`);
    idx++;
    if (idx >= order.length) {
      idx = 0;
      y++;
    }
  }
  return semesters;
}

const SEMESTERS = getSemesterOptions();

export function SiteHeader({
  semester,
  onSemesterChange,
}: {
  semester?: string;
  onSemesterChange?: (semester: string) => void;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-5 h-14">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            sift<span className="text-sift-amber">.</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                    isActive
                      ? "text-sift-amber font-medium bg-sift-amber/8"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {semester && onSemesterChange && (
            <>
              <div className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 bg-card shadow-sm">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <select
                  value={semester}
                  onChange={(e) => onSemesterChange(e.target.value)}
                  className="bg-transparent text-sm text-foreground border-0 outline-none cursor-pointer appearance-none pr-4"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-5 w-px bg-border" />
            </>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sift-amber flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">
                CS
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
