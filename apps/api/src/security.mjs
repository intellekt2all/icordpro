import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

export function digest(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function encodeSecret(value) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(String(value), salt, 120000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

export function matchSecret(value, stored) {
  const [scheme, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'pbkdf2' || !salt || !hash) return false;
  const candidate = Buffer.from(pbkdf2Sync(String(value), salt, 120000, 64, 'sha512').toString('hex'));
  const expected = Buffer.from(hash);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function newToken() {
  return randomBytes(32).toString('hex');
}

export function validEmail(value) {
  return typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function validSecret(value) {
  return typeof value === 'string' && value.length >= 8;
}

export function readBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

const buckets = new Map();

export function allowAuthAttempt(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
  const key = `${ip}:${new Date().toISOString().slice(0, 16)}`;
  const count = (buckets.get(key) || 0) + 1;
  buckets.set(key, count);
  return count <= 20;
}

export function canDeleteTask(role) {
  return role === 'OWNER' || role === 'ADMIN';
}
