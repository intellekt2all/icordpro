const fs = require('node:fs');

const required = [
  'package.json',
  'pnpm-workspace.yaml',
  'apps/api/src/server.mjs',
  'apps/api/src/server-secure.mjs',
  'apps/api/src/security.mjs',
  'apps/web/src/server.js',
  'prisma/schema.prisma',
  'prisma/migrations/migration_lock.toml',
  'prisma/migrations/20260612113500_init/migration.sql',
  'prisma/migrations/20260612113600_task_comment_tenant_fk/migration.sql',
  'prisma/migrations/20260612115000_security_hardening/migration.sql',
  'scripts/validate-env.js',
  '.env.staging.example',
  'host.yaml',
  'render.yaml',
  'docs/staging/STAGING_RUNBOOK.md',
  'docs/security/SECURITY_HARDENING_PLAN.md',
  'docs/agent_tasks/sprint7/01_security_code_patch.md'
];
const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}
console.log('typecheck placeholder passed');
