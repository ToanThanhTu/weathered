# Shared package

Scope-specific guidance for `packages/shared`. See the root [`CLAUDE.md`](../../CLAUDE.md) for project-wide rules.

## Purpose

Single source of truth for request/response shapes used by both `apps/backend` and `apps/frontend`. All contracts between the two sides live here as Zod schemas with inferred TypeScript types.

## Schema rules

- Use `import * as z from 'zod'` (Zod 4 docs style), not `import { z } from 'zod'`.
- Every schema has a matching type derived via `z.infer`. Never hand-write a type that mirrors a schema.
- Public schemas and types are re-exported from `src/index.ts`. Consumers import from `@weathered/shared`, never from deep paths.
- Field names use `camelCase`. Any snake_case-to-camelCase mapping happens at the backend boundary (e.g. `weather.service.ts`), not here.
- `as const` objects over `enum` for discriminated tokens (see `ERROR_CODES`).

## Files in `src/`

### `index.ts` — public barrel

- Re-exports everything consumers should see. The `exports` field in `package.json` points at this file.
- Schema values and types are exported separately: values via `export { ... } from './schemas/weather.js'`, types via `export type { ... } from './schemas/weather.js'`. This keeps `verbatimModuleSyntax` happy in downstream apps.
- When a new schema file lands in `src/schemas/`, add its exports here. Never allow consumers to reach past `@weathered/shared` into a deep path.

### `schemas/weather.ts` — weather contracts

Single file containing every schema shared across the weather feature. Current exports:

| Symbol                   | Kind            | Purpose                                                                 |
| ------------------------ | --------------- | ----------------------------------------------------------------------- |
| `WeatherQuerySchema`     | Zod schema      | `GET /api/weather` query — `city: trimmed string, 1-100 chars`. Used by both the backend route and the frontend search form. |
| `WeatherQuery`           | inferred type   | Type alias for the above.                                               |
| `LocationSchema`         | Zod schema      | `{ name, country, latitude, longitude }` — resolved city coordinates.   |
| `CurrentWeatherSchema`   | Zod schema      | `{ temperature, apparentTemperature, humidity, windSpeed, windDirection, condition, observedAt, timezone }`. Units are metric. `observedAt` is a real UTC ISO string; the backend converts Open-Meteo's naive local time via `utc_offset_seconds`. `timezone` is the IANA name (e.g. `Europe/London`) so the frontend can format in the city's local time via `Intl.DateTimeFormat({ timeZone })`. |
| `WeatherResponseSchema`  | Zod schema      | `{ data: { location, current } }` — normalized success envelope.        |
| `Location`, `CurrentWeather`, `WeatherResponse` | inferred types | Type aliases.                                   |
| `ERROR_CODES`            | `as const`      | String constants: `VALIDATION_ERROR`, `CITY_NOT_FOUND`, `UPSTREAM_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`. |
| `ErrorCode`              | derived type    | Union of `ERROR_CODES` values.                                          |
| `ErrorResponseSchema`    | Zod schema      | `{ error: { code, message, details? } }` — uniform failure envelope.    |
| `ErrorResponse`          | inferred type   | Type alias.                                                             |

### Rules for this file

- Fields that don't need to cross the API boundary do **not** belong here. Example: `weatherCode` used to live in `CurrentWeatherSchema` but was dropped — the frontend only needs `condition` for display, so the code stays internal to `weather.service.ts`.
- Error messages inside `.min()`, `.max()`, etc. are shown to end users via RHF + Zod on the frontend. Phrase them accordingly (`'City is required'`, not `'city: min length 1'`).
- Keep the schema names suffixed with `Schema`. The inferred type drops the suffix: `LocationSchema` → `Location`.

## What belongs here

- Request query / body schemas (`WeatherQuerySchema`)
- Response DTO schemas (`WeatherResponseSchema`, `ErrorResponseSchema`)
- Error code constants shared between client and server
- Any validation rule that must be applied identically on both sides

## What does not belong here

- Upstream API shapes (Open-Meteo payloads) — those live module-private inside `apps/backend/src/services/open-meteo.ts`
- Framework-specific code (Express handlers, React components)
- Node-only or browser-only dependencies

## Build

- **`tsc` compiles `src/` to `dist/`.** The `exports` field points at `./dist/index.js` and `./dist/index.d.ts`. Both consumers (backend at runtime via plain `node`, frontend via Vite) read the compiled output.
- **`files: ["dist"]`** in `package.json` is critical — without it, `pnpm deploy` falls back to `.gitignore`, which excludes `dist/` and ships an empty package into the production container. The `files` field overrides the gitignore for deploy artifacts.
- **Why a build step is needed at all:** Node 24 deliberately refuses to apply native type stripping to files under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). Workspace packages always end up under `node_modules/` after `pnpm deploy`, so the type-stripping path is permanently closed for production containers. The earlier "no build step" approach worked in dev only because `tsx` falls back from `.js` requests to `.ts` files; plain `node` has no such fallback.
- **Scripts:**
  - `build` — `tsc`. Emits `dist/index.js`, `dist/index.d.ts`, and source maps.
  - `dev` — `tsc --watch`. Run by the root `pnpm dev` script in parallel with backend/frontend dev servers.
  - `typecheck` — `tsc --noEmit`. Run by CI and by `pnpm -r typecheck` from the root.
- **Dev workflow:** the root `dev` script chains `pnpm -r build && pnpm -r --parallel dev`. The build step runs once synchronously so `dist/index.js` exists before backend `tsx watch` and frontend Vite start. Subsequent shared edits hot-reload via `tsc --watch`.
- `typescript` is a dev dep of this package so `pnpm -r typecheck` and `pnpm -r build` work without leaning on a hoisted root binary.
