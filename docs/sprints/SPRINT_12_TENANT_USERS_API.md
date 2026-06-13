# Sprint 12 — Tenant and user management API

## Decision

Admin UI must not be built before the API contract exists. This sprint adds the minimum tenant and user management endpoints needed for a future admin screen.

## Scope

- `GET /tenant`
- `PATCH /tenant`
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`
- Tenant-scoped user access.
- Role guard for user creation, update and deletion.
- Audit logs for tenant and user management.
- Smoke-test coverage.

## Role rules

- OWNER can create, update and delete ADMIN, MANAGER and EMPLOYEE users.
- ADMIN can create, update and delete MANAGER and EMPLOYEE users.
- MANAGER can create EMPLOYEE users only.
- EMPLOYEE cannot manage users.
- Self-delete is blocked.
- OWNER role cannot be created or assigned through these endpoints.

## Not in scope

- Billing.
- Email invitations.
- Password reset.
- SSO.
- Production identity provider.
- Full admin UI.

## Acceptance criteria

- API endpoints require a valid bearer token.
- Responses are tenant-scoped.
- Role guard blocks privilege escalation.
- Smoke test covers tenant update, user creation, user update, user deletion and forbidden employee access.
