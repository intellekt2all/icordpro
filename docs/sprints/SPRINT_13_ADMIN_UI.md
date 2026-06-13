# Sprint 13 — Admin UI

## Decision

Sprint 12 delivered the tenant and user management API. Sprint 13 connects those endpoints to the staging web shell.

## Scope

- Add Admin section to the staging web shell.
- Load tenant data through `GET /tenant`.
- Update tenant name through `PATCH /tenant`.
- Load users through `GET /users`.
- Create users through `POST /users`.
- Update user role through `PATCH /users/:id`.
- Remove users through `DELETE /users/:id`.
- Show permission and validation errors in the UI.
- Update web route smoke test.

## Not in scope

- Billing.
- Subscription enforcement.
- Email invitations.
- Password reset.
- SSO.
- React or Next.js rewrite.
- Native apps.

## Acceptance criteria

- Admin section renders in staging shell.
- Owner can load and update tenant name.
- Owner can list users.
- Owner can create users.
- Owner can update user roles.
- Owner can delete non-self users.
- API errors do not break the UI.
