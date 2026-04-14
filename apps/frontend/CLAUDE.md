# Frontend conventions

App-level guidance for `apps/frontend`. See the root [`CLAUDE.md`](../../CLAUDE.md) for project-wide rules and the per-layer CLAUDE.md files in each `src/` subfolder for implementation details.

## Stack

React 19 + Vite 8 + TypeScript 6 + Tailwind v4 + shadcn/ui (Radix) + TanStack Query v5. React Compiler (babel plugin) handles memoization — no `useMemo`, `useCallback`, or `React.memo` in source code. Icons from `lucide-react`.

## Layering

```
src/
├── App.tsx                    # root component, URL sync, city state
├── main.tsx                   # entrypoint: ErrorBoundary + QueryClientProvider
├── app.css                    # Tailwind v4 @theme + :root/.dark tokens
├── components/
│   ├── ErrorBoundary.tsx      # app-root render error fallback (class component)
│   ├── ThemeToggle.tsx        # Sun/Moon button consuming useTheme
│   ├── Footer.tsx             # author byline + GitHub / LinkedIn links
│   ├── main/                  # feature components  (→ CLAUDE.md)
│   ├── states/                # idle / loading / error states  (→ CLAUDE.md)
│   └── ui/                    # shadcn/ui generated (owned, editable)
├── hooks/                     # custom hooks  (→ CLAUDE.md)
└── lib/                       # utilities + API client  (→ CLAUDE.md)
```

## Files in `src/`

### `App.tsx` — root component + URL sync

- Owns the `city` state. `SearchBar` pushes new cities via `onSearch`; `WeatherPanel` reads and renders.
- URL sync uses `window.history.pushState` — no router library. `?city=` is read on mount via a lazy `useState` initialiser, updated on search, and restored on `popstate` for back/forward.
- `pushState` adds a history entry (back button works). `replaceState` would overwrite and break back navigation.
- `export default` stays on this file because `main.tsx` imports it by default. Every other component uses named exports.
- Responsive `cn()` pattern on the h1 (`text-4xl` mobile, `sm:text-5xl` desktop) — see the [Responsive](#responsive) section below.

### `main.tsx` — entrypoint

- Wraps `<App />` in `<StrictMode>`, `<ErrorBoundary>`, and `<QueryClientProvider>`, in that order (outer to inner).
- `ErrorBoundary` is outside `QueryClientProvider` so any error thrown during provider setup is still caught by the boundary.
- Imports `app.css` (Tailwind entry point).
- No `.tsx` extension on imports — Vite resolves without it.

### `components/ErrorBoundary.tsx` — render error fallback

- The one class component in the codebase. React 19 has no hook equivalent for `componentDidCatch` / `getDerivedStateFromError`.
- Catches **synchronous render errors** only. Async errors from event handlers and data fetching are caught separately by TanStack Query's `error` state.
- Renders a shadcn `<Alert variant="destructive">` with Reload / Dismiss actions. Reload calls `window.location.reload()`; Dismiss resets `hasError` and retries rendering.
- Lives at `components/` root, not inside `main/` or `states/` — it's an app-structural concern, not a feature component or a query-driven state.

### `components/ThemeToggle.tsx` — light/dark switch

- Square icon button (`h-9 w-9 border-2`), variant `outline`, consumes the `useTheme` hook from `hooks/useTheme.ts`.
- Shows the icon for the **target** theme: sun when in dark mode (target is light), moon when in light mode (target is dark). Matches the GitHub/Vercel convention.
- `aria-label` reflects the action (`"Switch to dark theme"` / `"Switch to light theme"`).
- Rendered in the header bar in `App.tsx`, beside the "NSW Rural Fire Service" kicker.

### `components/Footer.tsx` — author byline + social links

- Top-border row at the bottom of `<main>` with "Built by **Trevor Tu**" on the left and square icon-button links to GitHub + LinkedIn on the right.
- Icons from `lucide-react` (`Github`, `Linkedin`). Links open in a new tab with `rel="noopener noreferrer"` and have `aria-label`s for screen readers.
- Hover state uses `hover:border-rfs-red hover:text-rfs-red` — one more restrained brand moment at the page edge.

### `app.css` — Tailwind v4 theme

- `@import "tailwindcss"` — no `tailwind.config.js`, no `postcss.config.js`. Tailwind v4 is CSS-first.
- Root `@theme` block defines `--font-sans`, `--font-heading`, `--font-mono`. These auto-generate the `font-sans`, `font-heading`, `font-mono` utility classes.
- `:root` block holds light-theme OKLCH tokens (including `--rfs-red` and `--radius: 0`). `.dark` block holds dark-theme overrides.
- `@theme inline` block exposes shadcn's color and radius tokens to Tailwind (`--color-*`, `--radius-sm` etc.) and the custom `--color-rfs-red: var(--rfs-red)` so `bg-rfs-red` / `border-rfs-red` / `ring-rfs-red` utilities exist.
- `@custom-variant dark (&:is(.dark *))` makes the `dark:` Tailwind variant key off the `.dark` class on `<html>`.

## Design tokens

### Typography

- Body (`--font-sans`): `'Arial', 'Helvetica', system-ui, sans-serif`. Matches RFS's own website. No fontsource import needed — Arial ships with every OS.
- Headings (`--font-heading`): `'Gotham', 'Montserrat Variable', 'Arial', 'Helvetica', system-ui, sans-serif`. Gotham is RFS's actual brand font (Hoefler & Co., proprietary, not committed). Montserrat is the open-source Gotham fallback, self-hosted via `@fontsource-variable/montserrat`.
- Mono (`--font-mono`): `'JetBrains Mono Variable', monospace`. Used for the coordinate row in WeatherCard.
- Apply via Tailwind's `font-heading` / `font-sans` / `font-mono` utility classes. Do not reference the raw CSS variables in JSX.

### Colours

- **Lyra radius**: `--radius: 0`. All cards, inputs, buttons are perfectly square. The `@theme inline` chain of `--radius-sm/md/lg/xl` is `calc(var(--radius) * x)` so zero cascades through every size variant.
- **Off-white backgrounds**: light `--background` / `--card` / `--popover` are `oklch(0.985 0 0)` (≈ `#fafafa`), not pure white.
- **Off-black dark mode**: dark `--background` is `oklch(0.145 0 0)` (≈ `#252525`).
- **RFS red**: `--rfs-red: oklch(0.58 0.22 28)` in light, `oklch(0.66 0.22 28)` in dark (brighter for legibility). Exposed as `--color-rfs-red` so `bg-rfs-red`, `text-rfs-red`, `border-rfs-red`, `ring-rfs-red` are available.
- **Single accent rule**: RFS red appears in exactly three places: the header underline bar, the search input focus ring, and the search button hover state. Everywhere else stays neutral.

### Dark mode

- Class-based: toggle `dark` on `<html>`, and the entire `.dark` block in `app.css` activates. Drive this through `useTheme()` from `hooks/useTheme.ts`.
- First-visit default comes from `prefers-color-scheme: dark`. User choice persists to `localStorage` under `weathered-theme` and wins on subsequent visits.
- An inline IIFE in `index.html` sets the `dark` class **before** the first paint, reading from `localStorage` then the system preference. Without this, React would mount with light theme and flash to dark — a visible regression. The IIFE mirrors the hook's logic at load time.
- `<meta name="theme-color">` tags with `media="(prefers-color-scheme: ...)"` match the browser chrome (Safari address bar, Android status bar) to the OS preference. They do **not** track the in-app toggle — a known limitation, accepted as a trade-off.
- `<meta name="color-scheme" content="light dark">` tells the browser to render native form controls / scrollbars with dark-aware styling.

## Responsive

One breakpoint: `sm:` (640px). Below it is mobile; at and above it is everything else. The `max-w-3xl` container already caps the desktop layout.

Apply responsive classes via the `cn()` convention — one string argument per breakpoint tier — so each line of className reads as "mobile base / sm overrides":

```tsx
className={cn(
  'font-heading font-black tracking-tight text-4xl',
  'sm:text-5xl',
)}
```

What responds:

- Page `h1`: `text-4xl` → `sm:text-5xl`
- WeatherCard header row: `flex-col` → `sm:flex-row` (city + coords stack on mobile)
- WeatherCard coord text: `text-left` → `sm:text-right`
- WeatherCard hero: `flex-col items-start` → `sm:flex-row sm:items-end`
- Temperature size: `text-7xl` → `sm:text-8xl`
- Metric cell padding: `p-3` → `sm:p-4`
- Metric value size: `text-lg` → `sm:text-xl`
- LoadingSkeleton mirrors every responsive change exactly — zero layout shift at any viewport width.

## TypeScript

- `moduleResolution: bundler` — no `.js` extensions on imports (unlike backend's `NodeNext`).
- Split tsconfig: `tsconfig.app.json` (browser code, `lib: DOM`) + `tsconfig.node.json` (`vite.config.ts`, `types: node`). Solution root `tsconfig.json` uses project references.
- `declaration: false`, `declarationMap: false` — apps don't emit `.d.ts`.
- `erasableSyntaxOnly: true` — forbids `enum` (aligns with the `as const` preference).
- No `baseUrl` — deprecated in TS 6. `paths` resolves relative to the tsconfig location.

## Styling rules

- Tailwind v4 utility classes. No JS config file.
- `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional class composition and for the responsive-breakpoint pattern above.
- shadcn/ui components use OKLCH colors and `data-slot` attributes.
- No inline `style={{}}` for layout or theming — only for genuinely dynamic runtime values.

## Vite

- Dev proxy: `/api` → `http://localhost:3000`. The frontend calls `/api/...` with relative paths, so there's no base URL to configure.
- Plugin order: `tailwindcss()` → `react()` → `babel({ presets: [reactCompilerPreset()] })`. `@tailwindcss/vite` must resolve CSS before the React plugin processes JSX.

## Dockerfile + nginx

[`Dockerfile`](Dockerfile) is a multi-stage build:

1. **Builder stage** (`node:24-alpine AS builder`):
   - `npm i -g pnpm`
   - `COPY` workspace root files + `packages/shared` + `apps/frontend`
   - `RUN pnpm install --frozen-lockfile`
   - `RUN pnpm -r build` — topological build: shared then frontend. Vite emits the SPA bundle to `apps/frontend/dist/`.

2. **Runner stage** (`nginx:alpine`):
   - `COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html/` — Vite output becomes nginx's docroot
   - `COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf` — replaces nginx's default site config
   - No `CMD` — `nginx:alpine` ships with the right one

### `nginx.conf`

```nginx
location /api/ {
  proxy_pass http://backend:3000;
  ...
}

location / {
  try_files $uri $uri/ /index.html;
}
```

- **`/api/*` → `backend:3000`**: `backend` resolves to the Docker Compose service name on the internal network. Replaces the Vite dev proxy in production. Same-origin from the browser's perspective — no CORS preflight ever fires.
- **SPA fallback** (`try_files ... /index.html`): the app currently has one route, but a reload on `/?city=Sydney` still serves `index.html` and React reads `?city=` from `URLSearchParams`.

### No `pnpm deploy` step for frontend

The frontend's runtime artifact is static files: HTML, CSS, JS in nginx's docroot. No Node process at runtime, no `node_modules`. The builder produces `dist/`, the runner copies those files into nginx, done.

## Testing setup

Tests use Vitest + React Testing Library + jsdom. Test files colocate with the components they cover (`components/main/WeatherPanel.test.tsx`).

### `vitest.config.ts`

- `environment: 'jsdom'` — provides `window`, `document`, `localStorage` for React to render into.
- `plugins: [react()]` — Vitest doesn't inherit Vite plugins; declare here for JSX/TSX support.
- `resolve.alias` duplicates the `@` alias from `vite.config.ts` — Vitest uses its own resolver.
- React Compiler is **not** applied in tests (only `vite.config.ts` has the babel preset). The compiler is an optimization, not a semantic change — tests exercise the same code paths.

### `src/test/setup.ts`

- Imports `@testing-library/jest-dom/vitest` — extends Vitest's `expect` with matchers like `toBeInTheDocument()`.

### `src/test/render.tsx`

- Exports `renderWithQuery(ui)` — renders a component wrapped in a **fresh** `QueryClientProvider` with `retry: false`.
- Fresh client per test matters: the real `queryClient` has `retry: 1`, and error-state tests would otherwise wait for one retry cycle before surfacing the error (slow and flaky).
- No query cache leaks across tests because each render gets its own isolated client.

### Writing frontend tests

- **Query by role and text** (`getByRole`, `getByText`), never `getByTestId`. RTL queries double as accessibility checks.
- **Mock `fetch` globally** via `vi.stubGlobal('fetch', vi.fn())` + `vi.unstubAllGlobals()` in `afterEach`. MSW is deliberately skipped for ~4 tests; it would be the next step if test count grows.
- **Loading state** uses `new Promise(() => {})` — a promise that never resolves. TanStack Query stays in `isLoading: true` for the test's lifetime, no need to time the assertion between start and resolution.
- **Skeleton query** uses `container.querySelector('[data-slot="skeleton"]')`. The skeleton has no accessible text (correct — screen readers shouldn't announce "loading loading loading"), so querying the shadcn `data-slot` attribute is the one escape hatch from the "query by role" rule.
- **Async assertions** (success, error) use `await waitFor(() => expect(...))`. Sync assertions (empty, loading) render before the microtask queue drains.
