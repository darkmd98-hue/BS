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

- [x] **T-043: Subdomain Tenant Resolution Middleware (Production Verified):**
  - Canonical location: `src/middleware.ts` directly (root `middleware.ts` deleted).
  - Composed with `@/lib/supabase/middleware`'s `updateSession(request, requestHeaders)` using the clone-and-pass Headers pattern.
  - Fail-closed error handling: returns 500 on missing env configuration or transient DB lookup errors; returns 404 HTML on unknown/unregistered subdomains.
  - Anti-spoofing security: dev overrides (`?subdomain=` and `x-subdomain` header) gated behind `process.env.NODE_ENV !== 'production'`.
  - Scoped matcher: excludes `_next/static`, `_next/image`, `favicon.ico`, and all static media assets.
  - Uses unprivileged public `anonKey` with `lodges_anon_subdomain_select` RLS policy granting `(id, name, subdomain)` only.
  - Verified under `next build && next start` (Production Build):
    * `pinecrest.localhost:3000` -> 200 OK (`x-lodge-id: 2e66186f-0f87-47f9-a29e-00984781fb53`)
    * `lakeside.localhost:3000` -> 200 OK (`x-lodge-id: e6c99f07-00f5-4cf5-b1f7-e0100b6f06c9`)
    * `doesnotexist.localhost:3000` -> 404 Lodge Not Found
    * `localhost:3000/register` -> 200 (Root bypass)
    * Authenticated `/admin/settings` -> 200 OK with `x-lodge-id` forwarded downstream.
    * Simulated expired token test -> `updateSession` automatically refreshed token via Supabase Auth, emitted fresh `Set-Cookie` with updated `access_token` and `expires_at`, and completed request with 200 OK.

- [x] **T-042: Live PostgREST RLS Tenant Isolation Verification (PASSED WITH 100% RIGOR):**
  - Authenticated as `test-lodge-a@example.com` (`8a26af81-edc8-415e-b8c0-c48e833b6878`, Pinecrest `2e66186f-0f87-47f9-a29e-00984781fb53`).
  - Tested across all 5 expanded schema tables: `rooms`, `customers`, `reservations`, `bills`, `payments`.
  - For every table:
    * `SELECT *` returned only Lodge A's rows (0 rows leaked).
    * `SELECT WHERE id = <known Lodge B UUID>` returned 0 rows (Lodge B completely invisible).
    * `UPDATE <known Lodge B UUID>` returned 0 rows affected (cross-tenant mutation completely blocked).
  - Target Lodge B row UUIDs verified isolated:
    * rooms: `1f28eb57-d21c-4a7a-872d-5e532cd69858`
    * customers: `b988d66d-f187-4d4a-b332-54f52128575f`
    * reservations: `4da63bfd-693d-4a66-9d28-b1869ac1eae0`
    * bills: `8e1ba6d6-299f-4967-9100-f72b3782c995`
    * payments: `46e234b7-07ad-4f26-a724-29e28959199d`

- [x] **T-044: Tenant Context Server Utility & Cross-Tenant Session Mismatch Guard (PASSED WITH 100% RIGOR):**
  - Created [`src/lib/tenant.ts`](file:///c:/bs/src/lib/tenant.ts) providing `getTenantContext()` helper for Server Components, Actions, and Route Handlers.
  - Resolves `x-lodge-id`, `x-lodge-subdomain`, `x-lodge-name` from request headers.
  - Authenticates requesting user with Supabase server client and fetches their `profile`.
  - **Cross-tenant session guard:** Compares `profile.lodge_id` against `headerLodgeId`. If a session arrives where the targeted subdomain/lodge does not match the authenticated user's own lodge (e.g. Lodge A user attempting to hit `lakeside.domain`), it immediately throws `TenantMismatchError` which renders an explicit **HTTP 403 Forbidden** response.
  - Live tested bi-directionally on production build (`next start`):
    * Lodge A session -> `pinecrest.localhost` (Matching): **200 OK**, returns Pinecrest lodge context.
    * Lodge A session -> `lakeside.localhost` (Mismatched): **403 Forbidden**, strictly rejected.
    * Lodge B session -> `lakeside.localhost` (Matching): **200 OK**, returns Lakeside lodge context.
    * Lodge B session -> `pinecrest.localhost` (Mismatched): **403 Forbidden**, strictly rejected.

- [x] **Phase 5 — Figma Extraction: Foundation & Shared Components (COMPLETED):**
  - **T-045:** Extracted shared UI primitives from Figma `design-reference/src/App.tsx` into clean, modular TypeScript files under `src/components/shared/`:
    * [`src/components/shared/Sidebar.tsx`](file:///c:/bs/src/components/shared/Sidebar.tsx) (Dynamic branding, active route highlighting, user profile, logout)
    * [`src/components/shared/Header.tsx`](file:///c:/bs/src/components/shared/Header.tsx) (Global search dropdown, notifications menu, user initials/role)
    * [`src/components/shared/StatusBadge.tsx`](file:///c:/bs/src/components/shared/StatusBadge.tsx) (Room status badges: available, occupied, reserved, cleaning, maintenance)
    * [`src/components/shared/PayBadge.tsx`](file:///c:/bs/src/components/shared/PayBadge.tsx) (Payment status badges: paid, partial, unpaid, pending)
    * [`src/components/shared/Avatar.tsx`](file:///c:/bs/src/components/shared/Avatar.tsx) (Deterministic colorized initials avatar)
    * [`src/components/shared/Toast.tsx`](file:///c:/bs/src/components/shared/Toast.tsx) (Dismissible timed toast notifications)
    * [`src/components/shared/Modal.tsx`](file:///c:/bs/src/components/shared/Modal.tsx) (Accessible backdrop-blur modal with keyboard escape listener)
  - **T-046:** Implemented `/admin` and `/reception` layouts (`src/app/admin/layout.tsx`, `src/app/reception/layout.tsx`) wired to `getTenantContext()` for dynamic lodge branding and role identity.
  - **T-047:** Installed `recharts@^2.15.4` dependency in `package.json`.
  - Built with `next build` (0 errors, 0 type issues).
  - Verified live in production mode (`next start`) with real authenticated sessions across both subdomains:
    * `pinecrest.localhost:3000/admin`: HTTP 200, renders "Pinecrest Alpine Resort" & "pinecrest.lodge".
    * `lakeside.localhost:3000/admin`: HTTP 200, renders "Lakeside Haven Inn" & "lakeside.lodge".
    * `pinecrest.localhost:3000/reception`: HTTP 200, renders "Pinecrest Alpine Resort".
    * `lakeside.localhost:3000/reception`: HTTP 200, renders "Lakeside Haven Inn".

---

## In Progress
- [ ] **Phase 6 — Figma Extraction: Reception Experience (T-048 to T-052)**
  - **T-048:** Room Booking Grid (`src/components/reception/RoomGrid.tsx`, `/reception/rooms`)
  - **T-049:** Walk-in Booking Modal (`src/components/reception/NewBookingModal.tsx`)
  - **T-050:** Reservations List & Filter (`/reception/reservations`)
  - **T-051:** Bills & Payments Screen (`/reception/billing`)
  - **T-052:** Customer Directory Screen (`/reception/customers`)

---

## Next Steps (Per Revised 08-features-ticket-list.md)
- **T-048:** Port Figma room booking grid with real PostgREST query scoped to `x-lodge-id`.
- **T-049:** Port Figma walk-in booking modal wired to server actions.

---

## Decisions Log
- `[Phase 0]` Chose Next.js App Router monorepo with route groups `(auth)`, `admin`, and `reception`.
- `[Phase 0]` Built Postgres security-definer helper functions (`get_auth_lodge_id()`, `get_auth_role()`) in migration to optimize RLS evaluation and prevent recursive query loops.
- `[Phase 1 / T-005]` Decided to implement atomic tenant provisioning via a `SECURITY DEFINER` Postgres function (`create_new_lodge_tenant`) called by Next.js Server Action (`registerLodgeAction`). Postgres enforces transaction atomicity, preventing orphaned `lodges` or `profiles` if any step fails.
- `[Figma Pivot]` Replaced Stitch frontend with direct extraction from Figma Make export (`design-reference/`). Kept onboarding (`/register`, `/install`, `/login`) and all database/auth infrastructure intact. Excluded `design-reference` from build typecheck as it serves as reference-only source code.
