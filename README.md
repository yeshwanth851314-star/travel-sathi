# Travel Sathi — Smart Tourist Safety & Emergency Response Platform

A full-stack tourist safety, emergency SOS dispatch, incident tracking, and verified resource directory platform separated into three modular architectural layers: **`frontend/`**, **`backend/`**, and **`database/`**.

---

## Project Folder Structure

```text
Travel sathi/
├── frontend/                  # React 19 + TanStack Router + Tailwind CSS v4 Client Application
│   ├── public/                # Static assets (favicon.ico, robots.txt, placeholder.svg)
│   ├── src/
│   │   ├── components/        # Role shells (AppShell), Leaflet maps, timelines, shadcn/ui
│   │   ├── hooks/             # Responsive & UI hooks
│   │   ├── integrations/      # Browser Supabase client & session storage
│   │   ├── lib/               # React Query hooks, evidence storage helper, geolocation, auth
│   │   ├── routes/            # All 39 routes across Public, Auth, Tourist, Responder, Admin
│   │   ├── router.tsx         # TanStack Router instance
│   │   └── styles.css         # Tailwind v4 design tokens
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                   # Server Runtime, Nitro/H3 SSR Entrypoint, & Supabase Server Middleware
│   ├── src/
│   │   ├── server.ts          # H3 / Nitro SSR fetch handler & error boundary
│   │   ├── start.ts           # TanStack Start CSRF & server error middleware
│   │   ├── middleware/        # Bearer JWT verification (auth-middleware) & cron guard (cron-auth)
│   │   ├── services/          # Service-role Supabase admin client (supabase-admin.ts)
│   │   └── utils/             # Server error capture & fallback 500 HTML renderer
│   ├── tsconfig.json
│   └── README.md
│
├── database/                  # PostgreSQL Schema, RLS Policies, RPC Functions, Storage, & Seed Data
│   ├── config.toml            # Supabase CLI configuration
│   ├── migrations/            # Timestamped SQL migrations
│   ├── sql/                   # Modular SQL files:
│   │   ├── 01_enums_and_tables.sql
│   │   ├── 02_rls_policies.sql
│   │   ├── 03_rpc_functions_and_triggers.sql
│   │   ├── 04_storage_buckets.sql
│   │   └── 05_seed_data.sql
│   ├── types.ts               # Canonical Database TypeScript schema definitions
│   └── README.md
│
├── package.json               # Root workspace scripts
└── tsconfig.json              # Unified TypeScript configuration
```

---

## Getting Started

1. **Install dependencies** (from the root folder):
   ```sh
   npm install
   ```
2. **Start the development server**:
   ```sh
   npm run dev
   ```
3. **Build for production**:
   ```sh
   npm run build
   ```
4. **Typecheck & Lint**:
   ```sh
   npm run typecheck
   npm run lint
   ```
