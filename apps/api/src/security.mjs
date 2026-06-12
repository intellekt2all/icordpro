import { createHash, randomBytes } from 'node:crypto';

export function digest(value) {
  return createHash('sha256').update(String(value)).digest('hex');
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
