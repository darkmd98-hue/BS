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

## Phase 7 — Figma Extraction: Core Admin Flow 🔶 IN PROGRESS
- **T-054** RoomManagement + AddRoom → `/admin/rooms`
- **T-055** UsersRoles → `/admin/staff`, real staff-invite flow
- **T-056** Restyle `/register`, `/install`, `/login` to match the Figma visual language (these screens aren't in the Figma export itself, so this is a deliberate design-matching pass, not an extraction)
- *Exit criteria:* an admin can configure rooms and invite staff for their own lodge only, verified against the second test lodge for isolation.

## Phase 8 — Secondary Screens ⬜ NOT STARTED
- **T-057** CustomerProfile
- **T-058** PrintInvoice
- *Exit criteria:* both functional, non-blocking for v1 launch if deprioritized further.

## Deferred Phase — Extended Feature Set ⬜ EXPLICITLY NOT IN CURRENT SCOPE
- **T-059** Housekeeping
- **T-060** Maintenance
- **T-061** Reports (beyond basic Dashboard summary)
- **T-062** Settings
- **T-063** Backup (likely platform-level, not app-level)
- Do not start these without a deliberate re-scoping conversation — they exist in the Figma design but were never part of the original PRD.

## Phase 9 — Packaging & Distribution ⬜ NOT STARTED
- **T-029–T-031:** Tauri wrapper, GitHub Releases publishing, install-link wiring — unchanged from original plan, just renumbered here for sequencing clarity.

## Phase 10 — Polish & QA ⬜ NOT STARTED
- Design-system fidelity pass against the actual Figma screens (pixel/behavior check, not just "looks close")
- Full QA pass, **including mandatory tenant-isolation smoke tests on every table touched during Phases 3–8**
- Accessibility check

---

## Standing Rules for Every Phase (unchanged, worth repeating here)
1. **Do not trust a "verified"/"passed"/"done" claim without raw output** — this project has had three separate false-positive verification attempts already (a mocked test script, a superuser-bypassed RLS test, and silently-failed CLI plugin installs). Ask for actual query results, actual file listings, actual build logs.
2. **No table goes live without an RLS policy tested against two real, distinct lodges.**
3. **`memory.md` must be updated after every ticket** — if a session's summary doesn't match what's actually in `memory.md`, trust the file, investigate the mismatch before proceeding.
4. **Small, verifiable batches** — one ticket or one small group of related tickets at a time, with an explicit "do not proceed until X is confirmed" boundary, not a green light to run ahead through multiple phases unattended.

## Phase Tracking Rule
- A phase is not "done" until its exit criteria are met **and verified with raw evidence**, and `memory.md` reflects it. Update this file's status markers (✅/🔶/⬜) as phases genuinely close — don't let it drift out of sync with reality the way the original phases.md did after the pivots.