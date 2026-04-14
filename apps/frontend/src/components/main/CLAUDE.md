# Main components

Feature components that make up the weather search UI. See [`apps/frontend/CLAUDE.md`](../../../CLAUDE.md) for app-level patterns (including testing and responsive conventions).

Test files colocate with the component under test: `WeatherPanel.test.tsx` sits beside `WeatherPanel.tsx`.

## Files

### `SearchBar.tsx` — city search form

- Form-only, no wrapping `Card`. A `Card` wrapper would nest a visual box inside the main container and compete with the `WeatherCard` below.
- `<form action={handleSubmit}>` uses React 19 form actions. The handler receives `FormData` directly — no `e.preventDefault()` boilerplate.
- Validates with `WeatherQuerySchema.safeParse` from `@weathered/shared` — the same schema the backend validates against. On failure, displays `issues[0]?.message` inline via `<FieldError>`.
- On valid submit, calls `onSearch(city)`. The parent (`App.tsx`) owns the city state.
- `<FieldLabel>` uses the small uppercase-tracked pattern (`text-xs uppercase tracking-widest text-muted-foreground`) to match the kicker style used throughout WeatherCard and EmptyState.
- `<Input>` has `h-12 border-2 text-base` for a confident touch target and Lyra-thick borders. `md:text-base` counters shadcn's default `md:text-xs` override.
- Focus ring uses `focus-visible:ring-rfs-red` — the only place an input touches the brand accent.
- `<Button>` is `h-12 px-6 text-base bg-foreground text-background hover:bg-rfs-red`. Solid dark by default, turns RFS red on hover — one more restrained brand moment.
- `data-invalid={error ? true : undefined}` on `<Field>` — the attribute is absent when no error (not the string `"false"`).

### `WeatherCard.tsx` — weather data display

Hero-layout card with four sections top to bottom:

1. **Header** — country kicker (uppercase tracked, with a `MapPin` icon), bold city name (`font-heading text-2xl`), coordinates on the right in `font-mono text-xs text-muted-foreground`. Stacks vertically on mobile (`flex-col sm:flex-row`); coords go left-aligned below the name on mobile, right-aligned on `sm:+`.
2. **Hero** — rounded temperature at `text-7xl` mobile → `sm:text-8xl` with `font-heading font-black tabular-nums`, beside (or above on mobile) the condition name and "Feels like" secondary. `Math.round(temperature)` so the hero reads `23°`, not `22.48°`.
3. **Metric grid** — 3 columns separated by `border-l`: Humidity, Wind, Direction. Each cell uses the small uppercase kicker + bold value pattern. `Droplets` and `Wind` icons from `lucide-react`. Padding `p-3` mobile → `sm:p-4`. Value size `text-lg` → `sm:text-xl`.
4. **Footer** — observed time as a small uppercase muted strip. Reads as a metadata label, doesn't compete with the hero.

Other notes:

- `Card` has `border-2` to match the thicker borders elsewhere.
- Internal `Metric` subcomponent handles the repetitive 3-column cell markup. Not exported, not part of the public API.
- `formatDate(current.observedAt, current.timezone)` renders the UTC ISO string in the **city's** IANA timezone, not the browser's.

### `WeatherPanel.tsx` — state branching orchestrator

- Takes `city: string | null` as props. Calls `useWeather(city)` and branches:

  ```
  !city       → <EmptyState />
  isLoading   → <LoadingSkeleton />
  error       → <ErrorState error={error} />
  data        → <WeatherCard weather={data} />
  ```

- Order matters: idle first, then loading, then error, then success. Each branch renders exactly one component. No nested ternaries, no `&&` chains. This is the discriminated-state branching pattern the app is built around.

## Rules

- Named exports only — no `export default`.
- Props interfaces in the same file, named `{ComponentName}Props`.
- One component per file; file name matches the component name (PascalCase).
- Type component props directly in the function parameter — `function Foo({ bar }: FooProps)`, not `React.FC<FooProps>`.
- Use the `cn()` convention for responsive classNames (one string arg per breakpoint tier). See the frontend app-level CLAUDE for the full pattern.
