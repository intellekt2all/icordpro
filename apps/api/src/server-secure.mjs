import http from 'node:http';
import { PrismaClient } from '@prisma/client';
import { allowAuthAttempt, canDeleteTask, digest, encodeSecret, matchSecret, newToken, readBearer, validEmail, validSecret } from './security.mjs';

const port = Number(process.env.PORT || process.env.API_PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const prisma = new PrismaClient();
const demoTenantId = 'tenant_demo';
const demoUserId = 'user_demo';
const roles = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'];

function responseHeaders(extra = {}) {
  return {
    'content-type': 'application/json',
    'access-control-allow-origin': corsOrigin,
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    ...extra
  };
}

function json(res, status, data) {
  res.writeHead(status, responseHeaders());
  res.end(JSON.stringify(data));
}

async function read(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}; } catch { return {}; }
}

async function demoTenant() {
  return prisma.tenant.upsert({ where: { id: demoTenantId }, create: { id: demoTenantId, name: 'Demo Tenant' }, update: {} });
}

function publicUser(user) {
  return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role };
}

async function writeAudit(ctx, action, entity, entityId, metadata = {}) {
  await prisma.auditLog.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, action, entity, entityId, metadata: JSON.stringify(metadata) } });
}

async function sessionContext(req, res) {
  const raw = readBearer(req);
  if (!raw) {
    json(res, 401, { error: 'unauthorized', action: 'clear-session' });
    return null;
  }
  const session = await prisma.session.findUnique({ where: { tokenHash: digest(raw) }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    json(res, 401, { error: 'unauthorized', action: 'clear-session' });
    return null;
  }
  return { tenantId: session.tenantId, userId: session.userId, user: session.user, session };
}

function normalizeRole(value, fallback = 'EMPLOYEE') {
  const role = String(value || fallback).toUpperCase();
  return roles.includes(role) ? role : fallback;
}

function canViewUsers(role) {
  return ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
}

function canManageTenant(role) {
  return ['OWNER', 'ADMIN'].includes(role);
}

function canCreateUserRole(actorRole, targetRole) {
  if (actorRole === 'OWNER') return ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(targetRole);
  if (actorRole === 'ADMIN') return ['MANAGER', 'EMPLOYEE'].includes(targetRole);
  if (actorRole === 'MANAGER') return targetRole === 'EMPLOYEE';
  return false;
}

function canUpdateUserRole(actorRole, currentRole, targetRole) {
  if (actorRole === 'OWNER') return currentRole !== 'OWNER' && targetRole !== 'OWNER';
  if (actorRole === 'ADMIN') return ['MANAGER', 'EMPLOYEE'].includes(currentRole) && ['MANAGER', 'EMPLOYEE'].includes(targetRole);
  return false;
}

function canRemoveUserRole(actorRole, targetRole) {
  if (actorRole === 'OWNER') return targetRole !== 'OWNER';
  if (actorRole === 'ADMIN') return ['MANAGER', 'EMPLOYEE'].includes(targetRole);
  return false;
}

function isLate(isoValue) {
  const date = new Date(isoValue);
  return date.getHours() > 9 || (date.getHours() === 9 && date.getMinutes() > 0);
}

async function timeSummary(tenantId, userId) {
  const rows = await prisma.timeEntry.findMany({ where: { tenantId, ...(userId ? { userId } : {}) }, orderBy: { createdAt: 'asc' } });
  const byUser = new Map();
  for (const row of rows) {
    const item = byUser.get(row.userId) || { userId: row.userId, workingMinutes: 0, checkIns: 0, checkOuts: 0, devices: new Set() };
    if (row.type === 'check-in') item.checkIns += 1;
    if (row.type === 'check-out') item.checkOuts += 1;
    if (row.deviceId) item.devices.add(row.deviceId);
    byUser.set(row.userId, item);
  }
  for (const item of byUser.values()) {
    const userRows = rows.filter((row) => row.userId === item.userId);
    let opened = null;
    for (const row of userRows) {
      if (row.type === 'check-in') opened = row;
      if (row.type === 'check-out' && opened) {
        item.workingMinutes += Math.max(0, Math.round((new Date(row.createdAt) - new Date(opened.createdAt)) / 60000));
        opened = null;
      }
    }
    item.devices = [...item.devices];
  }
  return [...byUser.values()];
}

http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, responseHeaders({ 'content-type': 'text/plain' }));
      return res.end();
    }

    const url = new URL(req.url || '/', 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);

    if (url.pathname === '/health') return json(res, 200, { status: 'ok' });

    if (url.pathname === '/auth/register' && req.method === 'POST') {
      if (!allowAuthAttempt(req)) return json(res, 429, { error: 'rate_limited' });
      const input = await read(req);
      const secret = input.secret || input.password || '';
      if (!validEmail(input.email) || !validSecret(secret)) return json(res, 400, { error: 'invalid_auth_payload' });
      const tenant = await demoTenant();
      const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: input.email } },
        create: { id: input.email === 'demo@local.test' ? demoUserId : undefined, tenantId: tenant.id, email: input.email, name: input.name || 'Demo User', role: input.role || 'OWNER', passwordHash: encodeSecret(secret) },
        update: { name: input.name || 'Demo User', role: input.role || 'OWNER', passwordHash: encodeSecret(secret) }
      });
      await prisma.auditLog.create({ data: { tenantId: tenant.id, userId: user.id, action: 'auth.register', entity: 'user', entityId: user.id } });
      return json(res, 201, { tenant, user: publicUser(user) });
    }

    if (url.pathname === '/auth/login' && req.method === 'POST') {
      if (!allowAuthAttempt(req)) return json(res, 429, { error: 'rate_limited' });
      const input = await read(req);
      const secret = input.secret || input.password || '';
      const tenant = await demoTenant();
      const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email: input.email || '' } } });
      if (!user || !matchSecret(secret, user.passwordHash)) return json(res, 401, { error: 'invalid_credentials' });
      const raw = newToken();
      const session = await prisma.session.create({ data: { tenantId: tenant.id, userId: user.id, tokenHash: digest(raw), expiresAt: new Date(Date.now() + 604800000) } });
      await prisma.auditLog.create({ data: { tenantId: tenant.id, userId: user.id, action: 'auth.login', entity: 'session', entityId: session.id } });
      return json(res, 200, { session: raw, tenant, user: publicUser(user) });
    }

    if (url.pathname === '/auth/refresh') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      return json(res, 200, { session: readBearer(req), expiresAt: ctx.session.expiresAt });
    }

    if (url.pathname === '/auth/logout') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      await prisma.session.update({ where: { id: ctx.session.id }, data: { revokedAt: new Date() } });
      await writeAudit(ctx, 'auth.logout', 'session', ctx.session.id);
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/me') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      return json(res, 200, { user: publicUser(ctx.user) });
    }

    if (url.pathname === '/audit-log') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      if (!canDeleteTask(ctx.user.role)) return json(res, 403, { error: 'forbidden' });
      const data = await prisma.auditLog.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
      return json(res, 200, { data });
    }

    if (url.pathname === '/tenant') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      if (req.method === 'GET') {
        const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
        return json(res, 200, { tenant });
      }
      if (req.method === 'PATCH') {
        if (!canManageTenant(ctx.user.role)) return json(res, 403, { error: 'forbidden' });
        const input = await read(req);
        const name = String(input.name || '').trim();
        if (name.length < 2) return json(res, 400, { error: 'invalid_tenant_payload' });
        const tenant = await prisma.tenant.update({ where: { id: ctx.tenantId }, data: { name } });
        await writeAudit(ctx, 'tenant.update', 'tenant', tenant.id, { name });
        return json(res, 200, { tenant });
      }
    }

    if (parts[0] === 'users') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      if (!canViewUsers(ctx.user.role)) return json(res, 403, { error: 'forbidden' });

      if (parts.length === 1 && req.method === 'GET') {
        const data = await prisma.user.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data: data.map(publicUser) });
      }

      if (parts.length === 1 && req.method === 'POST') {
        const input = await read(req);
        const email = String(input.email || '').trim().toLowerCase();
        const name = String(input.name || '').trim();
        const role = normalizeRole(input.role, 'EMPLOYEE');
        const secret = input.secret || input.password || 'change-me-123';
        if (!validEmail(email) || name.length < 2 || !validSecret(secret)) return json(res, 400, { error: 'invalid_user_payload' });
        if (!canCreateUserRole(ctx.user.role, role)) return json(res, 403, { error: 'forbidden_role' });
        const existing = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: ctx.tenantId, email } } });
        if (existing) return json(res, 409, { error: 'user_exists' });
        const user = await prisma.user.create({ data: { tenantId: ctx.tenantId, email, name, role, passwordHash: encodeSecret(secret) } });
        await writeAudit(ctx, 'user.create', 'user', user.id, { role });
        return json(res, 201, { user: publicUser(user) });
      }

      if (parts.length === 2 && req.method === 'PATCH') {
        const existing = await prisma.user.findFirst({ where: { id: parts[1], tenantId: ctx.tenantId } });
        if (!existing) return json(res, 404, { error: 'user_not_found' });
        const input = await read(req);
        const nextRole = input.role ? normalizeRole(input.role, existing.role) : existing.role;
        if (!canUpdateUserRole(ctx.user.role, existing.role, nextRole)) return json(res, 403, { error: 'forbidden_role' });
        const data = { name: input.name ? String(input.name).trim() : existing.name, role: nextRole };
        if (input.secret || input.password) {
          const secret = input.secret || input.password;
          if (!validSecret(secret)) return json(res, 400, { error: 'invalid_secret' });
          data.passwordHash = encodeSecret(secret);
        }
        const user = await prisma.user.update({ where: { id: existing.id }, data });
        await writeAudit(ctx, 'user.update', 'user', user.id, { role: user.role });
        return json(res, 200, { user: publicUser(user) });
      }

      if (parts.length === 2 && req.method === 'DELETE') {
        const existing = await prisma.user.findFirst({ where: { id: parts[1], tenantId: ctx.tenantId } });
        if (!existing) return json(res, 404, { error: 'user_not_found' });
        if (existing.id === ctx.userId) return json(res, 400, { error: 'self_delete_blocked' });
        if (!canRemoveUserRole(ctx.user.role, existing.role)) return json(res, 403, { error: 'forbidden_role' });
        await prisma.session.deleteMany({ where: { tenantId: ctx.tenantId, userId: existing.id } });
        await writeAudit(ctx, 'user.delete', 'user', existing.id, { role: existing.role, email: existing.email });
        await prisma.user.delete({ where: { id: existing.id } });
        return json(res, 200, { ok: true, user: publicUser(existing) });
      }
    }

    if (parts[0] === 'tasks') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      const tenantId = ctx.tenantId;
      if (parts.length === 1 && req.method === 'GET') {
        const status = url.searchParams.get('status') || undefined;
        const priority = url.searchParams.get('priority') || undefined;
        const data = await prisma.task.findMany({ where: { tenantId, ...(status ? { status } : {}), ...(priority ? { priority } : {}) }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data });
      }
      if (parts.length === 1 && req.method === 'POST') {
        const input = await read(req);
        if (!input.title || String(input.title).trim().length < 2) return json(res, 400, { error: 'invalid_task_payload' });
        const task = await prisma.task.create({ data: { tenantId, title: String(input.title).trim(), status: input.status || 'todo', priority: input.priority || 'medium', description: input.description || '' } });
        await writeAudit(ctx, 'task.create', 'task', task.id);
        return json(res, 201, { task });
      }
      if (parts.length === 2 && req.method === 'PATCH') {
        const existing = await prisma.task.findFirst({ where: { id: parts[1], tenantId } });
        if (!existing) return json(res, 404, { error: 'task_not_found' });
        const input = await read(req);
        const task = await prisma.task.update({ where: { id: existing.id }, data: { title: input.title ?? existing.title, status: input.status ?? existing.status, priority: input.priority ?? existing.priority, description: input.description ?? existing.description } });
        await writeAudit(ctx, 'task.update', 'task', task.id);
        return json(res, 200, { task });
      }
      if (parts.length === 2 && req.method === 'DELETE') {
        if (!canDeleteTask(ctx.user.role)) return json(res, 403, { error: 'forbidden' });
        const existing = await prisma.task.findFirst({ where: { id: parts[1], tenantId } });
        if (!existing) return json(res, 404, { error: 'task_not_found' });
        const task = await prisma.task.delete({ where: { id: existing.id } });
        await writeAudit(ctx, 'task.delete', 'task', task.id);
        return json(res, 200, { ok: true, task });
      }
      if (parts.length === 3 && parts[2] === 'comments' && req.method === 'GET') {
        const task = await prisma.task.findFirst({ where: { id: parts[1], tenantId } });
        if (!task) return json(res, 404, { error: 'task_not_found' });
        const data = await prisma.taskComment.findMany({ where: { tenantId, taskId: task.id }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data });
      }
      if (parts.length === 3 && parts[2] === 'comments' && req.method === 'POST') {
        const task = await prisma.task.findFirst({ where: { id: parts[1], tenantId } });
        if (!task) return json(res, 404, { error: 'task_not_found' });
        const input = await read(req);
        if (!input.body) return json(res, 400, { error: 'invalid_comment_payload' });
        const comment = await prisma.taskComment.create({ data: { tenantId, taskId: task.id, body: String(input.body).trim() } });
        await writeAudit(ctx, 'task.comment.create', 'taskComment', comment.id);
        return json(res, 201, { comment });
      }
    }

    if (parts[0] === 'attendance') {
      const ctx = await sessionContext(req, res);
      if (!ctx) return;
      const tenantId = ctx.tenantId;
      if (parts.length === 1 && req.method === 'GET') {
        const data = await prisma.timeEntry.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data });
      }
      if (parts.length === 2 && parts[1] === 'summary' && req.method === 'GET') return json(res, 200, { data: await timeSummary(tenantId, url.searchParams.get('userId')) });
      if (parts.length === 2 && ['check-in', 'check-out'].includes(parts[1]) && req.method === 'POST') {
        const input = await read(req);
        const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
        const entry = await prisma.timeEntry.create({ data: { tenantId, userId: input.userId || ctx.userId, type: parts[1], deviceId: input.deviceId || 'demo-device', createdAt, late: parts[1] === 'check-in' ? isLate(createdAt.toISOString()) : false } });
        await writeAudit(ctx, `time.${parts[1]}`, 'timeEntry', entry.id);
        return json(res, 201, { attendance: entry });
      }
    }

    return json(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'internal_error', message: error.message });
  }
}).listen(port, () => console.log(`IcordPro API on ${port}`));
