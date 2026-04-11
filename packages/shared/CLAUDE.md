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
| `CurrentWeatherSchema`   | Zod schema      | `{ temperature, apparentTemperature, humidity, windSpeed, windDirection, condition, observedAt }`. All units are metric; `observedAt` is a naive ISO string in the city's local time. |
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

- No compilation step. The package's `exports` field in `package.json` points directly at `src/index.ts`; consumers resolve the `.ts` source through `moduleResolution: NodeNext`. The only script is `typecheck` (`tsc --noEmit`).
- `typescript` is a dev dep of this package so `pnpm -r typecheck` works without leaning on a hoisted root binary.
