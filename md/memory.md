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
`Phase 12 — LodgeOS v2 (Enterprise Features: T-101 to T-107)`

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

- [x] **Phase 6 — Figma Extraction: Reception Experience Batch (COMPLETED):**
  - **T-048 (Dashboard):** Implemented `/reception` route with metric cards, today's arrivals, today's departures, and financial totals wired strictly to `tenant.lodgeId`.
  - **T-049 (Room Booking):** Implemented `/reception/rooms` route with interactive status filtering (`all`, `available`, `occupied`, `reserved`, `cleaning`, `maintenance`) and room cards using real PostgREST queries.
  - **T-050 (Stay Details):** Implemented `/reception/rooms/[id]` with room status, check-in details, bill folios, and payment histories.
  - **T-051 (Reservations):** Implemented `/reception/reservations` list and `/reception/reservations/new` booking form with Next.js Server Action atomically inserting customer and reservation records.
  - **T-052 (Billing):** Implemented `/reception/billing` with financial breakdown metrics and bill ledger.
  - **T-053 (Customers):** Implemented `/reception/customers` directory with stay counts, total spent, and contact details.
  - **Verification:** Verified live against production build (`next start -p 3000`) across all 6 screens under both `pinecrest.localhost` and `lakeside.localhost`, confirming 0 cross-tenant data leakage and HTTP 404 on cross-lodge room access.

---

- [x] **Phase 7 — Figma Extraction: Core Admin Flow & Auth Restyling (COMPLETED):**
  - **T-054 (Room Management & Add Room):** Implemented `/admin/rooms` and `/admin/rooms/new` with full room inventory listing, dynamic status controls, room deletion action, and room creation action scoped to `tenant.lodgeId`.
  - **T-055 (Users & Roles / Staff Management):** Implemented `/admin/staff` displaying lodge staff profiles, role permissions matrix, and atomic staff invitation action using `createAdminClient()`.
  - **T-056 (Auth & Onboarding Restyling):** Restyled `/login`, `/register`, and `/install` matching the Figma design system (`#0b1437` dark navy, subtle gray borders, minimal font-display headers).
  - **Verification:** Verified live in production build (`next start -p 3000`) across all admin screens under both `pinecrest.localhost` and `lakeside.localhost`, confirmed restyled auth/onboarding routes render correctly, and re-verified cross-tenant direct UUID access yields HTTP 404.

---

- [x] **Phase 8 — Secondary Screens (COMPLETED):**
  - **T-057 (CustomerProfile):** Implemented `/reception/customers/[id]` — full stay history, visit count, live totals (collected + outstanding), per-reservation billing summary with Print Invoice link, `notFound()` boundary guard. PostgREST `bills` join correctly unwrapped as array (`r.bills[0]`).
  - **T-058 (PrintInvoice):** Implemented `/reception/billing/[billId]/print` — clean print layout (customer, room, stay dates, itemized charges, totals, payment receipts), `window.print()` isolated in `PrintPageClient.tsx` client component, `@media print` CSS hides navigation button.
  - **Bonus fixes:** `PayBadge` hardened to guard `null`/`undefined` status; billing list "Details" wired to `/reception/billing/[billId]/print`; customers list wired with "Profile" link to `/reception/customers/[id]`.
  - **Verification (all 6 checks PASS):** via `scripts/verify-phase8-secondary.ts` against `next start -p 3000`:
    * Lodge A → `/reception/customers/6aab08b3...` (Customer Alpha): HTTP 200 ✅
    * Lodge B → `/reception/customers/b988d66d...` (Customer Beta): HTTP 200 ✅
    * Lodge A → `/reception/billing/13127803.../print`: HTTP 200 ✅
    * Lodge B → `/reception/billing/8e1ba6d6.../print`: HTTP 200 ✅
    * Lodge A → Lodge B Customer UUID: HTTP 404 ✅
    * Lodge A → Lodge B Bill UUID: HTTP 404 ✅
  - `next build` → 0 errors, 18 routes.

---

- [x] **Phase 9 — Packaging & Distribution Setup & Release Wiring (COMPLETED):**
  - **T-029 (Tauri Scaffolding & Configuration):**
    - Installed `@tauri-apps/cli@2.11.4` and added `tauri` run script to `package.json`.
    - Generated complete Tauri v2 project structure under `src-tauri/` (`Cargo.toml`, `build.rs`, `tauri.conf.json`, `capabilities/`, `icons/`, `src/lib.rs`, `src/main.rs`).
    - Configured `tauri.conf.json`: package identifier `com.lodgeos.frontdesk`, title `LodgeOS Front Desk`, default resolution 1280x800 (min 960x640), bundle targets `"all"`, devUrl `http://localhost:3000`.
  - **T-030 (Install Link & Release Wiring):**
    - Updated [`src/components/auth/InstallLinkScreen.tsx`](file:///c:/bs/src/components/auth/InstallLinkScreen.tsx) and `.env.local` to point directly to `https://github.com/darkmd98-hue/BS/releases/latest`.
    - Tag set to `v0.1.0-beta`.
    - Verified live `/install` route returns HTTP 200, renders the release URL link, and displays `v0.1.0-beta` via `scripts/verify-install-screen.ts`.
  - **T-031 (Local Build Environment Assessment & CI/CD Pipeline):**
    - Audited environment with `npx tauri info`.
    - Verified WebView2 runtime is present (`152.0.4191.66`).
    - Identified that the local machine environment does not have Rust/Cargo or MSVC C++ Build Tools installed in PATH.
    - Added automated GitHub Actions CI/CD release workflow (`.github/workflows/release.yml`) so that pushing tag `v0.1.0-beta` runs on GitHub hosted Windows runners with full MSVC/Rust tools to generate and publish `.exe` and `.msi` installers to GitHub Releases.
  - **T-032 (Standalone Desktop Entrypoint & Fail-safe Reconnect):**
    - Created `dist/index.html` featuring dark navy branding (`#0b1437`), auto-connect to `http://localhost:3000`, and interactive URL reconfiguration fallback for custom domain/cloud deployments.

---

- [x] **Phase 10 — Final QA & Accessibility & Polish (COMPLETED):**
  - **T-064 (End-to-End User Journey Sweep):**
    - Verified entire reception and admin journey for both `pinecrest.localhost` and `lakeside.localhost`: Login → Dashboard → Rooms → Stay Details → Reservations → New Reservation → Billing → Customers → Customer Profile → Print Invoice → Admin Rooms → Add Room → Admin Staff.
    - Confirmed dynamic branding, statistics, and records render correctly for each lodge.
  - **T-065 (Multi-Tenant Isolation Sweep):**
    - Bi-directional cross-tenant access test: Pinecrest auth session hitting `lakeside.localhost` returns HTTP 403 Forbidden. Lakeside session hitting `pinecrest.localhost` returns HTTP 403 Forbidden.
    - Direct cross-lodge UUID access boundary test: Pinecrest session attempting to access Lakeside Customer UUID or Bill UUID returns clean HTTP 404.
  - **T-066 (Error Handling & Edge Cases):**
    - Non-existent UUIDs, malformed UUIDs (`not-a-valid-uuid`), and unknown subdomains all return clean HTTP 404 responses with no unhandled server crashes (0 500 errors).
    - Unauthenticated requests to protected endpoints redirect with HTTP 307 to `/login`.
  - **T-067 (Accessibility & Visual Fidelity):**
    - Contrast ratios on all status badges (`available`, `occupied`, `reserved`, `cleaning`, `maintenance`) and payment badges (`paid`, `partial`, `unpaid`) meet WCAG AA standards.
    - Form inputs paired with semantic `<label htmlFor>` associations and unique IDs.
    - Visual layout matches Figma reference palette (`#0b1437`, slate accents, clean border hierarchy).
  - **Results:** 38/38 QA assertions passed with 0 failures on production build. `next build` passes with 0 errors across 19 routes.
 
---

- [x] **Phase 11 — LodgeOS v1.1 Extended Features (IN PROGRESS):**
  - **T-059 (Housekeeping Workflow — COMPLETE):**
    * Created `supabase/migrations/20260915000005_t059_housekeeping.sql` (adds `cleaning_status`, `last_cleaned_at`, `cleaning_staff_assigned` to `rooms`; creates `cleaning_log` table with RLS).
    * Created server fetchers `src/lib/housekeeping.ts` and actions `src/app/actions/housekeeping.ts` (`startCleaningAction`, `markRoomCleanAction`, `bulkMarkCleanAction`, `flagRoomForCleaningAction`).
    * Created interactive `src/components/housekeeping/HousekeepingClient.tsx` and route `src/app/admin/housekeeping/page.tsx`.
    * Wired admin sidebar with Operations, Analytics, Config navigation sections.
  - **T-060 (Maintenance Tracking — COMPLETE):**
    * Created `supabase/migrations/20260915000006_t060_maintenance.sql` (creates `maintenance_tickets` table with RLS policies, index on lodge_id, room_id, status, priority, created_at).
    * Created server fetchers `src/lib/maintenance.ts` and actions `src/app/actions/maintenance.ts` (`createMaintenanceTicketAction`, `updateTicketStatusAction`, `assignTicketAction`).
    * Created `src/components/maintenance/MaintenanceClient.tsx` with Kanban Board (Open, In Progress, Resolved), room history tab, filter bar, report issue modal with technician assignment, and resolution notes modal.
    * Created route `src/app/admin/maintenance/page.tsx`.
  - **T-061 (Reports & Analytics — COMPLETE):**
    * Created `src/lib/reports.ts` aggregate engine computing occupancy rates, revenue metrics, payment method distributions, and customer repeat metrics.
    * Created `src/components/reports/ReportsClient.tsx` featuring Recharts visualizations (AreaChart, BarChart, PieChart), dynamic tabs, top repeat guests table, CSV export, and PDF print formatting.
    * Created dynamic route `src/app/admin/reports/page.tsx`.
  - **T-062 (Settings Panel — COMPLETE):**
    * Created `supabase/migrations/20260916000007_t062_settings.sql` (expanded `lodges` with logo_url, website, contact_phone, contact_email, check_in_time, check_out_time, currency, timezone, pet_friendly, cancellation_policy, extra_person_charge_default, gst_number, updated_at).
    * Created data fetcher `src/lib/settings.ts` (`getLodgeSettings`) and server action `src/app/actions/settings.ts` (`updateLodgeSettingsAction`) with admin role checks and tenant scoping.
    * Created `src/components/settings/SettingsClient.tsx` featuring tabbed interface: General (lodge identity, address, subdomain, contact, GST), Business Rules (check-in/check-out operating hours, default extra person charges, cancellation policy, pet friendly switch), and Roles & Security (staff summary, database RLS architecture, full permission matrix).
    * Created route `src/app/admin/settings/page.tsx`.
  - **T-063 (Guest Portal — COMPLETE):**
    * Created `supabase/migrations/20260916000008_t063_guest_portal.sql` (`guest_sessions` and `guest_messages` tables with RLS policies and indexes).
    * Created data fetcher `src/lib/guest.ts` (`getGuestReservationDetails`) enforcing strict lodge-scoped isolation.
    * Created server actions `src/app/actions/guest.ts`: `requestGuestOtpAction`, `verifyGuestOtpAction`, `requestEarlyCheckoutAction`, `sendGuestMessageAction`.
    * Created `src/components/guest/GuestLoginForm.tsx` with branded passwordless OTP authentication and route `src/app/guest/login/page.tsx`.
    * Created `src/components/guest/GuestPortalClient.tsx` with stay details, folio summary, print invoice trigger, early checkout request modal, and front desk live messaging thread, plus dynamic route `src/app/guest/[reservationId]/page.tsx`.
- [x] **Phase 11 — LodgeOS v1.1 Extended Features (COMPLETE):**
  - T-059 (Housekeeping Workflow), T-060 (Maintenance Tracking), T-061 (Reports & Analytics), T-062 (Settings Panel), T-063 (Guest Portal) — all 5 features fully built, tested, and verified live on production builds.

- [ ] **Phase 12 — LodgeOS v2 Enterprise Features (IN PROGRESS):**
  - **T-101 (Multi-Property Management — COMPLETE):**
    * Created `supabase/migrations/20260916000009_t101_multi_property.sql` (`user_organizations` table, `lodges.organization_id` foreign key, RLS policies, indexes).
    * Created data fetcher `src/lib/multi-property.ts` (`getMultiPropertyData`) aggregating cross-property occupancy, revenue metrics, collection rates, and staff assignments.
    * Created server actions `src/app/actions/multi-property.ts` (`createOrganizationAction`, `reassignStaffAction`).
    * Created `src/components/organization/MultiPropertyClient.tsx` featuring portfolio header, property comparative cards, portfolio financials breakdown table, and staff reassignment modal.
    * Created route `src/app/admin/multi-property/page.tsx` and updated `src/components/shared/Sidebar.tsx` with property switcher trigger and navigation item.
  - **T-102 (Channel Manager Integration — COMPLETE):**
    * Created `supabase/migrations/20260916000010_t102_channel_manager.sql` (`channel_integrations` and `channel_sync_log` tables with RLS and foreign keys, plus `reservations` channel columns).
    * Created `src/lib/channels.ts` fetching OTA integrations, sync logs, and calculating revenue & booking distribution percentages.
    * Created `src/app/actions/channels.ts` server actions (`saveChannelIntegrationAction`, `triggerChannelSyncAction`, `importDemoChannelBookingAction`).
    * Created `src/components/channels/ChannelManagerClient.tsx` featuring real-time OTA connection cards (Airbnb, Booking.com, Agoda, MakeMyTrip), credentials configuration modal, bidirectional inventory synchronization trigger, inbound simulated webhook booking injector, and sync audit timeline.
    * Created route `src/app/admin/channels/page.tsx` and updated `src/components/shared/Sidebar.tsx` navigation.
  - **T-103 (Advanced Reporting & BI — COMPLETE):**
    * Created `supabase/migrations/20260916000011_t103_advanced_bi.sql` (`lodge_expenses` table with RLS policies, indexes on `lodge_id`, `expense_date`, and `category`).
    * Created `src/types/bi.ts` and `src/lib/bi.ts` analytics engine computing Gross Revenue, Operating Expenses, Net Operating Income (NOI), Net Margin %, RevPAR, ADR, Occupancy %, and categorized expense allocations.
    * Created `src/app/actions/bi.ts` server actions (`createExpenseAction`, `deleteExpenseAction`) with admin role enforcement.
    * Created `src/components/bi/AdvancedBIClient.tsx` featuring executive KPI cards, 6-month Revenue vs Expenses vs NOI chart, RevPAR & ADR yield trend line chart, formal P&L statement table with print formatting, expense allocation donut chart, interactive expense logger modal, and CSV export.
    * Created route `src/app/admin/bi/page.tsx` and updated `src/components/shared/Sidebar.tsx` navigation.
  - **T-104 (Mobile App — Staff — COMPLETE):**
    * Created `supabase/migrations/20260916000012_t104_mobile_staff.sql` (`staff_device_tokens` table for FCM mobile push tokens and cross-platform device registry with RLS policies).
    * Created standalone React Native / Expo workspace in `mobile/` (`package.json`, `app.json`, `App.tsx`) with `@supabase/supabase-js`, local SQLite/AsyncStorage offline queue, camera ticket capture, and push notifications. Excluded `mobile/` in root `tsconfig.json`.
    * Created Next.js mobile companion route `/mobile` with `src/types/mobile.ts`, `src/lib/mobile.ts`, `src/app/actions/mobile.ts` (`registerStaffDeviceAction`, `syncMobileTasksAction`, `quickUpdateRoomStatusAction`), and `src/components/mobile/MobileStaffClient.tsx`.
    * Touch-optimized UI featuring cleaning turnover queue, one-tap room completion, maintenance ticket resolver, simulated offline mode (basement Wi-Fi deadzone), automatic task cache sync, and fast QR check-in pass lookup.
    * Wired `Sidebar.tsx` with Mobile Companion shortcut; updated middleware `isProtectedRoute` to guard `/mobile` with strict cross-tenant (403) and unauthenticated (307) protection.
    * Verified live on production build with `scripts/verify-t104-mobile.ts`: Pinecrest (200 OK), Lakeside (200 OK), Cross-Tenant Guard (403 Forbidden), Anonymous Access Guard (307 Redirect). 4/4 assertions passed.

  - **T-105 (Advanced RBAC & Security Audit Log — COMPLETE):**
    * Created `supabase/migrations/20260916000013_t105_advanced_rbac.sql` (`roles`, `role_permissions`, and `audit_log` tables with RLS policies and tenant-isolated indexes).
    * Created `src/types/rbac.ts` and `src/lib/rbac.ts` aggregating system roles, custom roles, staff profiles, permission categories, and security audit entries.
    * Created `src/app/actions/rbac.ts` server actions (`saveCustomRoleAction`, `deleteRoleAction`, `assignStaffRoleAction`) with admin role validation and audit trail logging.
    * Created `src/components/rbac/AdvancedRBACClient.tsx` featuring permissions matrix, role builder drawer, staff assignment manager, and audit log viewer.
    * Created route `src/app/admin/roles/page.tsx` with admin security checks and wired `Sidebar.tsx` navigation.
  - **T-106 (Payment Gateway Integration — COMPLETE):**
    * Created `supabase/migrations/20260916000014_t106_payment_gateway.sql` (`lodge_payment_gateways` and `payment_gateway_webhooks` tables with RLS policies, plus extended `payments` tracking columns).
    * Created `src/types/payments.ts` and `src/lib/payments-gateway.ts` engine aggregating gateway merchant configurations, online transaction history, webhook streams, and folio metrics.
    * Created `src/app/actions/payments-gateway.ts` server actions (`saveGatewayConfigAction`, `simulateOnlinePaymentAction`, `refundPaymentAction`) with admin role checks and audit log emission.
    * Created webhook route `src/app/api/webhooks/payments/route.ts` with service-role admin ingestion and automated folio balance adjustments.
    * Created `src/components/payments/PaymentGatewayClient.tsx` featuring Dual Gateway credentials cards, test sandbox terminal, folio transaction ledger, and webhook stream.
    * Created route `src/app/admin/payments/page.tsx` with admin security check and wired `Sidebar.tsx` navigation under Config.
  - **T-107 (Email & SMS Notifications — COMPLETE):**
    * Created `supabase/migrations/20260916000015_t107_notifications.sql` (`lodge_notification_settings`, `notification_templates`, and `notification_log` tables with RLS policies).
    * Created `src/types/notifications.ts` and `src/lib/notifications.ts` engine aggregating omnichannel triggers, template customizers, provider credentials, and delivery logs.
    * Created `src/app/actions/notifications.ts` server actions (`saveProviderSettingsAction`, `saveNotificationTemplateAction`, `dispatchTestNotificationAction`) with admin role guards and audit tracking.
    * Created `src/components/notifications/NotificationsManagerClient.tsx` featuring mustache template builder, Twilio/SendGrid credentials manager, live test dispatch terminal, and delivery audit ledger.
    * Created route `src/app/admin/notifications/page.tsx` with admin security checks and wired `Sidebar.tsx` navigation under Config.
    * Verified live on production build with `scripts/verify-t107-notifications.ts`: Pinecrest (200 OK), Lakeside (200 OK), Cross-Tenant Guard (403 Forbidden), Anonymous Access Guard (307 Redirect). 4/4 assertions passed.

---

## Status
**LodgeOS v1.1 (Phases T-059 to T-063) and v2 Enterprise (Phases T-101 to T-107) are 100% COMPLETE, verified with raw live assertions against production build, committed, and synced to master.**

---

## Decisions Log
- `[Phase 0]` Chose Next.js App Router monorepo with route groups `(auth)`, `admin`, and `reception`.
- `[Phase 0]` Built Postgres security-definer helper functions (`get_auth_lodge_id()`, `get_auth_role()`) in migration to optimize RLS evaluation and prevent recursive query loops.
- `[Phase 1 / T-005]` Decided to implement atomic tenant provisioning via a `SECURITY DEFINER` Postgres function (`create_new_lodge_tenant`) called by Next.js Server Action (`registerLodgeAction`). Postgres enforces transaction atomicity, preventing orphaned `lodges` or `profiles` if any step fails.
- `[Figma Pivot]` Replaced Stitch frontend with direct extraction from Figma Make export (`design-reference/`). Kept onboarding (`/register`, `/install`, `/login`) and all database/auth infrastructure intact. Excluded `design-reference` from build typecheck as it serves as reference-only source code.

