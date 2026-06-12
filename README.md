# IcordPro

IcordPro MVP repository.

## Current execution stage

- MVP status: v0.5 database-backed starter
- Active branch model: `main`, `dev`, `feature/*`, `fix/*`, `release/*`
- Current sprint: Sprint 5 — Prisma PostgreSQL persistence

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

```bash
pnpm dev:api
pnpm dev:web
```

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

Do not add billing, Face ID, Gantt, AI, desktop app or deployment until the database-backed MVP gate passes.
