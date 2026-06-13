# Sprint 14 — Staging QA and release gate

## Decision

After Sprint 13, the MVP has enough visible surface to require a repeatable staging QA gate. More features must not be added until the deployed staging build is testable with a repeatable script and checklist.

## Scope

- Add staging smoke-test script.
- Add release checklist.
- Document Render checks.
- Document Neon checks.
- Document rollback path.

## Not in scope

- New modules.
- Billing.
- AI assistant.
- Native apps.
- Production launch.

## Acceptance criteria

- `scripts/smoke-test-staging.sh` exists.
- Release checklist exists.
- Smoke test covers auth, tenant, users, tasks, attendance and audit.
- Rollback steps are documented.
