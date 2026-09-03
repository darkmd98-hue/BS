# Implementation Plan

## 1. Workflow Overview

```
Stitch AI (static HTML mockups, incl. registration/onboarding screens)
        │
        ▼
Antigravity: convert HTML → Next.js/Tailwind components  ← Phase 0, mandatory first step
        │
        ▼
Antigravity: build lodges/profiles + registration flow    ← Phase 1
        │
        ▼
Antigravity: wire up full data layer (schema, RLS, storage) ← Phase 2
        │
        ▼
Antigravity: build features phase-by-phase                ← Phases 3–7
        │
        ▼
Antigravity: package as Tauri app, publish to GitHub Releases ← Phase 8
        │
        ▼
Antigravity: polish + QA (ui-ux-pro-max, gstack /qa /review, tenant-isolation tests) ← Phase 9
        │
        ▼
Real lodge onboarding
```

## 2. Step-by-Step Execution Order

1. **Paste all 12 docs into Antigravity's project context.** `memory.md` and `rules.md` should be read first, every session.
2. **Generate static screens in Stitch AI** for: Registration/Signup, Install-Link screen, Room Dashboard, Booking Panel (free + occupied), Calendar, Billing Summary, Admin Dashboard, Login. Export as HTML.
3. **Kick off Phase 0 in Antigravity:**
   - Prompt: *"Read rules.md, phases.md, and frontend-specification.md. Convert the attached Stitch HTML exports into componentized Next.js + Tailwind pages per the conversion rules. Do not build any features yet — this is Phase 0 only. Update memory.md when done."*
4. **Phase 1 — Registration & tenant foundation:** implement `lodges`/`profiles`, the registration server function, and the install-link screen.
5. **Phase 2 — Data layer:** implement `backend-schema.md` as real Supabase migrations + RLS from `security-access.md`. Seed two test lodges immediately — use them for every subsequent isolation check.
6. **Phases 3–7:** work through `features-ticket-list.md` ticket by ticket. Use `/review` and `/qa` (gstack) regularly, not just at the end. For every ticket touching data access, explicitly verify against both seeded test lodges.
7. **Phase 8 — Packaging:** set up Tauri, produce a working installer, publish it as a GitHub Release, wire the registration flow's install-link screen to point at it.
8. **Phase 9:** full design polish pass (`ui-ux-pro-max`) and full QA pass, including a dedicated tenant-isolation test suite, before considering v1 done.
9. **After every session:** confirm `memory.md` was actually updated — spot-check it yourself rather than trusting it blindly.

## 3. Which Installed Skills Map to Which Phase

| Phase | Relevant Skill(s) |
|---|---|
| Phase 0 (conversion) | `stitch-design::code-to-design`, `stitch-utilities::design-md` |
| Phase 0–2 (scaffolding) | `stitch-build` sub-skills as reference patterns; core Next.js/Supabase/tenant work is manual |
| All phases (code discipline) | `ponytail`, `ponytail-review`, `ponytail-audit` |
| Phase 9 (design polish) | `ui-ux-pro-max`, `huashu-design` |
| Phase 9 (QA/review) | gstack `/review`, `/qa`, `/qa-only` — extend QA checklist to explicitly include tenant-isolation smoke tests |
| Ongoing (release readiness) | gstack `/ship` when a phase is genuinely deployable |
| Ongoing (planning hygiene) | gstack `/office-hours` |

## 4. Session Discipline
- Start every Antigravity session by having it read `memory.md` first.
- End every session by confirming `memory.md` was updated.
- If Antigravity seems to be re-doing work or contradicting a prior decision, check the Decisions Log in `memory.md` before assuming it's wrong.

## 5. Risk Notes
- **Silent partial success** is the biggest observed risk in this project's tooling so far (plugins/skills reporting "processed"/"[ok]" without content actually landing correctly — seen repeatedly during the Antigravity CLI setup). Apply the same skepticism to Antigravity's progress claims: verify phase exit criteria manually.
- **Tenant isolation is the single highest-severity risk category** in a multi-tenant product — a leak between lodges is far worse than any UI bug or missing feature. Every phase's QA pass must explicitly re-verify isolation, not just new-feature correctness.
- RLS misconfiguration is a known recurring failure mode from prior work (room photo bug) — treat every new table/bucket as guilty until RLS is verified, doubly so now that RLS is also the tenant boundary, not just the role boundary.