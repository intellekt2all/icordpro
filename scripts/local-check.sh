#!/usr/bin/env bash
set -euo pipefail

node --version
pnpm --version || true
pnpm db:generate
pnpm db:migrate
pnpm typecheck
pnpm build
pnpm test
pnpm smoke:test

echo 'Local check passed. Staging preparation is allowed after review.'
