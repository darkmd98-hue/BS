# Product Requirements Document (PRD)

## 1. Project Overview
**Project Name:** Lodge Booking & Billing System (multi-tenant SaaS)
**Built by:** Sam (developer)
**Audience:** Any lodge/boutique hotel owner who registers an account — this is a product for many lodges, not a single-client build.

## 2. Problem Statement
Small/boutique lodges have no centralized way to track room occupancy, booking details, and billing. This product gives any lodge owner a self-serve way to sign up, get the app, and start managing bookings — without needing their own technical setup.

## 3. Business Model / Distribution
- Lodge owners **register an account** on the platform (this account is their tenant identity — all their data is scoped to it).
- After registering, they're given a **download/install link (distributed via GitHub Releases)** for the app.
- The app is a lightweight installable client that connects back to **one shared, centrally-managed backend** — owners are not running their own servers or databases.
- Their cloud storage (bookings, billing, room photos) lives under their registered account in the shared backend — isolated from every other lodge's data.

## 4. System Structure — Three-Sided System (per lodge)

| Side | Status | Purpose |
|---|---|---|
| **Admin** | In scope now | Standalone app view for the lodge owner/manager — oversight, reporting, configuration, full access to their lodge's rooms/bookings/billing only |
| **Reception** | In scope now | Staff-facing tool for day-to-day bookings — check-in, check-out, room status, billing entry |
| **Client** | Deferred | Future customer-facing self-service portal per lodge — not urgent, decide scope later |

*(Implicit "platform" layer — you, as the vendor, may eventually want a super-admin view across all lodges for support/billing purposes. Not required for v1, but flag `lodges` as a first-class table now so it's not a painful retrofit later.)*

## 5. Core Features (v1 Scope, per lodge)

### 5.1 Registration & Onboarding (New)
- Owner signs up (email/password) → creates a `lodges` record (tenant) tied to their account
- Basic lodge setup: lodge name, number of rooms, initial room list
- Owner receives the install link for the client app

### 5.2 Front Page / Room Dashboard
- Visual grid/card view of all rooms **for that lodge only**
- At-a-glance status: Booked vs. Available (color-coded)
- Click any room → view booking details (if occupied) or start a booking (if free)

### 5.3 Calendar
- Calendar view tied to bookings, scoped to the logged-in lodge

### 5.4 Room Booking Flow
Customer details captured at booking time:
- Name, Phone number, Address, Room number, Advance amount paid, Total amount

### 5.5 Click-to-View Behavior
- Clicking a room shows current booking (if occupied) or a booking form (if free)

### 5.6 Billing
- Generate a bill per booking using advance + total amount
- Balance due = total − advance

## 6. Storage Model
- **Single shared cloud backend** (Supabase project) hosting all lodges' data
- Every table scoped by `lodge_id`; RLS ensures a lodge can only ever see its own data
- No lodge owner manages their own database or storage account — it's all handled centrally under their registration account

## 7. Users & Roles (per lodge)
- **Admin** — full access within their own lodge only
- **Reception staff** — operational access within their own lodge only
- Cross-lodge access is never permitted for either role in v1

## 8. Out of Scope (v1)
- Client-facing self-service booking portal (deferred)
- Cross-lodge/platform-level super-admin dashboard (not required yet, but don't design against it)
- Multi-property support *within* a single lodge account (one lodge = one property, for now)
- Online payment gateway integration (unless confirmed — see open questions)

## 9. Success Criteria
- A new lodge owner can register, get the app, and be booking rooms same-day
- Reception can book a room and generate a bill in under 2 minutes
- Zero cross-tenant data leakage — this is the single most important success criterion for a multi-tenant product
- Zero data loss on booking/billing entries

## 10. Open Questions for Client / Product Decisions
1. Does billing need itemized line items or just advance + total?
2. Is digital advance-payment collection (Razorpay) needed, or always recorded manually?
3. Is there a subscription/pricing model for lodges using the platform, or is it free/flat-fee? (Affects whether a billing-for-the-SaaS-itself layer is needed, separate from the lodge's own guest billing.)
4. What does the installable client actually need to be — desktop app (Tauri), or is a simple installable web app (PWA) sufficient? (Current recommendation: lightweight desktop wrapper via Tauri, distributed through GitHub Releases — revisit if this feels like overkill.)
5. Will lodges ever need more than one property under one account?