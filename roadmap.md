# Roadmap — Smart Tourist Safety Platform

## Done

- [x] Database: roles, profiles, contacts, incidents (SOS/report/assistance), assignments, locations, notes, timeline, notifications, safety info, resources, alerts, audit log, evidence storage
- [x] Server-side workflows: SOS with duplicate protection, status transitions, assignment, auto timeline + notifications, realtime
- [x] Sign in / register, role gate, role-based shells (tourist / responder / admin)
- [x] Shared UI: badges, timeline, map, notifications, safety info / resources / alerts browsers
- [x] Landing page (replace placeholder at /), forgot/reset password, privacy, terms, public safety + resources pages
- [x] Tourist pages: dashboard, SOS, active emergency, report, assist, my incidents + detail, contacts, safety, alerts, resources, map, notifications, profile
- [x] Responder pages: dashboard, active incidents (filters), detail (accept/assign/status/notes/resolve), assigned, map, history, notifications, profile
- [x] Admin pages: dashboard + analytics, incidents, users/roles, safety info CRUD, resources CRUD, alerts CRUD, map, audit, notifications
- [x] Root: fonts, Toaster, auth state listener, app metadata
- [x] Private `evidence` Supabase Storage upload and signed URL viewer (`src/lib/evidence.ts`)
- [x] Strict TypeScript (`tsc --noEmit`), ESLint (`npm run lint`), and production build (`npm run build`) verification
