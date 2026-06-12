#!/usr/bin/env bash
set -euo pipefail

PORT="${WEB_PORT:-3000}"
BASE_URL="http://127.0.0.1:${PORT}"

node apps/web/src/server.js > /tmp/icordpro-web.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

sleep 1

DASHBOARD_CODE=$(curl -s -o /tmp/icordpro-dashboard.txt -w '%{http_code}' "${BASE_URL}/dashboard")
test "${DASHBOARD_CODE}" = '302'
DASHBOARD_LOCATION=$(curl -s -D - -o /dev/null "${BASE_URL}/dashboard" | tr -d '\r' | grep -i '^location:' | awk '{print $2}')
test "${DASHBOARD_LOCATION}" = '/login'

LOGIN_CODE=$(curl -s -o /tmp/icordpro-login.txt -w '%{http_code}' -H 'cookie: icordpro_session=demo-session' "${BASE_URL}/login")
test "${LOGIN_CODE}" = '302'
LOGIN_LOCATION=$(curl -s -D - -o /dev/null -H 'cookie: icordpro_session=demo-session' "${BASE_URL}/login" | tr -d '\r' | grep -i '^location:' | awk '{print $2}')
test "${LOGIN_LOCATION}" = '/dashboard'

curl -fsS -H 'cookie: icordpro_session=demo-session' "${BASE_URL}/dashboard" | grep -q 'Protected dashboard'

LOGOUT_LOCATION=$(curl -s -D - -o /dev/null -H 'cookie: icordpro_session=demo-session' "${BASE_URL}/logout" | tr -d '\r' | grep -i '^location:' | awk '{print $2}')
test "${LOGOUT_LOCATION}" = '/login'

echo 'IcordPro web route test passed'
