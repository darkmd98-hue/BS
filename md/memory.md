# Memory.md — Project State & Log

> **This file must be updated after every file created/modified and every ticket completed.**
> Purpose: single source of truth for "what's done, what's in progress, what's next" — since AI sessions don't retain context between restarts. Read this file first, before reading anything else, at the start of every session.

---

## Product Model (Foundational Architecture)
- **Multi-Tenant SaaS:** One shared Supabase backend serves all lodges, isolated by `lodge_id` foreign keys and strict database-level Row Level Security (RLS).
- **Distribution:** Lodge owners register an account (which creates their tenant `lodges` row and initial admin `profiles` row), then download an installable client (Tauri desktop wrapper distributed via GitHub Releases) connecting back to the shared backend.
- **Tenant Isolation:** Highest priority in the entire project. No lodge may ever see, infer, or affect another lodge's data.

---

## Current Phase
`Phase 1 — Schema Expansion & Subdomain Resolution (Figma Pivot)`

---

## Completed

### Phase 0 — Foundation & Conversion (COMPLETE)
- [x] **Project Docs Ingestion:** Read and internalized all core documentation files in sequence.
- [x] **T-001: Next.js Project Structure Scaffolding:** Initialized App Router, Tailwind tokens, route groups `(auth)`, `admin`, `reception`.
- [x] **T-002: Supabase Connection & Typed Client:** Created `database.ts`, `client.ts`, `server.ts`, `admin.ts`, `middleware.ts`.
- [x] **T-003: `lodges` + `profiles` Schema & RLS Policies:** Migration `20260822000000_init_lodges_and_profiles.sql` with security-definer helper functions.
- [x] **T-005: Build Registration Flow (Tenant & Admin Profile Creation):** [VERIFIED LIVE ON SUPABASE]
  - Atomic Postgres RPC `create_new_lodge_tenant` verified live.
  - Multi-tenant PostgREST RLS isolation verified live with real JWT sessions across 2 lodges.
- [x] **Stitch Cleanup (Figma Design Pivot):**
  - Removed Stitch-derived UI components (`RoomCard`, `RoomGrid`, `BookingPanel`, `BookingForm`, `BillingSummary`, `CheckoutConfirm`, `CalendarView`, `AdminSummaryCards`, `RoomConfigForm`, `StaffInviteForm`).
  - Removed corresponding Stitch `page.tsx` files under `/admin` and `/reception`.
  - Preserved backend foundation (`src/lib/supabase/*`, `src/types/database.ts`, `supabase/migrations/*`, `src/app/actions/auth.ts`) and onboarding screens (`/register`, `/install`, `/login`).
  - Verified `next build` passes with 0 errors.
  - Read and analyzed `design-reference/src/App.tsx` (17 screen functions, mock arrays, shared UI components).

---

## In Progress
- [ ] **Awaiting User Go-Ahead for Revised Roadmap (Phase 1: Schema Expansion & Subdomain Resolution)**

---

## Next Steps (Per Revised 08-features-ticket-list.md)
- **T-039:** Schema expansion: expand `rooms`, add `customers`, rename `bookings`→`reservations`, rename `billing`→`bills`, add `payments`.
- **T-040:** Add `subdomain` column + unique index to `lodges`; backfill for test lodges.
- **T-041:** Write and apply RLS policies for all new and renamed tables.
- **T-042:** Re-run live PostgREST tenant isolation test against new/renamed tables.
- **T-043 / T-044:** Build and test Subdomain Tenant Resolution middleware.
- **T-045+:** Phase 3 Figma Extraction.

---

## Decisions Log
- `[Phase 0]` Chose Next.js App Router monorepo with route groups `(auth)`, `admin`, and `reception`.
- `[Phase 0]` Built Postgres security-definer helper functions (`get_auth_lodge_id()`, `get_auth_role()`) in migration to optimize RLS evaluation and prevent recursive query loops.
- `[Phase 1 / T-005]` Decided to implement atomic tenant provisioning via a `SECURITY DEFINER` Postgres function (`create_new_lodge_tenant`) called by Next.js Server Action (`registerLodgeAction`). Postgres enforces transaction atomicity, preventing orphaned `lodges` or `profiles` if any step fails.
- `[Figma Pivot]` Replaced Stitch frontend with direct extraction from Figma Make export (`design-reference/`). Kept onboarding (`/register`, `/install`, `/login`) and all database/auth infrastructure intact. Excluded `design-reference` from build typecheck as it serves as reference-only source code.
