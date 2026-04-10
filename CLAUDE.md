# CLAUDE.md

Project-wide guidance for Claude Code sessions in the `weathered` repo.

## Project context

Weathered is a full-stack weather app built for the NSW Rural Fire Service Junior Full Stack Developer technical assignment. The full plan lives in [`docs/Weathered-plan.md`](docs/Weathered-plan.md) — read it first for architecture, schedule, and walkthrough talking points.

**Hard deadline:** submit EOD 2026-04-14. Interview 2026-04-16.

## Stack (April 2026)

| Layer       | Choice                                       |
| ----------- | -------------------------------------------- |
| Runtime     | Node.js 24 LTS                               |
| Language    | TypeScript 6 (strict)                        |
| Package mgr | pnpm 10 (workspaces)                         |
| Backend     | Express 5 + Zod 4 + pino                    |
| Frontend    | React 19 + Vite 8 + Tailwind v4 + shadcn/ui |
| Shared      | Zod schemas in `packages/shared`             |
| Tests       | Vitest 4 + Supertest + RTL                   |

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

## Conventions

### TypeScript

- **No `any`, ever.** Use `unknown` and narrow. Enforced by `strictTypeChecked` ESLint preset.
- Shared types live in `packages/shared` and are derived from Zod schemas via `z.infer`. Never hand-write a type that mirrors a schema.
- Imports use `.js` extensions even for `.ts` sources (required by `moduleResolution: NodeNext`).
- Prefer `as const` objects over `enum` (see `ERROR_CODES` in `packages/shared`).

### Zod

- Use `import * as z from 'zod'` (Zod 4 docs style).
- Validate env vars at startup in `config.ts` and **fail fast** on invalid input.
- Shared schemas are the single source of truth for request/response shapes.

### Express backend

- App factory pattern: `createServer()` returns a configured app without listening. Entrypoint in `index.ts` does the `app.listen()`.
- Middleware order: `helmet` → `cors` (explicit allowlist, never `*`) → `express.json` → `pinoHttp` → routes → error handler.
- Every request gets a `x-request-id` header (generated UUID or passed-through).
- Structured pino logging: `logger.info({ key: value }, 'message')` — never string-interpolate data into the message.
- Graceful shutdown on `SIGTERM` / `SIGINT`.

### Environment variables

- Loaded via Node 24's native `--env-file` flag (no `dotenv` dependency).
- Parsed through a Zod schema in `apps/backend/src/config.ts`.
- `.env.example` is committed; `.env` is gitignored.

### ESLint

- Flat config (`eslint.config.js`) using `defineConfig` from `eslint/config`.
- `typescript-eslint` `strictTypeChecked` preset is active. When it fights a library's loose types (e.g. `pino-http`), prefer an explicit type annotation over a rule suppression.

### Commits

- Conventional Commits format.
- `chore(scaffold)` for setup work, `feat(scope)` for user-facing features, `fix(scope)` for bug fixes.

## What not to do

- Don't install `dotenv` — we use Node 24's native env-file support.
- Don't use `node-cache` — we use `lru-cache` for bounded memory (see plan §6.5).
- Don't write backend `tsc` builds with `declaration: true` — only `packages/shared` emits declarations; apps override with `declaration: false`.
- Don't add routing libraries to the frontend — a single page with `?city=` URL state is sufficient.
- Don't expand scope beyond the plan. The §14 "Do NOT build" list is binding.

## Running locally

```sh
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm -r dev
```

Backend: `http://localhost:3000` · Frontend: `http://localhost:5173` _(pending)_
