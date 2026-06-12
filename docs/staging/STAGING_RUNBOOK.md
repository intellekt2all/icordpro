# Sprint 6 — Staging Readiness Runbook

## Goal

Prepare staging without deploying automatically.

## Required external resources

| Resource | Purpose |
|---|---|
| Neon PostgreSQL | Staging database |
| Render or Railway | API host |
| Vercel or static host | Web host |
| GitHub Actions | CI gate |

## Required environment variables

```bash
DATABASE_URL=replace-me
API_PORT=4000
WEB_PORT=3000
CORS_ORIGIN=https://replace-me-web-staging-domain
```

## Local preflight

```bash
pnpm install
cp .env.staging.example .env
pnpm env:check
pnpm db:generate
pnpm typecheck
pnpm build
```

## Database preflight

```bash
pnpm db:migrate
pnpm smoke:test
```

## Deployment lock

Do not connect live customer data until:

1. GitHub Actions passes.
2. `pnpm local:check` passes locally.
3. Staging database migration passes.
4. Smoke-test passes against staging API.
5. No secrets are committed.

## Staging sequence

1. Create staging PostgreSQL database.
2. Put `DATABASE_URL` into API host environment variables.
3. Run `pnpm db:migrate` in API host build/release step.
4. Start API with `pnpm dev:api` or production start script after it is added.
5. Configure web host with API URL after frontend API client is introduced.
6. Run smoke-test against staging API.

## Explicit exclusions

- No billing.
- No Face ID.
- No Gantt.
- No AI assistant.
- No production customer onboarding.
- No App Store or Play Market release.
