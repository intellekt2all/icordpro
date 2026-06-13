# IcordPro staging release checklist

## Purpose

This checklist must be completed before a staging build is treated as beta-ready.

## Required URLs

- Web: `https://icordpro-web.onrender.com`
- API: `https://icordpro-api.onrender.com`
- API health: `https://icordpro-api.onrender.com/health`

## Render checks

- `icordpro-api` is Live.
- `icordpro-web` is Live.
- Both services use branch `main`.
- API env has `DATABASE_URL`.
- API env has `CORS_ORIGIN` equal to the web URL.
- Web env has `API_BASE_URL` equal to the API URL.
- Both services use `NODE_VERSION=20.18.1`.
- Free instance sleep behavior is accepted for staging.

## Neon checks

- Project: `iCord`.
- Database: `neondb`.
- Required tables exist: Tenant, User, Task, TaskComment, TimeEntry, Session, AuditLog.
- Staging data is not production data.
- No secret values are committed to GitHub.

## Functional checks

- Demo user can register and login.
- Session card loads.
- Task can be created.
- Task list loads.
- Attendance check-in works.
- Attendance check-out works.
- Admin tenant loads.
- Tenant name can be updated.
- Users list loads.
- User can be created.
- User role can be updated.
- User can be removed.
- Audit log loads.

## Command check

Run from a local terminal with Node and curl installed:

```bash
bash scripts/smoke-test-staging.sh
```

For another staging API URL:

```bash
STAGING_API_URL=https://example-api.onrender.com bash scripts/smoke-test-staging.sh
```

## Rollback

If staging breaks after deploy:

1. Open Render service.
2. Go to Events.
3. Select the last known good deploy.
4. Click Rollback.
5. Re-run the staging smoke test.
6. Do not continue feature work until the broken commit is fixed or reverted.

## Release decision

A build can be marked beta-ready only if:

- API health returns ok.
- Web loads without console-blocking errors.
- Staging smoke test passes.
- Manual admin flow passes.
- No database connection errors appear in Render logs.
