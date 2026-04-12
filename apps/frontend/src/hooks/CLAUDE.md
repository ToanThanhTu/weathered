# Hooks

Custom React hooks. See [`apps/frontend/CLAUDE.md`](../../CLAUDE.md) for app-level patterns.

## Files

### `useWeather.ts` — weather data hook

- Wraps `useQuery<WeatherResponse, ApiError>` from TanStack Query.
- **`queryKey: ['weather', city]`** — each city is cached independently. Searching "Sydney" → "Melbourne" → "Sydney" hits cache on the third search.
- **`enabled: city !== null && city.length > 0`** — disables the query when no city is set. This gives the "idle" state for free: `data` is `undefined`, `isLoading` is `false`, `error` is `null`. Components detect it by checking `!city` before checking query state.
- **`city ?? ''` in the URL** — unreachable fallback (since `enabled` prevents execution when `city` is null). Present to satisfy the TypeScript linter without a non-null assertion (`!`), which `no-non-null-assertion` forbids.
- Returns the full `UseQueryResult` — components destructure what they need (`data`, `error`, `isLoading`).

## Rules

- Prefix custom hooks with `use`.
- Extract reusable stateful logic into hooks — but don't extract one-off `useState` calls that belong in the component.
- Never call hooks conditionally or inside loops.
- `useEffect` is for side effects (subscriptions, DOM listeners) — not for data fetching or derived state. TanStack Query handles data fetching.
