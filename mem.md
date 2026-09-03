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

# Memory.md

> **This file must be updated after every file created/modified and every ticket completed.**
> Purpose: single source of truth for "what's done, what's in progress, what's next" — read this file first, before reading anything else, at the start of every session.

---

## How to Update This File
1. After finishing any unit of work, add an entry under the relevant phase below.
2. Move completed tickets from "In Progress" to "Completed."
3. Log any assumptions made in place of an unanswered open question.
4. Never delete history — append. This file is a log, not just a snapshot.

---

## Product Model (Resolved)
- Multi-tenant SaaS, one shared Supabase backend, `lodge_id` scoping + RLS as the tenant boundary.
- Distribution: lodge owners register → get an installable client (Tauri, via GitHub Releases) connecting to the shared backend.
- **Subdomain-based tenant routing added** (per friend's architecture recommendation): each lodge gets a unique `subdomain`; Next.js middleware resolves `Host` header → `lodge_id` before any route runs. Naming convention: use `lodge_id` everywhere, not `tenant_id`, to stay consistent with existing schema/RLS.

## Frontend Decision (Resolved — major pivot)
- **The Stitch-AI-generated frontend has been fully discarded.** A Figma design (delivered as a "Figma Make" export — React 19 + Vite + Tailwind v4, one monolithic `App.tsx`, 17 screens, mock in-memory data) is now the sole source of truth for the frontend.
- This design is richer than original scope: includes Housekeeping, Maintenance, Reports, Settings, Users & Roles, Backup — none of which were in the original PRD. These are being treated as real future scope, phased in later (see `08-features-ticket-list.md` Deferred Phase), not built all at once.
- Data model expanded accordingly: `rooms` gained many fields (floor, type, bed, amenities, cleaning/maintenance status), new `customers` table (separate from booking-time fields), `bookings` renamed to `reservations` with a richer status enum, `billing` renamed to `bills` with a new `payments` child table for itemized payment history.
- See revised `05-backend-schema.md`, `07-frontend-specification.md`, `08-features-ticket-list.md` for full detail — all rewritten to reflect this pivot.

## Current Phase
`Phase 1 (revised) — Schema Expansion` — see `08-features-ticket-list.md`

## Completed
- [x] T-001–T-004: Original Next.js/Supabase scaffold, lodges/profiles schema, Stitch-based UI conversion (**superseded — Stitch components to be removed/ignored per Frontend Decision above**)
- [x] T-005: Tenant isolation verified for real — **twice**: once via `SET LOCAL ROLE authenticated` inside a Postgres transaction (database engine level), and once via a real `@supabase/supabase-js` client using `signInWithPassword()` and real JWTs against PostgREST (network/API level, the actual path production traffic takes). Both confirmed 0 cross-tenant data leakage across SELECT, filtered SELECT, and UPDATE attempts. Test data cleaned up from production afterward.
  - Note: an earlier version of this test was a pure in-memory mock (never touched Supabase) and a later SQL-Editor-based version was invalid because it ran as the `postgres` superuser (bypasses RLS) with an incorrect JWT-claim simulation — both were caught and rejected before being trusted. Only the final PostgREST-based test counts as real verification.

## In Progress
- [ ] Schema migration to match revised `05-backend-schema.md` (T-039–T-042)
- [ ] Subdomain routing middleware (T-043–T-044)

## Assumptions Made (pending confirmation)
- Itemized billing (payments table) — now resolved as YES, matching Figma design (previously an open question)
- Digital advance-payment (Razorpay) integration — still unconfirmed, Figma design shows manual payment method entry (Cash/UPI/Card/Bank Transfer), not a live gateway
- One lodge = one property still assumed for v1
- `customers.visits`/`total_spent`/`outstanding` assumed trigger-maintained rather than computed-on-read (performance assumption, revisit if needed)
- Housekeeping/Maintenance/Reports/Settings/Backup screens exist in the design but are explicitly deferred — not being built in the current phase

## Open Questions Still Unanswered
1. Is there a pricing/subscription model for lodges using this platform itself?
2. Tauri vs. simpler PWA-install approach for distribution — still unconfirmed
3. Priority order for the deferred screens (Housekeeping/Maintenance/Reports/Settings/Backup) once core v1 ships

## Decisions Log
- `[Foundational]` Multi-tenant architecture: one shared Supabase backend, `lodge_id` scoping everywhere, RLS as the tenant boundary.
- `[Foundational]` Tauri + GitHub Releases for distribution over Electron or fully self-hosted-per-lodge.
- `[Major pivot]` Discarded Stitch-generated frontend entirely in favor of a Figma design provided by a collaborator — chosen because it's the actual client-facing design and is more complete/domain-accurate than the placeholder Stitch mockups.
- `[Major pivot]` Adopted subdomain-based tenant routing (per collaborator's architecture recommendation) — sits in front of existing RLS-based isolation as a routing/resolution layer, does not replace it. Kept `lodge_id` naming instead of the doc's generic `tenant_id` term for consistency.
- `[Schema]` Renamed `bookings`→`reservations`, `billing`→`bills`, added `customers` and `payments` tables to match the Figma design's data model, which is richer than the original schema.

## Next Steps
- Execute Phase 1 (revised): schema migration + RLS for new/renamed tables, re-verify tenant isolation on the new schema using the same real PostgREST-based method as T-005.
- Then Phase 2: subdomain routing middleware.
- Only then begin Figma extraction (Phase 3 onward).