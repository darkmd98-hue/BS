# Features Ticket List

> Format: `[ID] Title — priority — brief description`. Feed into Antigravity phase-by-phase; check off in `memory.md` as completed.

## Phase 0 — Foundation
- **T-001** Set up Next.js project structure with `/register`, `/admin`, `/reception` route groups — P0
- **T-002** Connect Supabase project, generate typed client — P0
- **T-003** Implement `lodges` + `profiles` tables, role + tenant model — P0
- **T-004** Convert Stitch AI static HTML exports into componentized Next.js/Tailwind pages — P0

## Phase 1 — Registration & Tenant Foundation (New)
- **T-005** Build `RegistrationForm` — signup creates `lodges` row + admin `profiles` row via a controlled server-side function — P0
- **T-006** Build `InstallLinkScreen` — post-registration screen pointing to the GitHub Release download — P0
- **T-007** Build `StaffInviteForm` — admin invites reception staff into their own lodge — P1

## Phase 2 — Core Data Layer
- **T-008** Create `rooms`, `bookings`, `billing`, `room_photos` tables (all `lodge_id`-scoped) + migrations — P0
- **T-009** Write and apply RLS policies for tenant + role isolation per `security-access.md` — P0
- **T-010** Set up `room-photos` storage bucket with lodge-scoped path convention + RLS — P0
- **T-011** Seed two test lodges for tenant-isolation testing throughout development — P0

## Phase 3 — Room Dashboard
- **T-012** Build `RoomGrid` + `RoomCard`, scoped to current lodge, live status coloring — P1
- **T-013** Wire up Supabase Realtime, filtered by `lodge_id` — P1
- **T-014** Click-to-view branching (free vs. occupied) — P1

## Phase 4 — Booking Flow
- **T-015** `BookingForm` with validation — P1
- **T-016** Booking submit → create `bookings` + `billing` rows (lodge-scoped), flip room status — P1
- **T-017** Edit booking flow — P1
- **T-018** Checkout flow — P1

## Phase 5 — Billing
- **T-019** `BillingSummary` component — P1
- **T-020** Server-side balance-due calculation — P1
- **T-021** (Conditional) Razorpay integration — P2, pending confirmation

## Phase 6 — Calendar
- **T-022** `CalendarView`, lodge-scoped — P2
- **T-023** Click calendar entry → deep-link to booking — P2

## Phase 7 — Admin
- **T-024** Admin summary cards (lodge-scoped) — P2
- **T-025** `RoomConfigForm` — P2
- **T-026** Staff management screen — P2
- **T-027** Reporting views (lodge-scoped) — P2

## Phase 8 — Packaging & Distribution (New)
- **T-028** Set up Tauri wrapper around the Next.js app — P1
- **T-029** Build + publish installers as GitHub Releases (Windows first) — P1
- **T-030** Wire the registration flow's install link to the latest release — P1
- **T-031** (Later) Auto-update mechanism — P2, defer until lodge count justifies it

## Phase 9 — Polish & QA
- **T-032** Design-system polish pass (`ui-ux-pro-max`) — P2
- **T-033** Full QA/review pass (`gstack /qa`, `/review`), **including tenant-isolation smoke tests** — P0 (isolation testing is non-negotiable, not just nice-to-have polish)
- **T-034** Accessibility check — P2

## Deferred / Backlog
- **T-035** Client-facing booking portal per lodge (deferred)
- **T-036** Itemized billing line items (pending confirmation)
- **T-037** Activity/audit log table
- **T-038** Platform-level super-admin view across all lodges (support/ops use)

## Ticket Status Legend
- **P0** — blocking, must be done before anything else works (or is a non-negotiable safety requirement)
- **P1** — core v1 functionality
- **P2** — important but not launch-blocking

# Features Ticket List — Revised for Figma Design + Subdomain Routing

> Replaces the Stitch-based ticket list. T-001 through T-005 (project scaffold, Supabase connection, lodges/profiles schema, registration RPC, tenant isolation verification) are already complete and unaffected by this pivot — do not redo them.

## Phase 1 — Schema Expansion (New, before touching frontend)
- **T-039** Migrate schema per revised `05-backend-schema.md`: expand `rooms`, add `customers`, rename `bookings`→`reservations` (richer fields/status enum), rename `billing`→`bills`, add `payments` child table — P0
- **T-040** Add `subdomain` column + unique index to `lodges`; backfill/assign for the two existing test lodges — P0
- **T-041** Write/update RLS policies for all new and renamed tables per tenant-isolation rules — P0
- **T-042** Re-run the real (PostgREST, signed-in session) tenant isolation test against the new/renamed tables — P0, non-negotiable per rules.md

## Phase 2 — Subdomain Tenant Resolution (New, before frontend integration)
- **T-043** Build Next.js `middleware.ts` that reads the `Host` header, extracts subdomain, resolves to `lodge_id` via DB lookup — P0
- **T-044** Test subdomain resolution against the two seeded test lodges (each gets a working subdomain) before any feature UI touches it — P0

## Phase 3 — Figma Extraction: Foundation & Shared Components
- **T-045** Extract `Sidebar`, `Header`, `StatusBadge`, `PayBadge`, `Avatar`, `Toast`, `Modal` into shared component files — P0
- **T-046** Set up `/admin` and `/reception` layouts using extracted `Sidebar`/`Header` — P0
- **T-047** Carry over `recharts` dependency and confirm chart rendering works standalone before wiring real data — P1

## Phase 4 — Figma Extraction: Core Reception Flow
- **T-048** Extract `Dashboard` → real route, wire to real Supabase aggregate queries (occupancy, today's activity) — P1
- **T-049** Extract `RoomBooking` + `RoomCard` → `/reception/rooms`, wire to real `rooms` table, lodge-scoped, realtime status — P1
- **T-050** Extract `StayDetails` → wire to real `reservations`/`customers`/`bills` data for a given room — P1
- **T-051** Extract `Reservations` + `CreateReservation` → `/reception/reservations`, real create/list against `reservations` + `customers` — P1
- **T-052** Extract `Billing` → `/reception/billing`, wire to real `bills` + `payments` — P1
- **T-053** Extract `Customers` → `/reception/customers`, real CRUD against `customers` table — P1

## Phase 5 — Figma Extraction: Core Admin Flow
- **T-054** Extract `RoomManagement` + `AddRoom` → `/admin/rooms`, real CRUD against `rooms` — P1
- **T-055** Extract `UsersRoles` → `/admin/staff`, wire to real staff-invite flow (per original registration/tenant work) — P1
- **T-056** Registration (`/register`), Install-Link (`/install`), Login (`/login`) — not in Figma design, carry over from original scope, restyle to match Figma's visual language — P0

## Phase 6 — Secondary Screens
- **T-057** Extract `CustomerProfile` → `/reception/customers/[id]` — P2
- **T-058** Extract `PrintInvoice` → print-friendly bill view — P2

## Deferred Phase — Extended Feature Set (explicitly out of v1 scope)
- **T-059** Housekeeping — deferred
- **T-060** Maintenance — deferred
- **T-061** Reports (beyond basic Dashboard summary) — deferred
- **T-062** Settings — deferred
- **T-063** Backup — deferred, likely platform-level rather than app-level

## Phase 7 — Packaging & Distribution (unchanged from before)
- **T-029/030/031** Tauri wrapper, GitHub Releases, install-link wiring — as previously scoped

## Phase 8 — Polish & QA
- Full QA pass including tenant-isolation smoke tests on every new table
- Accessibility check
- Visual QA against original Figma screens (pixel/behavior fidelity check)

## Ticket Status Legend
- **P0** — blocking / non-negotiable
- **P1** — core v1 functionality (must-have for a usable product)
- **P2** — important but not launch-blocking
- **Deferred** — explicitly out of scope until later, do not build without revisiting priority first