#!/usr/bin/env bash
set -euo pipefail

node --version
pnpm --version || true
node scripts/typecheck.js
node scripts/build.js
node scripts/test.js
bash scripts/smoke-test.sh

echo 'Local check passed. Deployment is now allowed for staging preparation.'
