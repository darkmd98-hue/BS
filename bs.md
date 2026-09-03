# Backend Schema Document (Supabase / Postgres) — Multi-Tenant

> Every table (except `lodges` itself) carries a `lodge_id` foreign key. This is the tenant boundary — treat it as sacred.

## 1. Tables

### `lodges` (New — the tenant table)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | this is the tenant identifier used everywhere else as `lodge_id` |
| name | text | |
| address | text | nullable |
| owner_user_id | uuid (FK → auth.users) | the registering owner |
| created_at | timestamptz | default now() |

### `rooms`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | **tenant scope — required, indexed** |
| room_number | text | unique **within a lodge**, not globally |
| floor | int | nullable |
| status | text | enum: `available`, `booked`, `maintenance` |
| storage_folder | text | nullable — room photo bucket path, scoped under the lodge's folder |
| created_at | timestamptz | default now() |

### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | **tenant scope — required, indexed** |
| room_id | uuid (FK → rooms.id) | must belong to the same lodge_id — enforce via app logic + a check/trigger if possible |
| guest_name | text | |
| guest_phone | text | |
| guest_address | text | |
| check_in | timestamptz | |
| check_out | timestamptz | nullable until checkout |
| status | text | enum: `active`, `checked_out`, `cancelled` |
| created_by | uuid (FK → auth.users) | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `billing`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | **tenant scope — required, indexed** |
| booking_id | uuid (FK → bookings.id) | |
| total_amount | numeric | |
| advance_amount | numeric | |
| balance_due | numeric | computed = total − advance |
| payment_status | text | enum: `pending`, `partial`, `settled` |
| settled_at | timestamptz | nullable |
| created_at | timestamptz | default now() |

### `profiles` (extends Supabase `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | |
| lodge_id | uuid (FK → lodges.id) | **the tenant this user belongs to — set once at registration/invite, not user-editable** |
| full_name | text | |
| role | text | enum: `admin`, `reception` |
| created_at | timestamptz | |

### `room_photos`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | **tenant scope — required, indexed** |
| room_id | uuid (FK → rooms.id) | |
| storage_path | text | Supabase Storage path, prefixed by lodge id, e.g. `lodges/{lodge_id}/rooms/{room_id}/...` |
| is_primary | boolean | |

## 2. Relationships
- `lodges` 1—many `rooms`, `bookings`, `billing`, `profiles`, `room_photos`
- `rooms` 1—many `bookings` (within the same lodge)
- `bookings` 1—1 `billing`
- `profiles` 1—many `bookings` (via `created_by`)

## 3. Storage Buckets — Path Convention
- `room-photos` bucket, paths namespaced as `lodges/{lodge_id}/rooms/{room_id}/{filename}` — this makes RLS-by-path straightforward and avoids collisions between lodges.

## 4. Realtime
- Enable Realtime on `rooms` and `bookings`, but **filter subscriptions by `lodge_id`** client-side/server-side — never subscribe to the whole table unfiltered.

## 5. Indexes (Critical for Multi-Tenant Performance)
- `rooms(lodge_id, status)`
- `bookings(lodge_id, room_id, status)`
- `bookings(lodge_id, check_in, check_out)`
- `billing(lodge_id, payment_status)`
- Every index should lead with `lodge_id` since virtually every query filters by it first.

## 6. Open Schema Questions
- Does billing need a `line_items` child table? (deferred, PRD open question)
- Should `lodges` eventually support multiple properties per owner account? If yes later, insert a `properties` table between `lodges` (billing/account entity) and `rooms` — not needed for v1.

# Backend Schema Document (Supabase / Postgres) — Multi-Tenant, Figma-Aligned

> Revised to match the Figma design's data model (Room, Customer, Reservation, Bill with itemized payments) instead of the earlier simplified version. Every table still carries `lodge_id` — that boundary is unchanged and already verified (T-005).

## 1. Tables

### `lodges` (tenant table)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| address | text | nullable |
| subdomain | text | **New** — unique slug for subdomain-based routing (e.g. `hillview` → `hillview.lodgepro.com`). Required for the subdomain-routing middleware work. |
| owner_user_id | uuid (FK → auth.users) | |
| created_at | timestamptz | default now() |

### `rooms` (expanded to match Figma's `Room` interface)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope, indexed |
| room_number | text | unique within a lodge |
| floor | int | |
| room_type | text | enum: `AC`, `Non-AC` |
| bed_type | text | enum: `Single`, `Double`, `Triple` |
| capacity | int | |
| rent | numeric | base nightly rate |
| extra_person_charge | numeric | |
| extra_bed_charge | numeric | |
| status | text | enum: `available`, `occupied`, `reserved`, `cleaning`, `maintenance` (expanded from the original 3-state model to match Figma) |
| amenities | text[] | e.g. `{Wi-Fi, TV, "Attached Bathroom", "Hot Water", AC}` |
| cleaning_staff | text | nullable — set when status = cleaning |
| maintenance_issue | text | nullable — set when status = maintenance |
| maintenance_priority | text | nullable — enum: `Low`, `Medium`, `High` |
| created_at | timestamptz | default now() |

### `customers` (New — separate from bookings, matches Figma's `Customer` interface)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope, indexed |
| name | text | |
| mobile | text | |
| email | text | nullable |
| address | text | nullable |
| id_type | text | enum: `Aadhaar`, `Passport`, `Driving License`, `Voter ID` |
| id_number | text | store masked/partial per privacy norms if displayed in UI |
| visits | int | derived/maintained count of past stays |
| total_spent | numeric | running total, likely maintained via trigger or computed view |
| outstanding | numeric | running balance across all bookings, likely computed |
| last_stay | date | nullable |
| created_at | timestamptz | default now() |

### `reservations` (renamed from `bookings` to match Figma's terminology and richer fields)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope, indexed |
| customer_id | uuid (FK → customers.id) | replaces the old flat guest_name/phone/address fields |
| room_id | uuid (FK → rooms.id) | must belong to the same lodge_id |
| check_in | date | |
| check_out | date | |
| guests | int | |
| advance | numeric | |
| status | text | enum: `upcoming`, `today`, `checked-in`, `completed`, `cancelled` (matches Figma exactly — richer than the old `active/checked_out/cancelled`) |
| special_request | text | nullable |
| created_by | uuid (FK → auth.users) | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `bills` (renamed from `billing`, now supports itemized payments)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope, indexed |
| reservation_id | uuid (FK → reservations.id) | |
| net_amount | numeric | |
| received | numeric | sum of all payments — likely maintained via trigger or computed from `payments` |
| balance | numeric | computed = net_amount − received |
| payment_status | text | enum: `paid`, `partial`, `unpaid` |
| created_at | timestamptz | default now() |

### `payments` (New — child table, matches Figma's `Bill.payments[]`)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope, indexed |
| bill_id | uuid (FK → bills.id) | |
| amount | numeric | |
| method | text | e.g. `Cash`, `UPI`, `Card`, `Bank Transfer` |
| paid_at | timestamptz | |

### `profiles` (unchanged)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope |
| full_name | text | |
| role | text | enum: `admin`, `reception` |
| created_at | timestamptz | |

### `room_photos` (unchanged)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| lodge_id | uuid (FK → lodges.id) | tenant scope |
| room_id | uuid (FK → rooms.id) | |
| storage_path | text | `lodges/{lodge_id}/rooms/{room_id}/...` |
| is_primary | boolean | |

## 2. Deferred Tables (later phases — Housekeeping/Maintenance/Reports/Settings/Users/Backup screens)
- `housekeeping_tasks` — tied to `rooms`, `cleaning_staff` reference
- `maintenance_tickets` — tied to `rooms`, priority/status tracking (note: `rooms.maintenance_issue`/`maintenance_priority` above may migrate into a proper ticket table once this phase is built, rather than flat columns)
- Reports/analytics: likely computed views over `reservations`/`bills`/`payments` rather than new tables (matches Figma's `REVENUE_DATA`/`MONTHLY_DATA` aggregate charts)
- Settings/Users&Roles: mostly UI over existing `profiles`/`lodges`, may need a `lodge_settings` table later
- Backup: platform-level concern, likely out of app-schema scope entirely

## 3. Relationships
- `lodges` 1—many everything else
- `rooms` 1—many `reservations`
- `customers` 1—many `reservations`
- `reservations` 1—1 `bills`
- `bills` 1—many `payments`

## 4. Indexes (Critical for Multi-Tenant Performance)
- `rooms(lodge_id, status)`
- `reservations(lodge_id, room_id, status)`
- `reservations(lodge_id, check_in, check_out)`
- `bills(lodge_id, payment_status)`
- `customers(lodge_id, mobile)` — for guest lookup by phone
- `lodges(subdomain)` — unique index, critical path for the subdomain-resolution middleware

## 5. Open Schema Questions
- Should `customers.visits`/`total_spent`/`outstanding` be maintained via Postgres triggers (always consistent, more complex) or computed on read via views (simpler, slightly slower)? Recommend triggers given these values feed dashboards frequently.
- `rooms.maintenance_issue`/`cleaning_staff` as flat columns are a v1 shortcut matching Figma's mock data shape — revisit once the Housekeeping/Maintenance phase is actually built, since a proper ticket-history table will likely be needed instead of overwriting a single column.