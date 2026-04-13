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
