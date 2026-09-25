# Travel Sathi — Backend Layer (`backend/`)

This directory contains the server-side runtime, SSR/H3 request handlers, CSRF/error middleware, and privileged Supabase server integrations for **Travel Sathi**.

## Structure

- **`src/server.ts`** — Nitro / H3 SSR server entrypoint that intercepts swallowed H3 500 responses and renders a structured fallback error page.
- **`src/start.ts`** — TanStack Start server instance configuring request-level `errorMiddleware`, `csrfMiddleware`, and server-function `attachSupabaseAuth`.
- **`src/middleware/`**
  - `auth-attacher.ts` — Forwards the incoming request's `Authorization` Bearer header into server-side functions.
  - `auth-middleware.ts` — `requireSupabaseAuth` middleware that validates Bearer JWTs via `supabase.auth.getClaims(token)` and injects an authenticated per-request Supabase client + `userId`.
  - `cron-auth.ts` — `verifyCronSecret` helper that protects scheduled background endpoints using `CRON_SECRET`.
- **`src/services/`**
  - `supabase-admin.ts` — Lazily initialized `supabaseAdmin` client using `SUPABASE_SERVICE_ROLE_KEY` (server-only, never bundled into client code).
- **`src/utils/`**
  - `error-capture.ts` — Captures unhandled server rejections and exceptions for SSR diagnostics.
  - `error-page.ts` — Renders the standalone 500 HTML error page when SSR fails catastrophically.
