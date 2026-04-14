# State components

Presentational components rendered by `WeatherPanel` based on query state. See [`components/main/CLAUDE.md`](../main/CLAUDE.md) for how the branching works.

## Files

### `EmptyState.tsx` — idle / no search yet

- Rendered when `city` is `null` (page load with no `?city=` param).
- `Card` with `border-2 border-dashed` — the dashed border alone signals "not populated yet" without requiring a separate icon.
- Uses the same kicker + heading + body rhythm as `WeatherCard`: small uppercase `NO CITY SELECTED` label, bold `Welcome to Weathered` heading, muted helper text. Keeps the visual pattern consistent across all four render states.
- Example cities (`Sydney`, `London`, `Tokyo`) render as `font-mono text-xs` bordered chips — a hint at what to type with a developer-tool aesthetic.
- No props, purely static.

### `LoadingSkeleton.tsx` — fetching in progress

- Mirrors `WeatherCard`'s layout exactly — same header structure, same hero proportions, same 3-column metric grid, same footer strip. Result: zero layout shift when data arrives.
- Uses the `cn()` responsive pattern to match `WeatherCard`'s breakpoints. Hero skeleton is `h-20 w-32` on mobile, `sm:h-24 sm:w-40` on desktop. Header stacks `flex-col → sm:flex-row`. Metric cell padding `p-3 → sm:p-4`.
- Animated pulse comes from Tailwind's `animate-pulse` on shadcn's `<Skeleton>`.
- No props, purely static.

### `ErrorState.tsx` — request failed

- Receives an `ApiError` (from `lib/api-client.ts`) and branches on `error.response.error.code`.
- `ERROR_MESSAGES` lookup table maps error codes to `{ title, description }` pairs:
  - `CITY_NOT_FOUND` → informational tone ("check the spelling"), `variant="default"`
  - `UPSTREAM_ERROR` → destructive tone ("try again later"), `variant="destructive"`
  - `VALIDATION_ERROR` → "enter a valid city name"
  - `RATE_LIMITED` → "searching too fast"
  - Unknown codes → `DEFAULT_ERROR` fallback ("something went wrong")
- Curly apostrophes written as `\u2019` in JSX strings to avoid the `react/no-unescaped-entities` lint rule.
- Uses shadcn `<Alert>`, `<AlertTitle>`, `<AlertDescription>`.

## Rules

- No business logic in state components — they receive typed data and render it.
- Named exports only. No `export default`.
- Static components (`EmptyState`, `LoadingSkeleton`) take no props — keep them simple.
- `LoadingSkeleton` must track every responsive change in `WeatherCard` so no layout shift slips in.
