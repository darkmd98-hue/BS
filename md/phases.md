# Phases.md (Revised — post multi-tenant + Figma pivot)

> This replaces the earlier phases.md, which was written before two major pivots: (1) single-lodge → multi-tenant SaaS, (2) Stitch-generated frontend → Figma design as sole source of truth, plus (3) the addition of subdomain-based tenant routing. Status markers below reflect the actual last-known state — **verify against memory.md before assuming anything marked ✅ is still current.**

---

## Phase 0 — Foundation ✅ DONE
- Next.js + TypeScript + Tailwind scaffold, route groups
- Supabase connection, `lodges` + `profiles` tables, tenant/role model
- *(Superseded sub-step, no longer relevant: original Stitch HTML → components conversion — those components have since been deleted)*
- *Exit criteria met:* app boots, clean `next build`.

## Phase 1 — Registration & Tenant Foundation ✅ DONE
- Registration flow: atomic `create_new_lodge_tenant` RPC, creates `lodges` + admin `profiles` row
- Install-link screen, staff login page
- **T-005: Tenant isolation genuinely verified** — real PostgREST test with real `signInWithPassword()` sessions and real JWTs, cross-checked from both lodges. (Two earlier verification attempts — an in-memory mock and a superuser SQL-Editor test — were correctly caught as invalid before this one.)
- *Exit criteria met:* new lodge owner can register end-to-end; isolation confirmed real.

## Phase 2 — Frontend Pivot: Stitch Removal ✅ DONE
*(New phase, not in the original plan — added when the Figma design was adopted)*
- Deleted 10 Stitch-derived components + 7 route pages (`RoomCard`, `BookingPanel`, `AdminSummaryCards`, etc.)
- Preserved: Supabase client layer, types, migrations, registration/install/login flow
- Figma export ingested at `design-reference/` (reference only — not run as part of the app)
- Git checkpoint taken before deletion
- *Exit criteria met:* `next build` passes with only `/register`, `/install`, `/login` live; Figma structure reviewed and understood (17 screens, mock data shape, shared primitives identified).

## Phase 3 — Schema Expansion for Figma Data Model ✅ DONE
*(New phase — the original schema was too simple for the Figma design's richer model)*
- **T-039:** Expand `rooms` (floor/type/bed/amenities/cleaning/maintenance), add `customers`, rename `bookings`→`reservations`, `billing`→`bills`, add `payments` child table
- **T-040:** Add `lodges.subdomain` + unique index, backfill existing test lodges
- **T-041:** RLS policies on all 6 new/changed tables (lodge_id-first pattern, consistent with T-005)
- **T-042:** Re-verify tenant isolation on the new schema, same real-PostgREST rigor as T-005
- *Exit criteria met:* Live database schema verified; RLS policies verified with real JWT PostgREST test against all 5 tables (`rooms`, `customers`, `reservations`, `bills`, `payments`), confirming 0 row leakage, 0 rows visible by ID, and 0 rows affected by update; stub pages removed; migration files synced to repository.

## Phase 4 — Subdomain Tenant Resolution ✅ DONE
- **T-043:** Next.js `middleware.ts` reads `Host` header, extracts subdomain, resolves to `lodge_id` via DB lookup, before any route handler runs ✅ DONE
- **T-044:** Tenant context helper (`src/lib/tenant.ts`) reading `headers()` downstream + cross-tenant session mismatch guard (rejects with 403) ✅ DONE
- *Exit criteria met:* visiting `pinecrest.localhost` and `lakeside.localhost` correctly resolves downstream tenant context for authenticated users; mismatched cross-tenant access attempts are strictly rejected with HTTP 403 Forbidden; fully verified under production build (`next start`).

## Phase 5 — Figma Extraction: Foundation & Shared Components ✅ DONE
- **T-045:** Extract `Sidebar`, `Header`, `StatusBadge`, `PayBadge`, `Avatar`, `Toast`, `Modal` into real shared component files ✅ DONE
- **T-046:** Set up `/admin` and `/reception` layouts using the extracted shell wired to `getTenantContext()` ✅ DONE
- **T-047:** Carry over `recharts` dependency, confirm build passes and shell renders standalone with dynamic lodge branding ✅ DONE
- *Exit criteria met:* shared shell renders cleanly in production mode under `pinecrest` and `lakeside` subdomains displaying respective lodge branding; 0 build errors.

## Phase 6 — Figma Extraction: Core Reception Flow ✅ DONE
- **T-048** Dashboard → real aggregate queries (occupancy, today's activity) (`/reception`) ✅ DONE
- **T-049** RoomBooking + RoomCard → `/reception/rooms`, real `rooms` data, lodge-scoped, realtime status ✅ DONE
- **T-050** StayDetails → real `reservations`/`customers`/`bills` for a given room (`/reception/rooms/[id]`) ✅ DONE
- **T-051** Reservations + CreateReservation → real create/list against `reservations` + `customers` (`/reception/reservations`, `/reception/reservations/new`) ✅ DONE
- **T-052** Billing → real `bills` + `payments` (`/reception/billing`) ✅ DONE
- **T-053** Customers → real CRUD against `customers` (`/reception/customers`) ✅ DONE
- *Exit criteria met:* All 6 screens extracted into real Next.js App Router routes, wired to PostgREST via `getTenantContext().lodgeId`, verified live in production build across both `pinecrest.localhost` and `lakeside.localhost` with 0 cross-tenant row leakage, and verified that direct URL access across lodges yields HTTP 404.

## Phase 7 — Figma Extraction: Core Admin Flow ✅ DONE
- **T-054** RoomManagement + AddRoom → `/admin/rooms` and `/admin/rooms/new` (Room inventory, filter status, create room action) ✅ DONE
- **T-055** UsersRoles → `/admin/staff` (Staff directory, role permissions matrix, staff invitation action) ✅ DONE
- **T-056** Restyle `/register`, `/install`, `/login` to match the Figma visual language (navy `#0b1437`, clean borders, minimal typography) ✅ DONE
- *Exit criteria met:* Admin can configure rooms and invite staff for their own lodge only, verified against both test lodges (`pinecrest` and `lakeside`) in production build; direct UUID boundary checks confirmed HTTP 404.

## Phase 8 — Secondary Screens ✅ DONE
- **T-057** CustomerProfile → `/reception/customers/[id]` (full stay history, visit count, live totals, per-reservation bill summary, Print Invoice link) ✅ DONE
- **T-058** PrintInvoice → `/reception/billing/[billId]/print` (clean print layout, `window.print()` via `PrintPageClient` client component, `@media print` CSS hides nav button) ✅ DONE
- **Bonus fix:** `PayBadge` hardened against `null`/`undefined` payment_status; billing list "Details" link wired to real print invoice route; customers list "Profile" link wired to real customer profile route.
- *Exit criteria met:* Both screens return HTTP 200 under correct lodge session, HTTP 404 for cross-lodge UUID access. Verified via `scripts/verify-phase8-secondary.ts` against production build (`next start`): Pinecrest Lodge A customer + bill → 200; Lakeside Lodge B customer + bill → 200; Lodge A → Lodge B customer UUID → 404; Lodge A → Lodge B bill UUID → 404. `next build` → 0 errors, 18 routes.

## Phase 11 — LodgeOS v1.1 (Post-Launch Extended Features) 🔶 IN PROGRESS
- **T-059: Housekeeping Workflow (/admin/housekeeping) ✅ DONE**
  * Migration `20260915000005_t059_housekeeping.sql` (rooms cleaning status & staff columns, `cleaning_log` table with RLS)
  * Server actions: `startCleaningAction`, `markRoomCleanAction`, `bulkMarkCleanAction`, `flagRoomForCleaningAction`
  * Client UI with queue count, status badges, bulk actions, and cleaning history log
  * Admin layout and sidebar navigation wired
  * Production build compiles cleanly
- **T-060: Maintenance Tracking (/admin/maintenance) ✅ DONE**
  * Migration `20260915000006_t060_maintenance.sql` (`maintenance_tickets` table with RLS policies, status/priority indexes)
  * Server actions: `createMaintenanceTicketAction`, `updateTicketStatusAction`, `assignTicketAction`
  * Kanban board (Open, In Progress, Resolved), room history log, report issue modal with room/issue type/priority/technician assignment, and resolution modal
  * Verified with `scripts/verify-t060-maintenance.ts` on live production build: Pinecrest (200 OK), Lakeside (200 OK), Cross-Tenant Guard (403 Forbidden), Anonymous Access Guard (307 Redirect)
- **T-061: Reports & Analytics (/admin/reports) ⬜ NEXT**
- **T-062: Settings Panel (/admin/settings) ⬜ PENDING**
- **T-063: Guest Portal (/guest/login & /guest/[reservationId]) ⬜ PENDING**

## Phase 9 — Packaging & Distribution ✅ DONE
- **T-029:** Tauri wrapper initialized (`@tauri-apps/cli` 2.11.4, `src-tauri/` created with `Cargo.toml`, `build.rs`, `tauri.conf.json`, `capabilities/`, `icons/`, `src/`). Configured `tauri.conf.json` (`com.lodgeos.frontdesk`, dimensions 1280x800, `frontendDist: "../dist"`).
- **T-030:** Packaging pipeline & release wiring: Updated [`src/components/auth/InstallLinkScreen.tsx`](file:///c:/bs/src/components/auth/InstallLinkScreen.tsx) and `.env.local` to point to `https://github.com/darkmd98-hue/BS/releases/latest` tagged `v0.1.0-beta`.
- **T-031:** Local binary compilation audit: `npx tauri info` audit confirmed WebView2 runtime is present (`152.0.4191.66`), while native toolchain is offloaded to GitHub Actions CI/CD (`.github/workflows/release.yml`) to compile Windows `.exe` and `.msi` installers and publish releases on git tag push `v0.1.0-beta`.
- **T-032:** Standalone desktop entrypoint created at `dist/index.html` featuring dark navy branding, auto-connect to `http://localhost:3000` or custom server URL, and fail-safe reconnection configuration.
- *Exit criteria met:* Tauri desktop wrapper initialized, `dist/index.html` webview shell entrypoint created, `InstallLinkScreen.tsx` verified returning HTTP 200 with GitHub Release URL and `v0.1.0-beta` badge, release workflow wired with resilient environment secrets, `next build` passes 19/19 routes with 0 errors.

## Phase 10 — Polish & QA ✅ DONE
- Full end-to-end user journey sweep across both test lodges (`pinecrest.localhost` and `lakeside.localhost`): Login → Dashboard → Rooms → Room Details → Reservations → Create Reservation → Billing → Customers → Customer Profile → Print Invoice → Admin Rooms → Admin Add Room → Admin Staff.
- Multi-tenant isolation verified with 100% rigor: cross-subdomain sessions strictly rejected with HTTP 403 Forbidden; direct cross-lodge UUID access strictly rejected with HTTP 404.
- Error handling & edge cases verified: invalid/malformed UUIDs cleanly return HTTP 404; non-existent UUIDs return HTTP 404; unknown subdomains return HTTP 404; unauthenticated requests redirect with HTTP 307.
- Accessibility & visual fidelity pass: WCAG AA contrast on badges (`StatusBadge`, `PayBadge`), explicit `htmlFor`/`id` labels on forms, semantic HTML, responsive card layouts, and tablet overflow protection.
- *Exit criteria met:* 38/38 QA assertions passed with 0 failures on production build (`next start`); `next build` passes 19/19 routes with 0 errors. App is ready for production lodge onboarding.

---

## Standing Rules for Every Phase (unchanged, worth repeating here)
1. **Do not trust a "verified"/"passed"/"done" claim without raw output** — this project has had three separate false-positive verification attempts already (a mocked test script, a superuser-bypassed RLS test, and silently-failed CLI plugin installs). Ask for actual query results, actual file listings, actual build logs.
2. **No table goes live without an RLS policy tested against two real, distinct lodges.**
3. **`memory.md` must be updated after every ticket** — if a session's summary doesn't match what's actually in `memory.md`, trust the file, investigate the mismatch before proceeding.
4. **Small, verifiable batches** — one ticket or one small group of related tickets at a time, with an explicit "do not proceed until X is confirmed" boundary, not a green light to run ahead through multiple phases unattended.

## Phase Tracking Rule
- A phase is not "done" until its exit criteria are met **and verified with raw evidence**, and `memory.md` reflects it. Update this file's status markers (✅/🔶/⬜) as phases genuinely close — don't let it drift out of sync with reality the way the original phases.md did after the pivots.