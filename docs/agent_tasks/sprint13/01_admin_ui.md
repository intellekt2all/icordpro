# Sprint 13 Agent Task — Admin UI

## Context

The staging app has a Node-served web shell. Sprint 12 added the tenant and user management API. Build the smallest useful admin interface on top of it.

## Required changes

1. Add Admin section to `apps/web/src/server.js`.
2. Add tenant load and update controls.
3. Add user list rendering.
4. Add user creation controls.
5. Add user role update controls.
6. Add user removal controls.
7. Surface API permission errors through toast messages.
8. Update web route smoke test.
9. Keep Render Free compatibility.

## Do not

- Do not rewrite the front end.
- Do not add billing.
- Do not add email invitations.
- Do not add password reset.
- Do not add SSO.
- Do not add mobile apps.

## Acceptance criteria

- Web route smoke test passes.
- Admin section is visible.
- Tenant controls are visible.
- User controls are visible.
- UI calls Sprint 12 API endpoints.
