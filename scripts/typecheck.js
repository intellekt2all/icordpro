const fs = require('node:fs');

const required = ['package.json', 'pnpm-workspace.yaml', 'apps/api/src/server.mjs', 'apps/web/src/server.js'];
const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}
console.log('typecheck placeholder passed');
