# Sprint 7 Task — Security code patch

## Context

Branch: `feature/sprint7-security-hardening`
Issue: #18

Schema and migrations for User passwordHash, Session and AuditLog are already added.

## Required code changes

1. Update `apps/api/src/server.mjs`.
2. Remove in-memory `activeSessions`.
3. Use `Session` table for session validation.
4. Generate random session token on login.
5. Store only token hash in `Session.tokenHash`.
6. Add password hashing with Node crypto.
7. Store password hash in `User.passwordHash`.
8. Validate login password.
9. Use session user and tenant context for `/me`, tasks and attendance.
10. Add role guard: only OWNER or ADMIN can delete tasks.
11. Write `AuditLog` rows for auth and business actions.
12. Add simple auth rate limit.

## Required smoke-test changes

1. Register with email and password.
2. Verify wrong password returns 401.
3. Login and extract returned session token.
4. Use returned session token for protected endpoints.
5. Verify task delete RBAC behavior.
6. Verify `/audit-log` returns login/task audit events.

## Acceptance criteria

- `pnpm db:generate` passes.
- `pnpm db:migrate` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
- `pnpm smoke:test` passes.
- No hardcoded demo session token remains in API logic.
- No raw token value is stored in database.

## Scope lock

Do not add deploy, billing, Face ID, Gantt, AI, SSO or production onboarding.