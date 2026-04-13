# Frontend conventions

App-level guidance for `apps/frontend`. See the root [`CLAUDE.md`](../../CLAUDE.md) for project-wide rules and the per-layer CLAUDE.md files in each `src/` subfolder for implementation details.

## Stack

React 19 + Vite 8 + TypeScript 6 + Tailwind v4 + shadcn/ui (Radix) + TanStack Query v5. React Compiler (babel plugin) handles memoization — no `useMemo`, `useCallback`, or `React.memo` in source code.

## Layering

```
src/
├── App.tsx                    # root component, URL sync, city state
├── main.tsx                   # entrypoint, ErrorBoundary + QueryClientProvider
├── app.css                    # Tailwind v4 @import + @theme
├── components/
│   ├── ErrorBoundary.tsx      # app-root render error fallback (class component)
│   ├── main/                  # feature components  (→ CLAUDE.md)
│   ├── states/                # query-driven loading / error / empty states  (→ CLAUDE.md)
│   └── ui/                    # shadcn/ui generated (owned, editable)
├── hooks/                     # custom hooks  (→ CLAUDE.md)
└── lib/                       # utilities + API client  (→ CLAUDE.md)
```

## Files in `src/`

### `App.tsx` — root component + URL sync

- Owns the `city` state. `SearchBar` pushes new cities via `onSearch`; `WeatherPanel` reads and renders.
- URL sync via `window.history.pushState` — no router library. `?city=` is read on mount via lazy `useState` initialiser, updated on search, and restored on `popstate` (browser back/forward).
- `pushState` adds a history entry (back button works). `replaceState` would overwrite — not what we want for search.
- `export default` is kept here since `main.tsx` expects it. All other components use named exports.

### `main.tsx` — entrypoint

- Wraps `<App />` in `<StrictMode>`, `<ErrorBoundary>`, and `<QueryClientProvider>`, in that order (outer to inner).
- `ErrorBoundary` **must** be outside `QueryClientProvider` — if the provider itself throws during setup, only an outer boundary catches it.
- Imports `app.css` (Tailwind entry point).
- No `.tsx` extension on imports — Vite resolves without it.

### `components/ErrorBoundary.tsx` — render error fallback

- The one place in the codebase that's a **class component**. React 19 still has no hook equivalent for `componentDidCatch` / `getDerivedStateFromError`; the API has never been replaced.
- Catches **synchronous render errors** only. Async errors from event handlers and data fetching are not caught here — TanStack Query's `error` state handles the latter.
- Renders a shadcn `<Alert variant="destructive">` with Reload / Dismiss actions. Reload does a full `window.location.reload()`; Dismiss resets `hasError` and retries the render (useful if the error was transient).
- Kept at `components/` root, not inside `main/` or `states/` — it's an app-structural concern, not a feature component or a query-driven state.

### `app.css` — Tailwind v4 theme

- `@import "tailwindcss"` — no `tailwind.config.js`, no `postcss.config.js`. Tailwind v4 is CSS-first.
- `@theme` block contains shadcn/ui CSS variables (OKLCH color space) and custom tokens.

## TypeScript

- `moduleResolution: bundler` — no `.js` extensions on imports (unlike backend's `NodeNext`).
- Split tsconfig: `tsconfig.app.json` (browser code, `lib: DOM`) + `tsconfig.node.json` (`vite.config.ts`, `types: node`). Solution root `tsconfig.json` uses project references.
- `declaration: false`, `declarationMap: false` — apps don't emit `.d.ts`.
- `erasableSyntaxOnly: true` — forbids `enum` (aligns with `as const` preference).
- No `baseUrl` — deprecated in TS 6. `paths` resolves relative to tsconfig location.

## Styling

- Tailwind v4 utility classes. No JS config file.
- `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional class composition.
- shadcn/ui components use OKLCH colors and `data-slot` attributes.
- Never inline `style={{}}` for layout or theming — only for truly dynamic values.

## Vite

- Dev proxy: `/api` → `http://localhost:3000`. Frontend calls `/api/...` with relative paths — no base URL.
- Plugin order matters: `tailwindcss()` → `react()` → `babel({ presets: [reactCompilerPreset()] })`.
- `@tailwindcss/vite` resolves CSS before React plugin processes JSX.

## Testing setup

Tests use Vitest + React Testing Library + jsdom. Test files colocate with the components they cover (`components/main/WeatherPanel.test.tsx`).

### `vitest.config.ts`

- `environment: 'jsdom'` — provides `window`, `document`, `localStorage` for React to render into.
- `plugins: [react()]` — Vitest doesn't inherit Vite plugins; must declare here for JSX/TSX support.
- `resolve.alias` duplicates the `@` alias from `vite.config.ts` — Vitest uses its own resolver.
- React Compiler is **not** applied to tests (only `vite.config.ts` has the babel preset). The compiler is an optimization, not a semantic change — tests exercise the same code paths.

### `src/test/setup.ts`

- Imports `@testing-library/jest-dom/vitest` — extends Vitest's `expect` with matchers like `toBeInTheDocument()`.

### `src/test/render.tsx`

- Exports `renderWithQuery(ui)` — renders a component wrapped in a **fresh** `QueryClientProvider` with `retry: false`.
- Fresh client per test matters: the app's real `queryClient` has `retry: 1`, and error-state tests would otherwise wait for one retry cycle before surfacing the error (slow + flaky).
- No query cache leaks across tests because each render gets its own isolated client.

### Writing frontend tests

- **Query by role and text** (`getByRole`, `getByText`) — never `getByTestId`. RTL queries double as accessibility checks.
- **Mock `fetch` globally** via `vi.stubGlobal('fetch', vi.fn())` + `vi.unstubAllGlobals()` in `afterEach`. We deliberately avoid MSW for ~4 tests; if the count grows, MSW is the next step.
- **Loading state** uses `new Promise(() => {})` — a promise that never resolves. TanStack Query stays in `isLoading: true` for the test's lifetime; no need to time the assertion between start and resolution.
- **Skeleton query** uses `container.querySelector('[data-slot="skeleton"]')`. The skeleton has no accessible text (correct — screen readers shouldn't announce "loading loading loading"), so we query the shadcn-generated attribute directly. This is the one escape hatch from the "query by role" rule.
- **Async assertions** (success, error) use `await waitFor(() => expect(...))`. Sync assertions (empty, loading) render before the microtask queue drains.
