# CLAUDE.md

Project-wide guidance for Claude Code sessions in the `weathered` repo.

For scope-specific rules, see the nested CLAUDE.md files:

- [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md) — backend app patterns
- [`apps/backend/src/services/CLAUDE.md`](apps/backend/src/services/CLAUDE.md) — upstream clients + orchestration
- [`apps/backend/src/routes/CLAUDE.md`](apps/backend/src/routes/CLAUDE.md) — HTTP route handlers
- [`apps/backend/src/middleware/CLAUDE.md`](apps/backend/src/middleware/CLAUDE.md) — error handler + cross-cutting concerns
- [`apps/backend/src/errors/CLAUDE.md`](apps/backend/src/errors/CLAUDE.md) — typed error hierarchy
- [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md) — frontend app patterns
- [`packages/shared/CLAUDE.md`](packages/shared/CLAUDE.md) — shared Zod schemas

## Project context

Weathered is a full-stack weather app built for the NSW Rural Fire Service Junior Full Stack Developer technical assignment. The full plan lives in [`docs/Weathered-plan.md`](docs/Weathered-plan.md) — read it first for architecture, schedule, and walkthrough talking points.

**Hard deadline:** submit EOD 2026-04-14. Interview 2026-04-16.

## Stack (April 2026)

| Layer       | Choice                                      |
| ----------- | ------------------------------------------- |
| Runtime     | Node.js 24 LTS                              |
| Language    | TypeScript 6 (strict)                       |
| Package mgr | pnpm 10 (workspaces)                        |
| Backend     | Express 5 + Zod 4 + pino                    |
| Frontend    | React 19 + Vite 8 + Tailwind v4 + shadcn/ui |
| Shared      | Zod schemas in `packages/shared`            |
| Tests       | Vitest 4 + Supertest + RTL                  |

## Repo layout

```
apps/
  backend/    # Express 5 API
  frontend/   # React 19 SPA
packages/
  shared/     # Zod schemas + inferred types, imported by both apps
docs/         # Assignment brief + implementation plan
```

Workspace packages are referenced as `@weathered/<name>` via `workspace:*`.

## Project-wide conventions

### TypeScript

- **No `any`, ever.** Use `unknown` and narrow. Enforced by `strictTypeChecked` ESLint preset.
- Shared types are derived from Zod schemas via `z.infer`. Never hand-write a type that mirrors a schema.
- Imports use `.js` extensions even for `.ts` sources (required by `moduleResolution: NodeNext`).
- Prefer `as const` objects over `enum`.
- Type-only imports use `import type` — required under `verbatimModuleSyntax`.

### Zod

- Use `import * as z from 'zod'` (Zod 4 docs style).
- Shared schemas are the single source of truth for request/response shapes between apps.

### ESLint

- Flat config (`eslint.config.js`) using `defineConfig` from `eslint/config`.
- `typescript-eslint` `strictTypeChecked` preset is active. When it fights a library's loose types, prefer an explicit type annotation over a rule suppression.

### Commits

- Conventional Commits format.
- `chore(scaffold)` for setup work, `feat(scope)` for user-facing features, `fix(scope)` for bug fixes.

## What not to do

- Don't install `dotenv` — we use Node 24's native env-file support.
- Don't use `node-cache` — we use `lru-cache` for bounded memory (see plan §6.5).
- Don't write backend `tsc` builds with `declaration: true` — only `packages/shared` emits declarations; apps override with `declaration: false`.
- Don't add routing libraries to the frontend — a single page with `?city=` URL state is sufficient.
- Don't expand scope beyond the plan. The §14 "Do NOT build" list is binding.

## Root-level files

| File                  | Purpose                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `package.json`        | Workspace root. `private: true`, `type: module`, recursive scripts (`pnpm -r <cmd>`).    |
| `pnpm-workspace.yaml` | Declares `apps/*` and `packages/*` as workspaces.                                        |
| `tsconfig.base.json`  | Strict settings, `NodeNext`, `noUncheckedIndexedAccess`, `declaration: true` (apps override to `false`). |
| `eslint.config.js`    | Flat config via `defineConfig` from `eslint/config`. `strictTypeChecked` preset active.  |
| `.prettierrc`         | `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 80`.            |
| `.nvmrc`              | `24` — picked up by `nvm use`, Vercel, Koyeb.                                            |
| `docs/Weathered-plan.md` | Full implementation plan. Read first for architecture, schedule, talking points.     |

## Running locally

```sh
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm -r dev
```

Backend: `http://localhost:3000` · Frontend: `http://localhost:5173` _(pending)_
