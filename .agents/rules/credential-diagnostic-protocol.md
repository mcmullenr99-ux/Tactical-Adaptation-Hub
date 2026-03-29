# Credential Diagnostic Protocol — Permanent Rules

**Created:** 2026-03-29
**Applies to:** All API token, secret, and authentication failure investigation

---

## Entities

- `TokenRegistry` — current status of every API token/secret
- `TokenFailureLog` — every credential-related failure logged permanently
- `TokenValidationRun` — validation evidence for every token check
- `CredentialMisdiagnosisLog` — false diagnoses logged and locked out
- `CredentialPattern` — recurring auth failure modes and prevention rules

---

## Core Rules — Never Break These

- Raw API tokens are NEVER stored in agent memory, frontend code, or normal logs. Only masked fingerprints.
- NEVER claim a token is invalid, expired, revoked, or missing without running validation first.
- A generic 401, 403, timeout, or provider error is NOT enough to call a token invalid.
- Token invalidity must be proven by validation evidence.
- If a token was previously validated successfully, do not mark invalid without fresh evidence.
- Every credential failure must be logged to TokenFailureLog.
- Every false credential diagnosis must be logged to CredentialMisdiagnosisLog.

---

## Before Diagnosing Any Auth Failure

1. Load TokenRegistry status for that provider
2. Load recent TokenFailureLog entries
3. Load CredentialMisdiagnosisLog for prior false blames on this provider
4. Run validation before making any claim
5. Classify precisely — do not flatten everything into "bad token"

---

## Classification — Always Classify, Never Guess

missing_secret | wrong_secret_name | empty_secret | malformed_token | wrong_header_format | wrong_base_url | wrong_environment | insufficient_scope | revoked_token | expired_token | provider_auth_failure | provider_outage | rate_limited | account_mismatch | unknown

---

## Known Misdiagnoses

### CMD-001 — Cloudflare API token blamed for GitHub webhook failure
- **Incorrect claim:** Token is expired/invalid therefore GitHub pushes are not triggering Cloudflare builds
- **True cause:** These are two completely separate systems. The API token is only needed for direct API calls (wrangler, REST API, cache purge). It has zero bearing on whether GitHub pushes trigger Cloudflare builds.
- **Prevention:** For build trigger failures, always investigate Cloudflare Pages Git Integration settings and GitHub webhook delivery logs first. Never touch the token.
