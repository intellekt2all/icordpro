#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${STAGING_API_URL:-https://icordpro-api.onrender.com}"
RUN_ID="$(date +%s)"
OWNER_EMAIL="staging-owner-${RUN_ID}@local.test"
OWNER_SECRET="staging-secret-123"
USER_EMAIL="staging-user-${RUN_ID}@local.test"
USER_SECRET="staging-user-secret-123"

printf 'Checking staging API: %s\n' "${BASE_URL}"

curl -fsS "${BASE_URL}/health" | grep -q 'ok'

REGISTER_RESPONSE=$(curl -fsS -X POST "${BASE_URL}/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"name\":\"Staging Owner\",\"email\":\"${OWNER_EMAIL}\",\"secret\":\"${OWNER_SECRET}\",\"role\":\"OWNER\"}")
echo "${REGISTER_RESPONSE}" | grep -q 'OWNER'

LOGIN_RESPONSE=$(curl -fsS -X POST "${BASE_URL}/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"${OWNER_EMAIL}\",\"secret\":\"${OWNER_SECRET}\"}")
echo "${LOGIN_RESPONSE}" | grep -q 'session'
TOKEN=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.session)" "${LOGIN_RESPONSE}")
AUTH_HEADER="authorization: Bearer ${TOKEN}"

curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/me" | grep -q "${OWNER_EMAIL}"
curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/tenant" | grep -q 'Demo Tenant'
curl -fsS -X PATCH "${BASE_URL}/tenant" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d '{"name":"Demo Tenant"}' | grep -q 'Demo Tenant'

CREATE_USER=$(curl -fsS -X POST "${BASE_URL}/users" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d "{\"name\":\"Staging User\",\"email\":\"${USER_EMAIL}\",\"secret\":\"${USER_SECRET}\",\"role\":\"MANAGER\"}")
echo "${CREATE_USER}" | grep -q 'MANAGER'
USER_ID=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.user.id)" "${CREATE_USER}")

curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/users" | grep -q "${USER_EMAIL}"
curl -fsS -X PATCH "${BASE_URL}/users/${USER_ID}" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d '{"role":"EMPLOYEE"}' | grep -q 'EMPLOYEE'

TASK_RESPONSE=$(curl -fsS -X POST "${BASE_URL}/tasks" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d '{"title":"Staging smoke task","status":"todo","priority":"high"}')
echo "${TASK_RESPONSE}" | grep -q 'task'
TASK_ID=$(node -e "const data=JSON.parse(process.argv[1]); console.log(data.task.id)" "${TASK_RESPONSE}")

curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/tasks?status=todo&priority=high" | grep -q 'Staging smoke task'
curl -fsS -X PATCH "${BASE_URL}/tasks/${TASK_ID}" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d '{"status":"done"}' | grep -q 'done'

curl -fsS -X POST "${BASE_URL}/attendance/check-in" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d '{"deviceId":"staging-smoke-device"}' | grep -q 'check-in'
curl -fsS -X POST "${BASE_URL}/attendance/check-out" \
  -H "${AUTH_HEADER}" \
  -H 'content-type: application/json' \
  -d '{"deviceId":"staging-smoke-device"}' | grep -q 'check-out'
curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/attendance" | grep -q 'staging-smoke-device'

curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/audit-log" | grep -q 'user.create'

curl -fsS -X DELETE "${BASE_URL}/tasks/${TASK_ID}" -H "${AUTH_HEADER}" | grep -q 'true'
curl -fsS -X DELETE "${BASE_URL}/users/${USER_ID}" -H "${AUTH_HEADER}" | grep -q 'true'
curl -fsS -H "${AUTH_HEADER}" "${BASE_URL}/auth/logout" | grep -q 'true'

echo 'IcordPro staging smoke-test passed'
