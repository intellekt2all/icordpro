#!/usr/bin/env bash
set -euo pipefail

PORT="${API_PORT:-4000}"
BASE_URL="http://127.0.0.1:${PORT}"
OWNER_SECRET='demo-secret-123'
EMPLOYEE_SECRET='employee-secret-123'
SMOKE_SUFFIX="${RANDOM}${RANDOM}"
MANAGER_EMAIL="manager-${SMOKE_SUFFIX}@local.test"
MANAGER_SECRET='manager-secret-123'

node apps/api/src/server-secure.mjs > /tmp/icordpro-api.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

sleep 2

curl -fsS "${BASE_URL}/health" | grep -q 'ok'
curl -fsS -X POST "${BASE_URL}/auth/register" -H 'content-type: application/json' -d "{\"name\":\"Demo Owner\",\"email\":\"demo@local.test\",\"secret\":\"${OWNER_SECRET}\",\"role\":\"OWNER\"}" | grep -q 'OWNER'
WRONG_CODE=$(curl -s -o /tmp/icordpro-wrong-login.json -w '%{http_code}' -X POST "${BASE_URL}/auth/login" -H 'content-type: application/json' -d '{"email":"demo@local.test","secret":"wrong-secret"}')
test "${WRONG_CODE}" = '401'
LOGIN_RESPONSE=$(curl -fsS -X POST "${BASE_URL}/auth/login" -H 'content-type: application/json' -d "{\"email\":\"demo@local.test\",\"secret\":\"${OWNER_SECRET}\"}")
echo "${LOGIN_RESPONSE}" | grep -q 'session'
OWNER_TOKEN=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.session)" "${LOGIN_RESPONSE}")
OWNER_HEADER="authorization: Bearer ${OWNER_TOKEN}"

curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/me" | grep -q 'OWNER'
UNAUTH_CODE=$(curl -s -o /tmp/icordpro-unauth.json -w '%{http_code}' "${BASE_URL}/me")
test "${UNAUTH_CODE}" = '401'
grep -q 'clear-session' /tmp/icordpro-unauth.json
TASK_UNAUTH_CODE=$(curl -s -o /tmp/icordpro-task-unauth.json -w '%{http_code}' "${BASE_URL}/tasks")
test "${TASK_UNAUTH_CODE}" = '401'

curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/tenant" | grep -q 'Demo Tenant'
curl -fsS -X PATCH "${BASE_URL}/tenant" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"name":"Demo Tenant"}' | grep -q 'Demo Tenant'
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/users" | grep -q 'demo@local.test'
MANAGER_CREATE=$(curl -fsS -X POST "${BASE_URL}/users" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d "{\"name\":\"Smoke Manager\",\"email\":\"${MANAGER_EMAIL}\",\"secret\":\"${MANAGER_SECRET}\",\"role\":\"MANAGER\"}")
echo "${MANAGER_CREATE}" | grep -q 'MANAGER'
MANAGER_ID=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.user.id)" "${MANAGER_CREATE}")
curl -fsS -X PATCH "${BASE_URL}/users/${MANAGER_ID}" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"role":"EMPLOYEE"}' | grep -q 'EMPLOYEE'
SELF_DELETE_CODE=$(curl -s -o /tmp/icordpro-self-delete.json -w '%{http_code}' -X DELETE "${BASE_URL}/users/user_demo" -H "${OWNER_HEADER}")
test "${SELF_DELETE_CODE}" = '400'
curl -fsS -X DELETE "${BASE_URL}/users/${MANAGER_ID}" -H "${OWNER_HEADER}" | grep -q 'true'

TASK_RESPONSE=$(curl -fsS -X POST "${BASE_URL}/tasks" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"title":"Smoke task","status":"todo","priority":"high"}')
echo "${TASK_RESPONSE}" | grep -q 'task'
TASK_ID=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.task.id)" "${TASK_RESPONSE}")
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/tasks?status=todo&priority=high" | grep -q 'Smoke task'
curl -fsS -X PATCH "${BASE_URL}/tasks/${TASK_ID}" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"status":"done","priority":"low"}' | grep -q 'done'
curl -fsS -X POST "${BASE_URL}/tasks/${TASK_ID}/comments" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"body":"Smoke comment"}' | grep -q 'Smoke comment'
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/tasks/${TASK_ID}/comments" | grep -q 'Smoke comment'

curl -fsS -X POST "${BASE_URL}/auth/register" -H 'content-type: application/json' -d "{\"name\":\"Demo Employee\",\"email\":\"employee@local.test\",\"secret\":\"${EMPLOYEE_SECRET}\",\"role\":\"EMPLOYEE\"}" | grep -q 'EMPLOYEE'
EMPLOYEE_LOGIN=$(curl -fsS -X POST "${BASE_URL}/auth/login" -H 'content-type: application/json' -d "{\"email\":\"employee@local.test\",\"secret\":\"${EMPLOYEE_SECRET}\"}")
EMPLOYEE_TOKEN=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.session)" "${EMPLOYEE_LOGIN}")
EMPLOYEE_HEADER="authorization: Bearer ${EMPLOYEE_TOKEN}"
USERS_FORBIDDEN_CODE=$(curl -s -o /tmp/icordpro-users-forbidden.json -w '%{http_code}' -H "${EMPLOYEE_HEADER}" "${BASE_URL}/users")
test "${USERS_FORBIDDEN_CODE}" = '403'
DELETE_FORBIDDEN_CODE=$(curl -s -o /tmp/icordpro-delete-forbidden.json -w '%{http_code}' -X DELETE "${BASE_URL}/tasks/${TASK_ID}" -H "${EMPLOYEE_HEADER}")
test "${DELETE_FORBIDDEN_CODE}" = '403'
curl -fsS -X DELETE "${BASE_URL}/tasks/${TASK_ID}" -H "${OWNER_HEADER}" | grep -q 'true'

ATTENDANCE_UNAUTH_CODE=$(curl -s -o /tmp/icordpro-attendance-unauth.json -w '%{http_code}' "${BASE_URL}/attendance")
test "${ATTENDANCE_UNAUTH_CODE}" = '401'
curl -fsS -X POST "${BASE_URL}/attendance/check-in" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"userId":"user_demo","deviceId":"device-a","createdAt":"2026-06-12T09:05:00.000Z"}' | grep -q 'late'
curl -fsS -X POST "${BASE_URL}/attendance/check-out" -H "${OWNER_HEADER}" -H 'content-type: application/json' -d '{"userId":"user_demo","deviceId":"device-a","createdAt":"2026-06-12T17:05:00.000Z"}' | grep -q 'check-out'
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/attendance" | grep -q 'device-a'
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/attendance/summary?userId=user_demo" | grep -q 'workingMinutes'
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/audit-log" | grep -q 'user.create'
curl -fsS -H "${OWNER_HEADER}" "${BASE_URL}/auth/logout" | grep -q 'true'
LOGOUT_CODE=$(curl -s -o /tmp/icordpro-after-logout.json -w '%{http_code}' -H "${OWNER_HEADER}" "${BASE_URL}/me")
test "${LOGOUT_CODE}" = '401'

echo 'IcordPro smoke-test passed'
