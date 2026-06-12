const fs = require('node:fs');

const required = [
  'package.json',
  'pnpm-workspace.yaml',
  'apps/api/src/server.mjs',
  'apps/web/src/server.js',
  'prisma/schema.prisma',
  'prisma/migrations/migration_lock.toml',
  'prisma/migrations/20260612113500_init/migration.sql',
  'prisma/migrations/20260612113600_task_comment_tenant_fk/migration.sql',
  'scripts/validate-env.js',
  '.env.staging.example',
  'docs/staging/STAGING_RUNBOOK.md'
];
const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}
console.log('typecheck placeholder passed');
