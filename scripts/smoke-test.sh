#!/usr/bin/env bash
set -euo pipefail

PORT="${API_PORT:-4000}"
BASE_URL="http://127.0.0.1:${PORT}"
SESSION_HEADER='authorization: Bearer demo-session'

node apps/api/src/server.mjs > /tmp/icordpro-api.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

sleep 1

curl -fsS "${BASE_URL}/health" | grep -q 'ok'
curl -fsS -X POST "${BASE_URL}/auth/register" -H 'content-type: application/json' -d '{"name":"Demo","email":"demo@local.test"}' | grep -q 'user'
curl -fsS -X POST "${BASE_URL}/auth/login" -H 'content-type: application/json' -d '{"email":"demo@local.test"}' | grep -q 'session'
curl -fsS -H "${SESSION_HEADER}" "${BASE_URL}/me" | grep -q 'OWNER'
UNAUTH_CODE=$(curl -s -o /tmp/icordpro-unauth.json -w '%{http_code}' "${BASE_URL}/me")
test "${UNAUTH_CODE}" = '401'
grep -q 'clear-session' /tmp/icordpro-unauth.json
TASK_UNAUTH_CODE=$(curl -s -o /tmp/icordpro-task-unauth.json -w '%{http_code}' "${BASE_URL}/tasks")
test "${TASK_UNAUTH_CODE}" = '401'
curl -fsS -X POST "${BASE_URL}/tasks" -H "${SESSION_HEADER}" -H 'content-type: application/json' -d '{"title":"Smoke task","status":"todo","priority":"high"}' | grep -q 'task'
curl -fsS -H "${SESSION_HEADER}" "${BASE_URL}/tasks?status=todo&priority=high" | grep -q 'Smoke task'
curl -fsS -X PATCH "${BASE_URL}/tasks/1" -H "${SESSION_HEADER}" -H 'content-type: application/json' -d '{"status":"done","priority":"low"}' | grep -q 'done'
curl -fsS -X POST "${BASE_URL}/tasks/1/comments" -H "${SESSION_HEADER}" -H 'content-type: application/json' -d '{"body":"Smoke comment"}' | grep -q 'Smoke comment'
curl -fsS -H "${SESSION_HEADER}" "${BASE_URL}/tasks/1/comments" | grep -q 'Smoke comment'
curl -fsS -X DELETE "${BASE_URL}/tasks/1" -H "${SESSION_HEADER}" | grep -q 'true'
curl -fsS -X POST "${BASE_URL}/attendance/check-in" -H 'content-type: application/json' -d '{"userId":"demo_user"}' | grep -q 'check-in'
curl -fsS "${BASE_URL}/attendance" | grep -q 'check-in'

echo 'IcordPro smoke-test passed'
