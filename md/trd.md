# Technical Requirements Document (TRD)

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | Next.js (App Router) | Shared codebase serving all lodges |
| Client packaging | Tauri (lightweight desktop wrapper) | Distributed via **GitHub Releases** — owners download and install this; it's a thin shell around the web app, not a separate backend |
| Styling | Tailwind CSS | Pairs with ui-ux-pro-max / stitch skill outputs |
| Backend / DB | Supabase (Postgres) | **One shared project** serving all lodges — multi-tenant via `lodge_id` scoping + RLS |
| File storage | Supabase Storage | Scoped per-lodge folder/bucket path, RLS-enforced |
| Auth | Supabase Auth | Every user (owner or staff) belongs to exactly one lodge via `profiles.lodge_id` |
| Email | Resend | Registration confirmation, booking confirmations, receipts |
| Payments | Razorpay | Conditional — see PRD open questions (guest billing) and possibly a separate SaaS subscription billing concern (out of scope unless confirmed) |
| Hosting | Vercel (assumed) + Supabase cloud | Single deployment serving all tenants |

## 2. Architecture Overview — Multi-Tenant

- **Single Next.js application, single Supabase project.** Every lodge is a row in a `lodges` table; every other table (`rooms`, `bookings`, `billing`, `profiles`) carries a `lodge_id` foreign key.
- **Tenant isolation is enforced at the database level via RLS** — every policy checks `lodge_id = (select lodge_id from profiles where id = auth.uid())`. This is the actual security boundary; the app UI never being shown another lodge's data is not sufficient on its own.
- **Distribution model:** the vendor (you) runs one central backend. Lodge owners never provision their own database or storage — they register, and their account IS their tenant scope.
- **Client packaging:** the Next.js web app is wrapped with Tauri to produce an installable desktop app per OS, published as release artifacts on GitHub. Functionally, it's the same hosted web app — packaging is for a "real app, real install link" experience, not a technical requirement for the backend to work differently.

## 3. Data Flow (High Level)

```
Owner registers → creates `lodges` row + `profiles` row (role=admin, lodge_id=new lodge)
        │
        ▼
Owner downloads installer (GitHub Release) → installs Tauri-wrapped app
        │
        ▼
App login → Supabase Auth → session includes lodge_id (via profiles join)
        │
        ▼
All queries scoped to that lodge_id, RLS-enforced regardless of which lodge's staff is querying
```

## 4. Non-Functional Requirements
- **Tenant isolation (critical):** no query, API route, or realtime channel may ever leak data across `lodge_id` boundaries. This supersedes all other non-functional requirements in priority.
- **Performance:** Room dashboard should load in <1s per lodge, regardless of total platform size (i.e., queries must be indexed by `lodge_id`, not scanning all lodges).
- **Reliability:** Supabase (cloud) is the sole source of truth; no lodge-local persistent storage.
- **Scalability:** Schema and RLS should comfortably support dozens–hundreds of lodges on one Supabase project without redesign.
- **Auditability:** every booking/billing change timestamped and attributable to a user, within their lodge.

## 5. Environments
- **Local dev** — Antigravity IDE + local Supabase project (or a shared Supabase dev project) — seed with 2+ fake lodges to always test tenant isolation while developing
- **Staging** — Supabase project + Vercel preview
- **Production** — single Supabase production project + Vercel production, serving all real lodges

## 6. Frontend Generation Workflow (Stitch → Antigravity)
- Static frontend mockups generated first via Stitch AI (HTML output).
- Before any feature development, Antigravity converts the static Stitch HTML into componentized Next.js + Tailwind code, matching conventions in `frontend-specification.md`.
- This conversion is a mandatory first task (Phase 0) — see `phases.md` and `rules.md`.

## 7. Packaging & Distribution (New)
- Build pipeline produces Tauri installers (Windows first, given `agy`/local dev environment context; add macOS/Linux later if needed).
- Installers published as **GitHub Releases** on the project's repo.
- Registration flow gives each new lodge owner a direct link to the latest release/installer.
- Update strategy: decide whether Tauri auto-update is worth setting up early, or whether manual re-download is acceptable for v1 (recommend deferring auto-update until there are enough lodges to make manual updates painful).

## 8. Third-Party Integrations
- **Resend** — registration/booking emails
- **Razorpay** — guest billing payments (conditional) — note this is separate from any potential SaaS subscription billing for the lodge's use of the platform itself, which is out of scope unless confirmed
- **Supabase Storage** — per-lodge-scoped buckets/paths with RLS

## 9. Testing Approach
- Use gstack's `/qa` and `/review` skills during development.
- **Mandatory tenant-isolation test:** for every new table/feature, verify with two seeded test lodges that Lodge A can never read/write Lodge B's data, even with a forged/guessed ID.