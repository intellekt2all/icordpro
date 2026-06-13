# Sprint 11 — Staging web shell

## Decision

The current web app is a lightweight Node-served HTML page. It is not a Next.js or React app yet.

A full front-end framework rewrite is intentionally out of scope for this sprint. The immediate goal is to make the live staging MVP readable and usable before adding more product surface.

## Scope

- Improve the staging UI shell.
- Keep demo onboarding for fast testing.
- Keep manual login/register.
- Render tasks, attendance and audit as readable rows instead of raw JSON blocks.
- Keep Render Free compatibility.
- Keep the existing API and database contracts stable.

## Not in scope

- Billing.
- Face ID.
- Geolocation attendance.
- Gantt charts.
- AI assistant.
- Native mobile apps.
- Full production onboarding.
- Front-end framework rewrite.

## Acceptance criteria

- Web app starts with `node apps/web/src/server.js`.
- Web app supports platform `PORT` and `WEB_PORT`.
- Demo user flow still works.
- Task create/list flow works.
- Attendance check-in/check-out/list flow works.
- Audit log loads and displays readable entries.
- Route smoke test checks the staging shell content.

## Staging URL

- Web: `https://icordpro-web.onrender.com`
- API: `https://icordpro-api.onrender.com`

## Follow-up

After this sprint, the next controlled step is to add real API endpoints for tenant and user management. Only after those flows are validated should the project move to a front-end framework rewrite.
