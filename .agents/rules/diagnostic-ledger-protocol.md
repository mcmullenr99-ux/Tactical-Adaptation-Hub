# Diagnostic Ledger Protocol — Permanent Rules

**Created:** 2026-03-29
**Applies to:** All bug, deployment, and build incident investigation

---

## Entities

- `DiagnosticIncident` — open/investigating/blocked/resolved incidents
- `DiagnosticHypothesis` — hypotheses with confidence scores and lifecycle status
- `DiagnosticAttemptLog` — every fix/diagnostic attempt logged permanently
- `DiagnosticDeploymentVerification` — deployment verification records
- `DiagnosticRuledOutCause` — eliminated causes with evidence
- `DiagnosticRecurringPattern` — recurring failure modes and prevention rules

---

## BEFORE Every Fix Attempt

1. Read DiagnosticIncident — find matching open incident
2. Read DiagnosticAttemptLog — review every prior attempt on that incident
3. Read DiagnosticRuledOutCause — BANNED from being suggested again without new hard evidence
4. Read DiagnosticHypothesis — check active vs ruled out
5. Only THEN propose something NEW that has not been tried

## AFTER Every Attempt (pass OR fail)

1. Write to DiagnosticAttemptLog immediately
2. Update DiagnosticHypothesis if evidence changed
3. Write to DiagnosticRuledOutCause if cause eliminated
4. Update DiagnosticIncident current_working_summary

---

## Anti-Repeat Rules — ABSOLUTE

- Hypothesis failed twice with no new evidence = ruled_out. Never suggest again.
- Browser cache is ruled out once pages.dev confirms stale bundle.
- Cloudflare API token does NOT explain GitHub push trigger failures. Different system. See CMD-001.
- _redirects changes do not fix deployment pipeline failures.
- Never suggest code fixes if local build and GitHub branch are confirmed correct.
- Never repeat a prior failed solution. Check the ledger first, every time, no exceptions.

---

## Credit Efficiency Rule — HARD

- Repeating a failed fix path without new evidence = diagnostic failure.
- Every new attempt must introduce a genuinely new branch of investigation.
- If stuck, ask Ryan for ONE specific piece of information. Do not guess or retry.

---

## Deployment Investigation Order (never skip, never reorder)

1. Is code changed locally?
2. Is it committed and pushed?
3. Did Cloudflare actually trigger a build?
4. Did the build succeed?
5. Is correct branch mapped to production?
6. Is the live bundle hash different from local build?
7. Is origin serving new code?
8. Is it a completely different subsystem?

---

## Known Incidents

- **INC-011** — Cloudflare not rebuilding from production branch (INVESTIGATING)
- **INC-012** — TypeScript unescaped apostrophe crashes Cloudflare build (RESOLVED ✅)
