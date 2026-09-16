# LodgeOS v1.1 & v2 — Complete Execution Roadmap

---

## v1.1 — Deferred Features (T-059 to T-063)

| Ticket | Feature | Status |
|--------|---------|--------|
| T-059  | Housekeeping Workflow (/admin/housekeeping) | ✅ DONE |
| T-060  | Maintenance Tracking (/admin/maintenance) | ✅ DONE |
| T-061  | Reports & Analytics (/admin/reports) | ✅ DONE |
| T-062  | Settings Panel (/admin/settings) | ✅ DONE |
| T-063  | Guest Portal (/guest/login & /guest/[reservationId]) | ✅ DONE |

---

### T-059: Housekeeping Workflow (/admin/housekeeping)

**What It Does:**
- Displays list of rooms needing cleaning (status: occupied → checkout → cleaning queue)
- Staff (cleaner role) marks rooms as cleaned
- Manager sees cleaning log with timestamps and cleaner names
- Room status auto-updates: cleaning → available

**Data Model:**
- Add to `rooms` table: `last_cleaned_at` (timestamp), `cleaning_staff_assigned` (text)
- New table: `cleaning_log` (id, room_id, lodge_id, cleaned_by_user_id, started_at, completed_at, notes)
- RLS: cleaner can only see/update rooms in their lodge; manager can see all; guests can't see this

**Features:**
- List of rooms flagged for cleaning (after checkout)
- "Start Cleaning" → timestamp + current user
- "Mark as Clean" → completion timestamp, room becomes available
- Cleaning history log (per room, filterable by staff member)
- Bulk actions: mark multiple rooms clean at once

**Verification:**
- Load as cleaner: see only rooms that need cleaning
- Start cleaning, confirm `started_at` timestamp recorded
- Mark clean, confirm room status changes to available in reception dashboard
- Load as Lodge B's cleaner: confirm zero cross-lodge rooms visible
- Direct-UUID boundary check: attempt to access Lodge B's cleaning log, confirm 404

---

### T-060: Maintenance Tracking (/admin/maintenance)

**Data Model:**
- New table: `maintenance_tickets` (id, lodge_id, room_id, reported_by_user_id, issue_type, description, priority, status, created_at, assigned_to_user_id, resolved_at, resolution_notes)
- issue_type enum: (ac_heating, plumbing, electrical, structural, furnishings, appliances, other)
- priority enum: (low, medium, high, urgent)
- status enum: (open, in_progress, resolved)

**Features:**
- "Report Issue" form
- Maintenance board (kanban-style: open → in_progress → resolved)
- Drag-and-drop status updates
- Assign to staff member
- Add resolution notes when resolving
- Search/filter by room, priority, status, date range

---

### T-061: Reports & Analytics (/admin/reports)

**Features:**
- Occupancy rate (% of rooms occupied this month/year)
- Revenue summary (total billed, received, outstanding by date range)
- Payment breakdown (cash vs. card vs. UPI vs. bank transfer)
- Guest insights (repeat guests, average stay length, cancellation rate)
- Exportable reports (PDF or CSV)

---

### T-062: Settings Panel (/admin/settings)

**Data Model:**
- Expand `lodges` table: logo_url, website, check_in_time, check_out_time, pet_friendly, cancellation_policy, extra_person_charge_default, contact_phone, contact_email
- New table: `lodge_settings_emails`

**Features:**
- General, Business Rules, Email Templates, Roles & Permissions tabs

---

### T-063: Guest Portal (/guest/login & /guest/[reservationId])

**Data Model:**
- New table: `guest_sessions`
- New table: `guest_messages`

**Features:**
- Passwordless login (email OTP)
- View bill, room details, stay dates
- Download invoice PDF
- Request early checkout
- Contact lodge

---

## v2 — Enterprise & Scaling Features (T-101 to T-107)

| Ticket | Feature | Status |
|--------|---------|--------|
| T-101  | Multi-Property Management | ✅ DONE |
| T-102  | Channel Manager (Airbnb, Booking.com) | ✅ DONE |
| T-103  | Advanced Reporting & BI | ✅ DONE |
| T-104  | Mobile App — Staff (iOS & Android) | ✅ DONE |
| T-105  | Advanced RBAC | ✅ DONE |
| T-106  | Payment Gateway (Stripe, Razorpay) | ✅ DONE |
| T-107  | Email & SMS Notifications (Twilio) | ⬜ Pending |

---

### T-101: Multi-Property Management

**Data Model:**
- `user_organizations` table (id, user_id, organization_name, role, created_at)
- Add `organization_id` to `lodges`

**Features:**
- Property switcher dropdown in sidebar
- Aggregated dashboard across all properties
- Staff assignments per property

---

### T-102: Channel Manager Integration

**Data Model:**
- `channel_integrations` table
- `channel_sync_log` table
- Add to `reservations`: channel_source, channel_reservation_id, synced_at

---

### T-103: Advanced Reporting & BI

**Data Model:**
- `lodge_expenses` table
- Materialized views: `revenue_by_month`, `occupancy_by_day`

---


### T-104: Advanced RBAC

**Data Model:**
- `roles` table
- `role_permissions` table
- `audit_log` table

---

### T-105: Payment Gateway Integration

**Data Model:**
- Extend `payments` table
- `payment_gateway_webhooks` table

---

### T-106: Email & SMS Notifications

**Data Model:**
- `notification_templates` table
- `notification_log` table

