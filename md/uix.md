# UI/UX Design Document

## 1. Design Principles
- **Speed over decoration** — reception staff use this dozens of times a day; minimize clicks, avoid unnecessary friction (aligns with `ponytail` skill's minimal-solution philosophy — apply to UI, not just code).
- **Status at a glance** — room status must be readable from across the room.
- **Forgiving forms** — booking form fast to fill, validated but not fussy.
- **Tenant-invisible UI** — a lodge's staff should never see any UI element implying other lodges exist (no "switch lodge" dropdown, no stray platform-level nav) — this is a single-lodge experience from their point of view, even though the backend is multi-tenant.

## 2. Key Screens

### 2.0 Registration / Onboarding (New)
- Sign-up form (email, password, lodge name, address, room count)
- Confirmation screen with the install download link (GitHub Release)
- First-login setup: basic room list creation

### 2.1 Room Dashboard (Front Page)
- Grid layout, one card per room (that lodge's rooms only)
- Card shows: Room number, status color, guest name + checkout date if occupied

### 2.2 Room Detail / Booking Panel
- Modal/slide-over, not full navigation
- Free room → booking form; occupied room → read summary + actions (Edit / Bill / Check Out)

### 2.3 Calendar View
- Month view, day-cell indicators for check-ins/check-outs, scoped to the lodge

### 2.4 Billing View
- Total / Advance / Balance / Status, clear separation of "save" vs. "checkout" actions

### 2.5 Admin Dashboard
- Summary cards (occupancy %, today's revenue, pending balances) — this lodge only
- Staff management screen (invite/remove reception accounts for this lodge)

## 3. Visual Style
- Generated via Stitch AI for the static mockup layer, refined with `ui-ux-pro-max`/`huashu-design` once converted to components.
- Clean, hospitality-appropriate palette; avoid generic SaaS-dashboard look even though it's now a multi-tenant product under the hood — each lodge owner should feel like this is "their" software.

## 4. Responsiveness
- Reception: desktop-first, tablet-usable
- Admin: desktop-first
- Registration/onboarding: should work fine on desktop browser (pre-install, so no app wrapper yet)

## 5. Accessibility Basics
- Color-coded status must carry a text/icon indicator alongside color
- Sufficient contrast on status colors

## 6. Design Handoff Process
1. Generate static screens in Stitch AI (including the new registration/onboarding screens)
2. Export static HTML
3. Antigravity converts HTML → Next.js/Tailwind components
4. Apply design-system polish pass (`ui-ux-pro-max`)