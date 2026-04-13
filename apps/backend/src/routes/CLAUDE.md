# Routes

HTTP adapter layer. Route files are thin — they validate input, call a service, and send JSON. See [`apps/backend/CLAUDE.md`](../../CLAUDE.md) for app-level patterns.

## Rules

### Router export

Each file exports a single `Router` with an **explicit type annotation**:

```ts
export const weatherRouter: Router = Router()
```

The annotation is required under `strictTypeChecked` — without it, `app.use('/api/weather', weatherRouter)` in [`server.ts`](../server.ts) triggers `no-unsafe-argument`.

### No `try/catch`

**Express 5 auto-forwards thrown errors** — sync or async — from route handlers to the central error middleware. Write handlers as plain `async` functions and throw when you want an error:

```ts
weatherRouter.get('/', async (req, res) => {
  const parsed = WeatherQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw new ValidationError('Invalid query', z.treeifyError(parsed.error))
  }
  const result = await getCachedWeather(parsed.data.city)
  res.json(result)
})
```

This is the single biggest reason we're on Express 5. Don't reintroduce try/catch or an `asyncHandler` wrapper.

### Import the cached facade, not the raw service

Routes import from [`cache/`](../cache/), **not** directly from [`services/`](../services/). The cache layer wraps the service with LRU + TTL + single-flight; calling the service directly would bypass all of that. Current mapping:

| Route                | Import                                                     |
| -------------------- | ---------------------------------------------------------- |
| `weatherRouter`      | `getCachedWeather` from `../cache/weather.cache.js`        |

New cached endpoints follow the same pattern: add a `*.cache.ts` file under [`cache/`](../cache/), export a `getCached*` function, import from here.

### Input validation

- Use `WeatherQuerySchema.safeParse(req.query)` — not `.parse()`. You want to throw **your** `ValidationError` (with `z.treeifyError(result.error)` as `details`), not a raw `ZodError`.
- Narrow on `if (!parsed.success)` — the discriminated-union check — not `if (parsed.error)`. The success check works cleanly with TS narrowing.
- `req.query` is typed `ParsedQs`. Pass it straight to Zod; don't cast it to your own type.

### Never send errors directly

Route handlers must not call `res.status(400).json({ error })`. Throw a typed `AppError` and let the central error handler own the envelope shape. Routes don't know the mapping between `CityNotFoundError` and HTTP 404 — only the error handler does.

### Response shape

- Always `res.json(...)`, never `res.send(...)`. `.json()` sets the correct `Content-Type` and avoids an ambiguous-type footgun.
- The response body should already match the shared DTO returned by the service. Do not re-wrap or reshape it here.

### Wiring

New routers are registered in [`server.ts`](../server.ts) with:

```ts
app.use('/api/<name>', <name>Router)
```

Registration must happen **before** the error handler.
