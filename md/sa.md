# Security & Access Documentation — Multi-Tenant

## 0. The One Rule That Matters Most
**No lodge may ever read, write, or infer the existence of another lodge's data.** This is a higher-priority rule than any role-based rule below — a bug that leaks Lodge A's guest data to Lodge B is the single worst possible outcome for this product. Every RLS policy below must filter by `lodge_id` **first**, then by role.

## 1. Authentication
- Supabase Auth (email/password)
- Every user has a `profiles` row with `lodge_id` (their tenant) and `role` (`admin`/`reception`)
- `lodge_id` is set once — at registration (for the owner/admin) or at staff-invite time (for reception) — and must never be user-editable from the client.

## 2. Authorization Model — Row Level Security (RLS)

**Every policy pattern below implicitly starts with:**
`lodge_id = (select lodge_id from profiles where id = auth.uid())`
...and only then applies role checks.

### `lodges`
- SELECT: only the row matching the user's own `lodge_id`
- INSERT: allowed during registration flow only (via a controlled server-side function, not open client insert)
- UPDATE: admin of that lodge only
- DELETE: not exposed to clients at all (handled by vendor/support if ever needed)

### `rooms`
- SELECT: any authenticated staff **of that lodge**
- INSERT/UPDATE/DELETE: admin of that lodge only

### `bookings`
- SELECT/INSERT/UPDATE: any authenticated staff of that lodge
- DELETE: admin of that lodge only (prefer `status = cancelled` over hard delete)

### `billing`
- SELECT/INSERT/UPDATE: any authenticated staff of that lodge
- Aggregation/reporting queries: admin of that lodge only, via an admin-scoped view/RPC — never a raw cross-row aggregate that could accidentally span lodges

### `profiles`
- SELECT: own profile; admin can see all profiles **within their own lodge_id** only (never platform-wide)
- INSERT: only via a controlled invite flow (admin invites reception staff into their own lodge)
- UPDATE/DELETE: admin of that lodge only, scoped to their own lodge's profiles

### Storage Buckets (`room-photos`, etc.)
- Path convention `lodges/{lodge_id}/...` — RLS policy checks the path's `lodge_id` segment against the user's own `lodge_id`
- INSERT/UPDATE/DELETE: authenticated staff of that lodge only

## 3. Known Pitfall (carried over from prior work)
- Missing RLS policies on a storage bucket silently blocks image loads without an obvious error. In a multi-tenant setup, a *missing* policy is safer (nothing loads) than an *overly broad* one (everything loads across lodges) — always err toward stricter-by-default and test explicitly, rather than loosening a policy just to "get it working."

## 4. Registration Flow Security
- Lodge/tenant creation on signup should go through a controlled server-side function (e.g., a Postgres function or API route with the service role), not a raw client-side insert — this prevents a malicious signup from creating an orphaned or manipulated `lodge_id` relationship.

## 5. Session & Device Considerations
- Reception terminal sessions: reasonable auto-logout given shared physical desk access.
- Sessions should never allow switching `lodge_id` context client-side — that value is derived server-side from the authenticated user's profile, never passed as a trusted client parameter.

## 6. Data Sensitivity
- Guest name, phone, address = personal data, doubly sensitive in a multi-tenant system since a leak would affect an unrelated lodge's guests. Never expose via any unauthenticated route.

## 7. Audit Trail
- `created_by`, `updated_at` on bookings — sufficient for v1. Consider `activity_log` (still `lodge_id`-scoped) in a later phase.

## 8. Payments (Conditional)
- If Razorpay is integrated for guest billing: verify payment server-side via webhook, and ensure the webhook handler correctly attributes the payment to the right `lodge_id`/`booking_id` — never infer tenant from client-supplied data alone.

## 9. Testing Requirement
- Every new table or policy must be tested with **at least two seeded lodges** to confirm isolation before being considered done. This should be a standing item in QA passes (`gstack /qa`), not a one-time check.