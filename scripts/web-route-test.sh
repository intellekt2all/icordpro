#!/usr/bin/env bash
set -euo pipefail

PORT="${WEB_PORT:-3000}"
BASE_URL="http://127.0.0.1:${PORT}"

node apps/web/src/server.js > /tmp/icordpro-web.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

sleep 1

curl -fsS "${BASE_URL}/" | grep -q 'IcordPro MVP'
curl -fsS "${BASE_URL}/" | grep -q 'Register / Login'
curl -fsS "${BASE_URL}/" | grep -q 'Create task'
curl -fsS "${BASE_URL}/" | grep -q 'Timeclock'
curl -fsS "${BASE_URL}/" | grep -q 'Audit'

echo 'IcordPro web route test passed'
