"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getProfessors } from "@/lib/api";
import type { Professor } from "@/lib/types";

type SortOption = "rating" | "difficulty" | "name";

function ratingColor(rating: number | null): string {
  if (rating === null) return "text-muted-foreground";
  if (rating >= 4.0) return "text-sift-green";
  if (rating >= 3.5) return "text-sift-amber";
  return "text-sift-red";
}

function difficultyColor(difficulty: number | null): string {
  if (difficulty === null) return "text-muted-foreground";
  if (difficulty <= 2.5) return "text-sift-green";
  if (difficulty <= 3.5) return "text-sift-amber";
  return "text-sift-red";
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"connected" | "error" | "loading">("loading");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("rating");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setApiStatus("loading");

      const result = await getProfessors({ department: "CSCE" });

      if (cancelled) return;

      if (result.error) {
        setApiStatus("error");
      } else {
        setApiStatus("connected");
      }

      if (result.data) {
        setProfessors(result.data);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...professors];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    switch (sort) {
      case "rating":
        list.sort((a, b) => (b.rmp_rating ?? -1) - (a.rmp_rating ?? -1));
        break;
      case "difficulty":
        list.sort((a, b) => (a.rmp_difficulty ?? 999) - (b.rmp_difficulty ?? 999));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [professors, search, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-foreground mb-1">
            Professors
          </h1>
          <p className="text-xs text-muted-foreground">
            CSCE department faculty with RateMyProfessor data
          </p>
        </div>

        {/* Search + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 rounded-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search professors..."
              className="pl-10 h-10 bg-card border-border text-sm placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground mr-2">Sort</span>
            {(
              [
                { key: "rating", label: "Rating" },
                { key: "difficulty", label: "Difficulty" },
                { key: "name", label: "Name" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  sort === opt.key
                    ? "border-sift-amber/40 bg-sift-amber/10 text-sift-amber"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono text-foreground tabular-nums">
              {loading ? "-" : filtered.length}
            </span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
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
        ) : apiStatus === "error" && professors.length === 0 ? (
          <div className="text-center py-16 border border-sift-red/20 bg-sift-red/5 rounded-lg">
            <p className="text-sift-red text-sm font-medium mb-2">
              Failed to connect to API
            </p>
            <p className="text-muted-foreground text-xs">
              Make sure the backend is running on port 3001
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((professor, i) => (
                <Link
                  key={professor.id}
                  href={`/professors/${professor.id}`}
                  className="animate-fade-up block"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="rounded-lg border border-border bg-card shadow-sm p-4 transition-all hover:shadow-md group">
                    {/* Name + rating */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-sift-amber transition-colors">
                          {professor.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {professor.department}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className={`font-mono text-lg font-bold tabular-nums ${ratingColor(professor.rmp_rating)}`}>
                          {professor.rmp_rating !== null
                            ? professor.rmp_rating.toFixed(1)
                            : "N/A"}
                        </span>
                        {professor.rmp_rating !== null && (
                          <span className="text-[10px] font-mono text-muted-foreground">/5</span>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Difficulty</span>
                        <span className={`font-mono text-xs font-medium tabular-nums ${difficultyColor(professor.rmp_difficulty)}`}>
                          {professor.rmp_difficulty !== null
                            ? professor.rmp_difficulty.toFixed(1)
                            : "N/A"}
                          {professor.rmp_difficulty !== null && (
                            <span className="text-muted-foreground font-normal">/5</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Take again</span>
                        <span className={`font-mono text-xs font-medium tabular-nums ${
                          professor.rmp_would_take_again !== null
                            ? professor.rmp_would_take_again >= 70
                              ? "text-sift-green"
                              : professor.rmp_would_take_again >= 50
                                ? "text-sift-amber"
                                : "text-sift-red"
                            : "text-muted-foreground"
                        }`}>
                          {professor.rmp_would_take_again !== null
                            ? `${Math.round(professor.rmp_would_take_again)}%`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {professor.rmp_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {professor.rmp_tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-[18px] bg-sift-purple/10 text-sift-purple border border-sift-purple/20"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && search && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">
                  No professors match &ldquo;{search}&rdquo;
                </p>
              </div>
            )}

            {filtered.length === 0 && !search && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">
                  No professors found
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter apiStatus={apiStatus} />
    </div>
  );
}
