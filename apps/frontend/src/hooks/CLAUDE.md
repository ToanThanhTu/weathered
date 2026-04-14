# Hooks

Custom React hooks. See [`apps/frontend/CLAUDE.md`](../../CLAUDE.md) for app-level patterns.

## Files

### `useWeather.ts` — weather data hook

- Wraps `useQuery<WeatherResponse, ApiError>` from TanStack Query.
- **`queryKey: ['weather', city]`** — each city is cached independently. Searching "Sydney" → "Melbourne" → "Sydney" hits the cache on the third search.
- **`enabled: city !== null && city.length > 0`** — disables the query when no city is set. This gives the "idle" state for free: `data` is `undefined`, `isLoading` is `false`, `error` is `null`. `WeatherPanel` detects idle by checking `!city` before consulting query state.
- **`city ?? ''` in the URL** — unreachable fallback (the `enabled` gate prevents execution when `city` is null). Present to satisfy the TypeScript linter without a non-null assertion (`!`), which `no-non-null-assertion` forbids.
- Returns the full `UseQueryResult` — components destructure what they need (`data`, `error`, `isLoading`).

### `useTheme.ts` — light/dark theme state

- Tracks the current theme (`'light' | 'dark'`) and exposes `toggleTheme()`.
- Initial value comes from a lazy `useState` initialiser (`getInitialTheme`): reads `localStorage['weathered-theme']` first, then `prefers-color-scheme: dark`, then defaults to light.
- A `useEffect` syncs the `dark` class on `document.documentElement` and writes the current theme to `localStorage` on every change.
- Both `localStorage` accesses are wrapped in `try/catch` — Safari private mode throws on `setItem`, and the toggle still works for the session even when persistence fails.
- The hook is consumed by `components/ThemeToggle.tsx`. Any other consumer can read `theme` directly or subscribe to changes via `useTheme()`.
- **Mirrored at load time**: an inline IIFE in `apps/frontend/index.html` sets the `dark` class before React mounts, reading the same `localStorage` key. Without the inline script, the app would paint once in light mode before the effect applied the correct class. Both copies of the logic need to stay in sync.

## Rules

- Prefix custom hooks with `use`.
- Extract reusable stateful logic into hooks, but don't extract one-off `useState` calls that belong in the component.
- Never call hooks conditionally or inside loops.
- `useEffect` is for side effects (subscriptions, DOM listeners, external sync). TanStack Query handles data fetching; don't reach for `useEffect` for that.
- Explicit return types on public hooks (`: { theme, toggleTheme }`) — required under the project's strict TS rules.
