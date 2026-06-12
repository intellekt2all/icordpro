# IcordPro Agent Rules

## Role

You are an implementation agent for IcordPro MVP. Execute only the assigned task.

## Required workflow

1. Work in `feature/*` or `fix/*` branches.
2. Never push directly to `main`.
3. Keep tenant isolation intact.
4. Never commit `.env` files or secrets.
5. Do not add Face ID, billing, Gantt, AI, desktop app, or App Store release work to MVP-1.

## Required checks before PR

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm smoke:test
```

## Stop conditions

Stop and report if:

- a required file is missing,
- a migration is destructive,
- tenant isolation is unclear,
- security logic conflicts with requirements,
- acceptance criteria cannot be proven locally.
