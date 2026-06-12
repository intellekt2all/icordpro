const required = ['DATABASE_URL'];
const optionalWithDefaults = {
  API_PORT: '4000',
  WEB_PORT: '3000',
  CORS_ORIGIN: 'http://localhost:3000'
};

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

for (const [key, defaultValue] of Object.entries(optionalWithDefaults)) {
  if (!process.env[key]) console.warn(`Optional env ${key} is not set. Default will be used: ${defaultValue}`);
}

if (process.env.DATABASE_URL.includes('replace-me')) {
  console.error('DATABASE_URL still contains placeholder value.');
  process.exit(1);
}

console.log('Environment check passed');
