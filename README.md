# IcordPro

IcordPro MVP repository.

## Current execution stage

- MVP status: v0.8 API-connected web preview
- Active branch model: `main`, `dev`, `feature/*`, `fix/*`, `release/*`
- Current sprint: Sprint 8 — Web user preview

## Non-negotiable rule

Do not deploy before local smoke test passes.

## Local setup

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm local:check
```

## Development

Terminal 1:

```bash
pnpm dev:api
```

Terminal 2:

```bash
pnpm dev:web
```

Open:

```text
http://localhost:3000
```

## User preview flow

1. Register a demo owner.
2. Login.
3. Create a task.
4. List tasks.
5. Use timeclock actions.
6. Load audit log.
7. Logout.

## Required gates before PR merge

```bash
pnpm db:generate
pnpm db:migrate
pnpm typecheck
pnpm build
pnpm test
pnpm smoke:test
```

## MVP-1 scope lock

Do not add billing, Face ID, Gantt, AI, desktop app or deployment until staging gates pass.
