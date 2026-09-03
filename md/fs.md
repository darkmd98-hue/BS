# Frontend Specification Document

## 1. Framework & Conventions
- Next.js App Router; single codebase serving all lodges
- Route groups: `/register` (public, pre-auth), `/admin/*`, `/reception/*`, shared `/components/*`, `/lib/*`
- Tailwind CSS, matching `ui-ux-pro-max` design-system output
- Packaged as a Tauri desktop app for the installed experience — the `/admin` and `/reception` routes are what's shown inside the installed app; `/register` is typically visited via browser pre-install

## 2. Component Inventory (v1)

| Component | Purpose |
|---|---|
| `RegistrationForm` | New lodge owner signup — creates `lodges` + `profiles` (admin) rows |
| `InstallLinkScreen` | Post-registration screen with the GitHub Release download link |
| `RoomCard` | Single room tile — status color, room number, guest summary if occupied |
| `RoomGrid` | Layout wrapper for `RoomCard`s, fetch + realtime subscription **scoped to current lodge_id** |
| `BookingPanel` | Slide-over/modal — booking form or booking detail |
| `BookingForm` | Name/Phone/Address/Room/Advance/Total fields + validation |
| `BillingSummary` | Total/Advance/Balance/Status display |
| `CheckoutConfirm` | Confirmation step for checkout + settle balance |
| `CalendarView` | Month view of bookings for the lodge |
| `AdminSummaryCards` | Occupancy %, revenue, pending balances — this lodge only |
| `RoomConfigForm` | Admin-only — add/edit rooms |
| `StaffInviteForm` | Admin invites reception staff into their own lodge |
| `StaffLoginForm` | Auth entry point, shared by both apps |

## 3. State & Data Fetching
- Every Supabase query implicitly scoped by the authenticated user's `lodge_id` (resolved server-side from `profiles`, never passed as a trusted client parameter)
- Realtime subscriptions filtered to the current `lodge_id` channel only
- Server Components for initial dashboard load; client components for interactive panels

## 4. Stitch → Next.js Conversion Rules
1. Strip inline styles/static asset paths from Stitch output; replace with Tailwind classes matching design tokens.
2. Break the static page into the component inventory above — no monolithic page components.
3. Replace static/dummy data with real Supabase queries, always scoped by `lodge_id`.
4. Preserve visual layout/spacing from Stitch; save redesign for the separate polish pass.
5. Log completion in `memory.md` per page/component.

## 5. Form Validation Rules
- Registration: valid email, password strength check, lodge name required
- Booking: Name/Phone/Address required; Advance ≤ Total; numeric fields validated

## 6. Error & Empty States
- Room grid: loading skeleton; empty state if a brand-new lodge has zero rooms configured yet (nudge toward `RoomConfigForm`)
- Booking form: inline validation errors
- Registration: clear error if email already registered (don't silently create a duplicate lodge)

## 7. Testing Hooks
- `data-testid` attributes on key interactive elements for QA passes (`gstack /qa`)
- Include a tenant-isolation smoke test in the test suite: log in as Lodge A staff, attempt to fetch a known Lodge B room/booking ID directly, confirm it's rejected.

# Frontend Specification Document — Figma Design Extraction

## 1. Source of Truth
- The **Figma Make export** (`figma-make-app`, React 19 + Vite + Tailwind v4) is now the sole frontend design source. The earlier Stitch-generated components are discarded — do not reference or preserve them.
- The Figma export is a **client-only prototype**: one monolithic `App.tsx` (~2,270 lines), 17 screens switched via a `Screen` string type and a `switch` statement, no routing library, no Supabase, no auth, no multi-tenancy, all data in-memory mock arrays (`ROOMS_DATA`, `CUSTOMERS_DATA`, `RESERVATIONS_DATA`, `BILLS_DATA`, etc.).
- The job now is to **extract this into real Next.js App Router routes and components**, wire each to live Supabase data (per the revised `05-backend-schema.md`), scoped by `lodge_id`, and add subdomain-aware tenant resolution.

## 2. Actual Component/Screen Inventory (from the Figma export)

| Figma function | Becomes Next.js route | Phase |
|---|---|---|
| `Dashboard` | `/reception` or `/admin` (role-dependent landing) | P1 — core |
| `RoomBooking` + `RoomCard` | `/reception/rooms` | P1 — core |
| `StayDetails` | `/reception/rooms/[roomId]` or a panel/modal | P1 — core |
| `PrintInvoice` | `/reception/bills/[billId]/print` | P2 |
| `Reservations` | `/reception/reservations` | P1 — core |
| `CreateReservation` | `/reception/reservations/new` | P1 — core |
| `Billing` | `/reception/billing` | P1 — core |
| `Customers` | `/reception/customers` | P1 — core |
| `CustomerProfile` | `/reception/customers/[customerId]` | P2 |
| `RoomManagement` + `AddRoom` | `/admin/rooms` | P1 — core (admin needs to configure rooms before reception can use them) |
| `Housekeeping` | `/admin/housekeeping` or `/reception/housekeeping` | **Deferred** |
| `Maintenance` | `/admin/maintenance` | **Deferred** |
| `Reports` | `/admin/reports` | **Deferred** |
| `Settings` | `/admin/settings` | **Deferred** |
| `UsersRoles` | `/admin/staff` | P1 — core (needed for basic staff invite flow) |
| `Backup` | `/admin/backup` | **Deferred**, possibly platform-level, not app-level |
| `Sidebar`, `Header` | Shared layout components (`layout.tsx` for `/admin` and `/reception`) | P0 |
| `StatusBadge`, `PayBadge`, `Avatar`, `Toast`, `Modal` | Shared `/components/ui/*` primitives | P0 |
| (not in Figma — still needed) | `/register`, `/install`, `/login` | P0 — carry over from original scope, Figma doesn't include onboarding screens |

## 3. Conversion Rules (Figma monolith → real app)
1. **Do not preserve the monolithic single-file structure.** Break every function in `App.tsx` into its own component file under the correct directory (`src/components/reception/*`, `src/components/admin/*`, `src/components/shared/*`), matching Next.js conventions.
2. **Replace the `Screen` switch/state-based navigation with real Next.js routing** (App Router pages/layouts) — this is a structural change, not just a file split, since the whole app currently has no real URLs.
3. **Replace every mock data array** (`ROOMS_DATA`, `CUSTOMERS_DATA`, `RESERVATIONS_DATA`, `BILLS_DATA`, `REVENUE_DATA`, `MONTHLY_DATA`) **with real Supabase queries**, scoped by the authenticated user's `lodge_id`, per `05-backend-schema.md`.
4. **Preserve the visual design exactly** — colors, spacing, layout, the `StatusBadge`/`PayBadge` color conventions, chart types (recharts `AreaChart`/`BarChart`/`PieChart` usage in Dashboard/Reports) — this is the client's approved look; don't redesign during extraction.
5. **`recharts` is a real dependency already in the Figma export's `package.json`** — carry it into the main project's dependencies rather than re-implementing charts differently.
6. Every interactive action currently backed by local `useState` (creating a reservation, updating a room's status, recording a payment) must be replaced with a real server action / Supabase mutation, respecting RLS.
7. Ignore `AGENTS.md` and `CLAUDE.md` from the Figma export — those are Figma Make's own internal tooling instructions for its hosted dev environment, not instructions for this project.

## 4. Subdomain-Aware Routing (New Requirement)
- Every lodge gets a unique `subdomain` (per the revised `lodges` table).
- Next.js `middleware.ts` must read the `Host` header, extract the subdomain, and resolve it to a `lodge_id` **before** any route handler runs — this sits in front of the existing auth/RLS layer, not instead of it.
- This must be built and tested (with the two existing seeded/test lodges) before deep integration of the Figma screens, per the architectural sequencing principle already agreed on: get tenant resolution right before building feature UI on top of it.
- Naming: use `lodge_id` throughout (not `tenant_id`) to stay consistent with the existing schema and RLS policies — do not introduce a parallel naming convention.

## 5. Form Validation Rules
- Carry over from the Figma design's implied validation (required fields visible in `CreateReservation`, `AddRoom` forms) — inspect each form component during extraction and document actual field constraints as they're implemented.
- Registration/login screens (not in Figma) — validation rules as previously defined in this doc's earlier version: valid email, password strength, required lodge name.

## 6. Testing Hooks
- `data-testid` attributes on key interactive elements during extraction.
- Tenant-isolation smoke tests remain mandatory for every new data-backed screen, per `rules.md` and the now-verified pattern from T-005 (real signed-in Supabase client sessions, not SQL Editor superuser sessions, not mocked test scripts).