# App Flow Document

## 1. Registration & Onboarding Flow (New — happens once per lodge)

1. Prospective lodge owner visits the registration page (web, pre-install)
2. Signs up with email/password (Supabase Auth) → account created
3. Creates their `lodges` record: lodge name, address, number of rooms (basic setup form)
4. System creates their `profiles` row with `role = admin`, `lodge_id` = their new lodge
5. Owner is shown/emailed the **install link** (GitHub Release download for their OS)
6. Owner downloads and installs the Tauri-wrapped app
7. Owner logs in inside the installed app → lands on their lodge's Admin dashboard
8. Owner can then create reception staff accounts (invite flow — staff receive login credentials tied to the same `lodge_id`)

## 2. Reception Side — Primary Flow (within their lodge)

1. **Login** → reception staff authenticates; session resolves their `lodge_id`
2. **Room Dashboard** loads → grid of rooms *for their lodge only*, color-coded booked/available
3. **Click a free room:**
   - Booking form opens, pre-filled with room number
   - Staff enters: Name, Phone, Address, Advance Amount, Total Amount
   - Submit → creates `bookings` + `billing` rows (both tagged with the lodge's `lodge_id`), room status flips to booked
4. **Click an occupied room:**
   - Booking/customer detail view opens
   - Options: Edit booking, View/Update Billing, Check Out
5. **Check Out flow:**
   - Confirm final amount, settle balance, room flips back to available
6. **Calendar view:**
   - Shows bookings across time, scoped to their lodge

## 3. Admin Side — Primary Flow (within their lodge)

1. **Login** (admin role) → Admin dashboard for their lodge
2. **Overview:** occupancy %, today's check-ins/outs, revenue — scoped to their lodge only
3. **Full room dashboard** (their lodge), plus edit/override access
4. **Reports:** billing summaries, outstanding balances — their lodge only
5. **Staff management:** invite/remove reception accounts *for their own lodge* (never cross-lodge)
6. **Configuration:** room list, pricing defaults — their lodge only

## 4. Booking Lifecycle (State Diagram, described)

```
[Room: Available] (lodge X)
     │  (staff clicks room → fills booking form)
     ▼
[Room: Booked] (lodge X) ──(edit)──▶ [Room: Booked, updated]
     │
     │ (staff clicks Check Out)
     ▼
[Checkout: confirm balance] ──(settle)──▶ [Room: Available] (lodge X)
```
*(Every state transition is implicitly scoped to a single `lodge_id` — no cross-lodge state exists.)*

## 5. Client Side (Deferred)
- Not designed yet. When scoped, each lodge would have its own client-facing booking surface, still scoped to that lodge's `lodge_id`.

## 6. Cross-Cutting Flows
- **Realtime sync:** booking changes propagate live via Supabase Realtime, filtered to the current lodge's channel/subscription only — never broadcast platform-wide.
- **Storage flow:** uploaded documents/photos go to a per-lodge-scoped path in Supabase Storage, RLS-restricted to that lodge's staff.