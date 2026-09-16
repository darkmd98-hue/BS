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

## Phase 11 — LodgeOS v1.1 (Post-Launch Extended Features) ✅ DONE
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
- **T-061: Reports & Analytics (/admin/reports) ✅ DONE**
  * Created `src/lib/reports.ts` aggregate data engine computing occupancy rate today, revenue metrics (billed, received, outstanding, collection rate), payment method breakdown, payment status distribution, 14-day daily occupancy trend, and top repeat guest leaderboard.
  * Created `src/components/reports/ReportsClient.tsx` featuring Recharts AreaChart (occupancy trend), BarChart (monthly billed vs. received), and PieChart (payment method share), plus CSV export generator and print/PDF trigger.
  * Created route `src/app/admin/reports/page.tsx`.
  * Verified live with `scripts/verify-t061-reports.ts` on production build: Pinecrest (200 OK), Lakeside (200 OK), Cross-Tenant Guard (403 Forbidden), Anonymous Access Guard (307 Redirect).
- **T-062: Settings Panel (/admin/settings) ✅ DONE**
  * Migration `20260916000007_t062_settings.sql` (expanded `lodges` table with `logo_url`, `website`, `contact_phone`, `contact_email`, `check_in_time`, `check_out_time`, `currency`, `timezone`, `pet_friendly`, `cancellation_policy`, `extra_person_charge_default`, `gst_number`, `updated_at`).
  * Created `src/lib/settings.ts` data fetcher (`getLodgeSettings`) and `src/app/actions/settings.ts` server action (`updateLodgeSettingsAction`) with admin role check and tenant scoping.
  * Created `src/components/settings/SettingsClient.tsx` featuring tabbed interface: General (lodge identity, address, subdomain, contact, GST), Business Rules (check-in/check-out operating hours, default extra person charges, cancellation policy, pet friendly switch), and Roles & Security (staff summary, database RLS architecture, full permission matrix).
  * Created route `src/app/admin/settings/page.tsx`.
  * Verified live with `scripts/verify-t062-settings.ts` on production build: Pinecrest (200 OK), Lakeside (200 OK), Cross-Tenant Guard (403 Forbidden), Anonymous Access Guard (307 Redirect). 4/4 assertions passed.
- **T-063: Guest Portal (/guest/login & /guest/[reservationId]) ✅ DONE**
  * Migration `20260916000008_t063_guest_portal.sql` (`guest_sessions` and `guest_messages` tables with RLS and indexes).
  * Created `src/lib/guest.ts` data fetcher (`getGuestReservationDetails`) enforcing strict lodge-scoped isolation.
  * Created `src/app/actions/guest.ts` server actions: `requestGuestOtpAction`, `verifyGuestOtpAction`, `requestEarlyCheckoutAction`, `sendGuestMessageAction`.
  * Created `src/components/guest/GuestLoginForm.tsx` with branded passwordless OTP authentication and `src/app/guest/login/page.tsx`.
  * Created `src/components/guest/GuestPortalClient.tsx` with stay details, folio summary, print invoice trigger, early checkout request modal, and front desk live messaging thread, plus dynamic route `src/app/guest/[reservationId]/page.tsx`.
  * Verified live with `scripts/verify-t063-guest.ts` on production build: Pinecrest login (200 OK), Lakeside login (200 OK), Pinecrest stay portal (200 OK), Lakeside stay portal (200 OK), Pinecrest cross-access blocked (404 Not Found), Lakeside cross-access blocked (404 Not Found), Invalid UUID guard (404 Not Found). 7/7 assertions passed.
  * *Exit criteria met:* All 5 deferred features in LodgeOS v1.1 (T-059 to T-063) are fully built, isolated, verified live, and production ready.

## Phase 12 — LodgeOS v2 (Enterprise & Scaling Features) 🔶 IN PROGRESS
- **T-101: Multi-Property Management ✅ DONE**
  * Migration `20260916000009_t101_multi_property.sql` (`user_organizations` table and `lodges.organization_id` foreign key with RLS and indexes).
  * Created `src/lib/multi-property.ts` data fetcher (`getMultiPropertyData`) computing unified portfolio metrics (total properties, combined rooms, portfolio occupancy %, total billed/received/balance, collection rate, and cross-property staff registry).
  * Created `src/app/actions/multi-property.ts` server actions (`createOrganizationAction`, `reassignStaffAction`).
  * Created `src/components/organization/MultiPropertyClient.tsx` featuring portfolio KPI header, property comparative cards with live occupancy meters, portfolio financials breakdown table, and staff reassignment modal.
  * Created route `src/app/admin/multi-property/page.tsx` and updated `src/components/shared/Sidebar.tsx` with property switcher trigger and navigation link.
- **T-102: Channel Manager Integration (Airbnb, Booking.com) ✅ DONE**
  * Migration `20260916000010_t102_channel_manager.sql` (`channel_integrations` and `channel_sync_log` tables with RLS and foreign keys, plus `reservations` channel columns).
  * Created `src/lib/channels.ts` fetching OTA integrations, sync logs, and calculating revenue & booking distribution percentages.
  * Created `src/app/actions/channels.ts` server actions (`saveChannelIntegrationAction`, `triggerChannelSyncAction`, `importDemoChannelBookingAction`).
  * Created `src/components/channels/ChannelManagerClient.tsx` featuring real-time OTA connection cards (Airbnb, Booking.com, Agoda, MakeMyTrip), credentials configuration modal, bidirectional inventory synchronization trigger, inbound simulated webhook booking injector, and sync audit timeline.
  * Created route `src/app/admin/channels/page.tsx` and updated `src/components/shared/Sidebar.tsx` navigation.
- **T-103: Advanced Reporting & BI ✅ DONE**
  * Migration `20260916000011_t103_advanced_bi.sql` (`lodge_expenses` table with RLS policies, indexes on `lodge_id`, `expense_date`, and `category`).
  * Created `src/types/bi.ts` and `src/lib/bi.ts` analytics engine computing Gross Revenue, Operating Expenses, Net Operating Income (NOI), Net Margin %, RevPAR, ADR, Occupancy %, and categorized expense allocations.
  * Created `src/app/actions/bi.ts` server actions (`createExpenseAction`, `deleteExpenseAction`) with admin role enforcement.
  * Created `src/components/bi/AdvancedBIClient.tsx` with executive KPI cards, 6-month Revenue vs Expenses vs NOI chart, RevPAR & ADR yield trend line chart, formal P&L statement table with print formatting, expense allocation donut chart, interactive expense logger modal, and CSV export.
  * Created route `src/app/admin/bi/page.tsx` and updated `src/components/shared/Sidebar.tsx` navigation.
  * Verified live with `scripts/verify-t103-bi.ts` on production build: Pinecrest (200 OK), Lakeside (200 OK), Cross-Tenant Guard (403 Forbidden), Anonymous Access Guard (307 Redirect). 4/4 assertions passed.
- **T-104: Mobile App — Staff (iOS & Android) ⬜ NEXT**
- **T-105: Advanced RBAC ⬜ PENDING**
- **T-106: Payment Gateway (Stripe, Razorpay) ⬜ PENDING**
- **T-107: Email & SMS Notifications (Twilio) ⬜ PENDING**

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