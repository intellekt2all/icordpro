# Task 06 — CI pipeline

## Requirements

1. Keep GitHub Actions on pull request.
2. Run install, typecheck, build, test and smoke-test.
3. CI must fail if smoke-test fails.

## Acceptance criteria

- workflow file exists
- CI runs on PR to main and dev
- CI runs on push to dev
- smoke-test is part of the checks
