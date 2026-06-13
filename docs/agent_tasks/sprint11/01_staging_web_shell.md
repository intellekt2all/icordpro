# Sprint 11 Agent Task — Staging web shell

## Context

The staging deployment is live. The current web app is a Node-served HTML page. Do not assume a React or Next.js front end exists.

## Task

Improve the existing web UI without changing the backend contract.

## Required changes

1. Replace raw JSON preview sections with readable UI rows.
2. Keep demo onboarding for fast staging tests.
3. Keep manual login and registration.
4. Show session information as a user card.
5. Show tasks as rows with title, status, priority and created date.
6. Show attendance entries as rows with type, device ID, timestamp and late status.
7. Show audit entries as rows with action, entity and timestamp.
8. Add a visible staging checklist.
9. Keep Render Free compatibility.
10. Keep API and database schema stable.

## Do not

- Do not introduce a framework rewrite.
- Do not add billing.
- Do not add Face ID.
- Do not add Gantt.
- Do not add AI assistant.
- Do not add native mobile apps.

## Acceptance criteria

- `node apps/web/src/server.js` starts the web app.
- The web app supports `PORT` and `WEB_PORT`.
- Demo user flow works.
- Task create/list works.
- Attendance check-in/check-out/list works.
- Audit log loads.
- `scripts/web-route-test.sh` passes.
