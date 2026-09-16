# Changelog

All notable changes to LodgeOS are documented in this file.

## [1.0.0] - 2026-09-17

### Security & Hardening (Solutions 1–12)
- Replaced exposed service role client keys on client-side routes with scoped server client.
- Implemented cryptographic signature verification for Stripe and Razorpay webhooks.
- Added sliding-window rate limiting on login and lodge registration endpoints.
- Hardened database RLS functions to throw exceptions on NULL `auth.uid()` to prevent RLS bypasses.
- Enforced HTTPS redirect and strict CSRF origin validation.
- Sanitized user text inputs using DOMPurify.

### Core Architectural Fixes (Solutions 13–35)
- Implemented PostgreSQL `btree_gist` exclusion constraints to prevent overlapping reservations.
- Unified reservation rollback on downstream billing/payment failure.
- Fixed multi-tenant subdomain resolution and cross-tenant access guards.
- Added composite database indexes for queries filtering by `lodge_id`, `status`, and date ranges.
- Configured Content Security Policy and security headers in `next.config.ts`.

### Reliability & UI Enhancements (Solutions 36–66)
- Centralized i18n currency and safe timezone date parsing (`src/lib/format.ts`).
- Added accessibility attributes (`role="img"`, `role="status"`, `aria-label`) on avatar and badge components.
- Added Next.js loading skeletons for Reception and Admin views.
- Enforced room and reservation status CHECK constraints at DB level.
