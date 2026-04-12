# State components

Presentational components rendered by `WeatherPanel` based on query state. See [`components/main/CLAUDE.md`](../main/CLAUDE.md) for how the branching works.

## Files

### `EmptyState.tsx` — idle / no search yet

- Rendered when `city` is `null` (page load with no `?city=` param).
- Uses shadcn `<Card>` to match the layout of other states. Suggests example cities.
- No props — purely static.

### `LoadingSkeleton.tsx` — fetching in progress

- Mirrors the `WeatherCard` layout using shadcn `<Skeleton>` bars at matching widths.
- Prevents layout shift when data arrives — the skeleton card is the same height as the data card.
- No props — purely static. The animated pulse comes from Tailwind's `animate-pulse` class on `<Skeleton>`.

### `ErrorState.tsx` — request failed

- Receives `ApiError` as props. Reads `error.response.error.code` to branch on error type.
- **`ERROR_MESSAGES` lookup table** maps error codes to `{ title, description }` pairs:
  - `CITY_NOT_FOUND` → informational tone ("check the spelling"), `variant="default"`
  - `UPSTREAM_ERROR` → destructive tone ("try again later"), `variant="destructive"`
  - `VALIDATION_ERROR` → "enter a valid city name"
  - `RATE_LIMITED` → "searching too fast"
  - Unknown codes → `DEFAULT_ERROR` fallback ("something went wrong")
- Uses `\u2019` for curly apostrophes in JSX strings to avoid lint warnings.
- Uses shadcn `<Alert>`, `<AlertTitle>`, `<AlertDescription>`.

## Rules

- No business logic in state components — they receive typed data and render it.
- Named exports, no `export default`.
- No props on static components (`EmptyState`, `LoadingSkeleton`) — keep them simple.
- Match the `WeatherCard` layout dimensions in `LoadingSkeleton` to prevent content shifting.
