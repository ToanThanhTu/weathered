# Main components

Feature components that make up the weather search UI. See [`apps/frontend/CLAUDE.md`](../../../CLAUDE.md) for app-level patterns.

## Files

### `SearchBar.tsx` — city search form

- Controlled form with a single text input + submit button. Uses shadcn's `<Input>`, `<Button>`, `<Field>`, `<FieldError>`.
- Validates with `WeatherQuerySchema.safeParse` from `@weathered/shared` — same schema the backend validates against. On failure, displays `issues[0]?.message` inline via `<FieldError>`.
- Uses a `<form action={handleSubmit}>` pattern — React 19 form actions. `handleSubmit` receives `FormData` directly; no `e.preventDefault()` needed.
- Calls `onSearch(city)` on valid submit — the parent (`App.tsx`) owns the city state.
- `data-invalid={error ? true : undefined}` on `<Field>` — attribute is absent when no error (not `"false"` as a string).

### `WeatherCard.tsx` — weather data display

- Receives `WeatherResponse` as props. Destructures `weather.data` into `location` and `current`.
- All values displayed with units: `°C`, `%`, `km/h`, `°`.
- Uses shadcn's `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`.
- `formatDate()` from `lib/utils.ts` formats `observedAt` to en-AU locale.

### `WeatherPanel.tsx` — state branching orchestrator

- Takes `city: string | null` as props. Calls `useWeather(city)` and branches:

  ```
  !city       → <EmptyState />
  isLoading   → <LoadingSkeleton />
  error       → <ErrorState error={error} />
  data        → <WeatherCard weather={data} />
  ```

- **Order matters** — check idle first, then loading, then error, then success. Each branch renders exactly one component. No nested ternaries, no `&&` chains.
- This is the discriminated state branching pattern the plan highlights for the walkthrough.

## Rules

- Named exports only — no `export default`.
- Props interfaces in the same file, named `{ComponentName}Props`.
- One component per file, file name matches the component name (PascalCase).
- Type component props directly in the function parameter — `function Foo({ bar }: FooProps)`, not `React.FC<FooProps>`.
