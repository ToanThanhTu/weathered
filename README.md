# Weathered

Full-stack weather app consuming the public [Open-Meteo](https://open-meteo.com/) API. Built for the NSW Rural Fire Service Junior Full Stack Developer technical assignment.

> **Status:** work in progress. See [`docs/Weathered-plan.md`](docs/Weathered-plan.md) for the full implementation plan.

## Stack

- **Monorepo:** pnpm workspaces
- **Frontend:** React 19 + Vite 8 + TypeScript 6 + Tailwind v4 + shadcn/ui _(pending)_
- **Backend:** Express 5 + TypeScript 6 + Zod 4 + pino
- **Shared:** Zod schemas + inferred types in `packages/shared`

## Prerequisites

- Node.js 24 LTS (see `.nvmrc`)
- pnpm 10+

## Getting started

```sh
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm -r dev
```

Backend will be available at `http://localhost:3000`.

## Project structure

```
weathered/
├── apps/
│   ├── backend/        # Express 5 API
│   └── frontend/       # React 19 SPA (pending)
├── packages/
│   └── shared/         # Shared Zod schemas + types
└── docs/               # Assignment brief + implementation plan
```

## Scripts

Run from the repo root:

| Script           | Description                               |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Start all dev servers in parallel         |
| `pnpm build`     | Build all packages                        |
| `pnpm lint`      | Lint all packages                         |
| `pnpm typecheck` | Typecheck all packages                    |
| `pnpm test`      | Run tests across all packages _(pending)_ |
