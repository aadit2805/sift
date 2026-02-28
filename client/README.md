# Sift — Client

Next.js frontend for Sift.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Data Fetching**: TanStack Query (React Query) — centralized cache, declarative hooks, automatic refetching
- **Fonts**: Geist Sans + Geist Mono via `next/font`

## Getting Started

```bash
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). Expects the API server running on port 3001.

## Key Files

| Path | Description |
|------|-------------|
| `src/app/layout.tsx` | Root layout — QueryProvider + TooltipProvider |
| `src/lib/api.ts` | API client — fetcher functions for all endpoints |
| `src/lib/queries.ts` | TanStack Query hooks wrapping `api.ts` + query key factory |
| `src/lib/types.ts` | Shared TypeScript interfaces |
| `src/components/query-provider.tsx` | QueryClient config (5min staleTime, retry: 1) |
| `src/components/ui/` | shadcn/ui primitives |

## Environment Variables

Create `client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
