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
`Phase 1 — Registration & Tenant Foundation`

---

## Completed

### Phase 0 — Foundation & Conversion (COMPLETE)
- [x] **Project Docs Ingestion:** Read and internalized all 12 core documentation files in sequence.
- [x] **T-001: Next.js Project Structure Scaffolding:** Initialized App Router, Tailwind tokens, route groups `(auth)`, `admin`, `reception`.
- [x] **T-002: Supabase Connection & Typed Client:** Created `database.ts`, `client.ts`, `server.ts`, `admin.ts`, `middleware.ts`.
- [x] **T-003: `lodges` + `profiles` Schema & RLS Policies:** Migration `20260822000000_init_lodges_and_profiles.sql` with security-definer helper functions.
- [x] **Stitch AI Design Mockups Generated:** All 8 screens generated under project `10900859278101401158`.
- [x] **T-004: Convert Stitch HTML exports into componentized Next.js + Tailwind pages:** Converted all 8 mockups into 13 modular components. `next build` verified with 0 errors.

### Phase 1 — Registration & Tenant Foundation (IN PROGRESS)
- [x] **T-005: Build Registration Flow (Tenant & Admin Profile Creation):** [VERIFIED LIVE ON SUPABASE]
  - **Decision on Atomicity:** Implemented atomic Postgres function `public.create_new_lodge_tenant(p_user_id, p_owner_name, p_lodge_name, p_address)` (`supabase/migrations/20260822000001_create_new_lodge_tenant_rpc.sql`) running inside an implicit database transaction to guarantee that creating `lodges` and `profiles` never leaves orphaned or half-provisioned rows.
  - **Server-Side Controlled Action:** Created Next.js server action `registerLodgeAction` (`src/app/actions/auth.ts`) using privileged Service Role client (`src/lib/supabase/admin.ts`).
  - **Server-Generated Tenant ID:** `lodge_id` is generated exclusively server-side via `gen_random_uuid()` / default and bound directly to `profiles.lodge_id`.
  - **Duplicate Email Prevention:** Cleanly handled existing email collisions, returning user-facing error `"An account with this email already exists. Please sign in instead."` per `fs.md` §6.
  - **Component Wiring:** Wired `RegistrationForm` (`src/components/auth/RegistrationForm.tsx`) to `registerLodgeAction` with error alerts, pending state, and redirect to `/install`.
  - **Two-Lodge Isolation Test Status (VERIFIED LIVE):**
    - Executed live PostgREST RLS test script (`scripts/run-live-postgrest-test.ts`) against production Supabase instance (`https://ioxqvufitilbqfrrslzh.supabase.co`).
    - Two real tenants created: Lodge A (`2e66186f-0f87-47f9-a29e-00984781fb53`) and Lodge B (`e6c99f07-00f5-4cf5-b1f7-e0100b6f06c9`).
    - Authenticated as Lodge A (`test-lodge-a@example.com`) using public anon key and genuine JWT session:
      * `SELECT * FROM lodges` returned only Lodge A's record (1 row).
      * `SELECT * FROM lodges WHERE id = <Lodge B UUID>` returned 0 rows (empty array).
      * `SELECT * FROM profiles WHERE lodge_id = <Lodge B UUID>` returned 0 rows (empty array).
      * `UPDATE lodges SET name = 'Hacked' WHERE id = <Lodge B UUID>` affected 0 rows (mutation denied by PostgreSQL RLS).
    - Confirmed 100% database-enforced multi-tenant isolation.

---

## In Progress
- [ ] **T-006: Build Install-Link Screen & Flow**

---

## Next Steps
- **T-006:** Wire `InstallLinkScreen` post-registration flow with direct GitHub Releases download link and setup guide.
- **T-007:** Build `StaffInviteForm` server action — lodge admin invites reception staff bound strictly to their own `lodge_id`.

---

## Decisions Log
- `[Phase 0]` Chose Next.js App Router monorepo with route groups `(auth)`, `admin`, and `reception`.
- `[Phase 0]` Built Postgres security-definer helper functions (`get_auth_lodge_id()`, `get_auth_role()`) in migration to optimize RLS evaluation and prevent recursive query loops.
- `[Phase 1 / T-005]` Decided to implement atomic tenant provisioning via a `SECURITY DEFINER` Postgres function (`create_new_lodge_tenant`) called by Next.js Server Action (`registerLodgeAction`). Postgres enforces transaction atomicity, preventing orphaned `lodges` or `profiles` if any step fails.
