# Memory.md

> **This file must be updated after every file created/modified and every ticket completed.**
> Purpose: single source of truth for "what's done, what's in progress, what's next" — since AI sessions don't retain context between restarts. Read this file first, before reading anything else, at the start of every session.

---

## How to Update This File
1. After finishing any unit of work (a file, a ticket, a decision), add an entry under the relevant phase below.
2. Move completed tickets from "In Progress" to "Completed."
3. Log any assumptions made in place of an unanswered PRD open question, with a note to revisit.
4. Never delete history — append. This file is a log, not just a snapshot.

---

## Product Model (Resolved — foundational decision, not open anymore)
- This is a **multi-tenant SaaS**, not a single-lodge tool. One shared Supabase backend serves all lodges, isolated by `lodge_id` + RLS.
- Distribution: lodge owners register an account (creating their tenant), then download an installable client app (Tauri-wrapped, published via GitHub Releases) that connects back to the shared backend.
- Their "cloud storage" = their data scoped under their registered account in the shared backend, not a separate cloud account they bring themselves.

## Current Phase
`Phase 0 — Foundation & Conversion` *(update this line as phases progress)*

## Completed
- [ ] (nothing yet — update as work is done)

## In Progress
- [ ] (nothing yet — update as work starts)

## Assumptions Made (pending confirmation)
- Billing assumed advance + total only, no itemized line items
- Advance payment collection assumed offline/manual, not digitally integrated via Razorpay
- No separate SaaS subscription/billing layer for lodges using the platform itself (assumed free/flat, unconfirmed)
- Installable client assumed to be a Tauri desktop wrapper distributed via GitHub Releases, rather than a PWA — revisit if this feels like overkill for the team's capacity
- One lodge = one property for v1 (no multi-property-per-account support yet)

## Open Questions Still Unanswered
1. Itemized billing vs. advance/total only?
2. Digital payment integration needed for guest billing?
3. Is there a pricing/subscription model for lodges using this platform?
4. Confirm Tauri vs. simpler PWA-install approach for distribution
5. Will any lodge ever need multiple properties under one account?

## Decisions Log
- `[Foundational]` Confirmed multi-tenant architecture: one shared Supabase backend, `lodge_id` scoping everywhere, RLS as the tenant boundary — replaces the earlier single-client assumption.
- `[Foundational]` Chose Tauri (lightweight desktop wrapper) over Electron or a fully self-hosted-per-lodge model, to keep support burden low while still giving owners a real installable app via GitHub.
- *(Add further entries here as work proceeds)*

## Next Steps
- Begin Phase 0: scaffold project, connect Supabase, set up `lodges`/`profiles`, convert Stitch HTML output into components.