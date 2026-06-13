# Sprint 12 Agent Task — Tenant and user management API

## Context

Staging is live and Sprint 11 improved the web shell. The next hard requirement is a real API contract for admin and tenant settings.

## Task

Add protected tenant and user management endpoints without changing the database schema.

## Required changes

1. Add `GET /tenant`.
2. Add `PATCH /tenant` for OWNER and ADMIN.
3. Add `GET /users` for OWNER, ADMIN and MANAGER.
4. Add `POST /users` with role guard.
5. Add `PATCH /users/:id` with role guard.
6. Add `DELETE /users/:id` with role guard and self-delete protection.
7. Write audit logs for tenant and user operations.
8. Update smoke tests.

## Role rules

- OWNER can manage ADMIN, MANAGER and EMPLOYEE.
- ADMIN can manage MANAGER and EMPLOYEE.
- MANAGER can create EMPLOYEE only.
- EMPLOYEE cannot manage users.
- No one can delete their own account.

## Do not

- Do not add billing.
- Do not add email invitations.
- Do not add password reset.
- Do not add SSO.
- Do not add native apps.
- Do not add full admin UI in this sprint.

## Acceptance criteria

- All endpoints are tenant-scoped.
- Role guard blocks privilege escalation.
- Smoke test passes.
