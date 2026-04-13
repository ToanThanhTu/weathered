# @weathered/frontend

React 19 single-page app that consumes the Weathered backend. Searches a city and renders current weather conditions with loading, error, and empty states.

See [`CLAUDE.md`](./CLAUDE.md) for conventions and per-layer rules, and the root [`README.md`](../../README.md) for workspace-level setup.

## Stack

- **Vite 8** (Rolldown) — dev server + build
- **React 19** + **React Compiler** (babel plugin) — auto-memoization
- **TypeScript 6** — strict mode, project references
- **Tailwind CSS v4** — CSS-first config via `@theme`
- **shadcn/ui** (Radix) — component primitives
- **TanStack Query v5** — server-state cache
- **Zod 4** — form validation via `@weathered/shared`

## Getting started

From the repo root:

```sh
pnpm install
pnpm --filter @weathered/frontend dev
```

Dev server runs on `http://localhost:5173`. Vite proxies `/api/*` to the backend at `http://localhost:3000`, so the backend must be running for searches to resolve.

## Scripts

| Script            | Description                            |
| ----------------- | -------------------------------------- |
| `pnpm dev`        | Start Vite dev server (port 5173)      |
| `pnpm build`      | Production build to `dist/`            |
| `pnpm preview`    | Preview the production build locally   |
| `pnpm typecheck`  | `tsc -b --noEmit` across project refs  |
| `pnpm lint`       | ESLint with React + type-aware rules   |

## Project structure

```
src/
├── App.tsx                    # root component + URL sync
├── main.tsx                   # entrypoint, providers
├── app.css                    # Tailwind v4 @theme
├── components/
│   ├── ErrorBoundary.tsx      # app-root render error fallback
│   ├── main/                  # feature components (SearchBar, WeatherCard, WeatherPanel)
│   ├── states/                # idle / loading / error states
│   └── ui/                    # shadcn/ui generated primitives
├── hooks/
│   └── useWeather.ts          # TanStack Query hook
└── lib/
    ├── api-client.ts          # typed fetch wrapper + ApiError
    ├── query-client.ts        # TanStack Query config
    └── utils.ts               # cn() + formatDate()
```

## Environment

No env vars required in dev — Vite's proxy handles the backend URL. Production builds read `VITE_API_BASE_URL` (wired up as part of Day 4 deployment).
