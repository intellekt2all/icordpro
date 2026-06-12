# Sprint 7 — Security Hardening Plan

## Goal

Harden IcordPro before any staging deployment.

## Implemented in this branch

- User passwordHash schema field.
- Session table schema.
- AuditLog table schema.
- SQL migration for session, audit log and user credential field.

## Required implementation before merge

1. Replace demo-only session handling with database-backed Session records.
2. Store only hashed session token values in database.
3. Require login password validation.
4. Resolve `/me` from the session record, not from a demo fixture.
5. Use session tenantId for every business query.
6. Allow task delete only for OWNER or ADMIN.
7. Add validation for auth, task and comment payloads.
8. Add auth endpoint rate limit.
9. Add audit log writes for register, login, logout, task create, task update, task delete and time events.
10. Extend smoke-test to validate security behavior.

## Stop conditions

Stop and do not deploy if:

- Any endpoint uses a hardcoded demo session token.
- Any business query accepts tenantId directly from request header without session verification.
- Task delete is available to all roles.
- Session tokens are stored raw in database.
- Login accepts empty or weak credentials.
- Audit log is not created for security-sensitive actions.

## Required smoke-test assertions

- `/me` without session returns 401.
- Login with wrong password returns 401.
- Register then login returns a session token.
- `/me` with session returns the registered user.
- Task list without session returns 401.
- Task create with session succeeds.
- Task delete by non-admin role returns 403.
- Audit log contains login and task events.

## Explicit exclusions

- No billing.
- No Face ID.
- No Gantt.
- No AI assistant.
- No SSO.
- No production onboarding.
- No live deployment.
