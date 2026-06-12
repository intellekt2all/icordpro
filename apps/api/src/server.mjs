import http from 'node:http';
import { PrismaClient } from '@prisma/client';

const port = Number(process.env.API_PORT || 4000);
const prisma = new PrismaClient();
const activeSessions = new Set(['demo-session']);
const demoTenantId = 'tenant_demo';
const demoUserId = 'user_demo';

function json(res, status, data, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(data));
}

async function read(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}; } catch { return {}; }
}

function readSession(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return '';
}

function requireSession(req, res) {
  const session = readSession(req);
  if (!session || !activeSessions.has(session)) {
    json(res, 401, { error: 'unauthorized', action: 'clear-session' });
    return false;
  }
  return true;
}

async function ensureDemoTenantAndUser(input = {}) {
  const tenant = await prisma.tenant.upsert({
    where: { id: demoTenantId },
    create: { id: demoTenantId, name: 'Demo Tenant' },
    update: {}
  });
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: input.email || 'demo@local.test' } },
    create: { id: demoUserId, tenantId: tenant.id, email: input.email || 'demo@local.test', name: input.name || 'Demo User', role: input.role || 'OWNER' },
    update: { name: input.name || 'Demo User', role: input.role || 'OWNER' }
  });
  return { tenant, user };
}

function tenantIdFromReq(req) {
  return req.headers['x-tenant-id'] || demoTenantId;
}

function isLate(isoValue) {
  const date = new Date(isoValue);
  return date.getHours() > 9 || (date.getHours() === 9 && date.getMinutes() > 0);
}

async function timeSummary(tenantId, userId) {
  const rows = await prisma.timeEntry.findMany({
    where: { tenantId, ...(userId ? { userId } : {}) },
    orderBy: { createdAt: 'asc' }
  });
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
    let openCheckIn = null;
    for (const row of userRows) {
      if (row.type === 'check-in') openCheckIn = row;
      if (row.type === 'check-out' && openCheckIn) {
        item.workingMinutes += Math.max(0, Math.round((new Date(row.createdAt) - new Date(openCheckIn.createdAt)) / 60000));
        openCheckIn = null;
      }
    }
    item.devices = [...item.devices];
  }
  return [...byUser.values()];
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const segments = url.pathname.split('/').filter(Boolean);
    const tenantId = tenantIdFromReq(req);

    if (url.pathname === '/health') return json(res, 200, { status: 'ok' });
    if (url.pathname === '/auth/register') {
      const input = await read(req);
      const result = await ensureDemoTenantAndUser(input);
      return json(res, 201, { tenant: result.tenant, user: result.user });
    }
    if (url.pathname === '/auth/login') {
      const input = await read(req);
      const result = await ensureDemoTenantAndUser(input);
      const session = 'demo-session';
      activeSessions.add(session);
      return json(res, 200, { session, tenant: result.tenant, user: result.user });
    }
    if (url.pathname === '/auth/refresh') {
      if (!requireSession(req, res)) return;
      return json(res, 200, { session: readSession(req) });
    }
    if (url.pathname === '/auth/logout') {
      activeSessions.delete(readSession(req));
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/me') {
      if (!requireSession(req, res)) return;
      const { user } = await ensureDemoTenantAndUser();
      return json(res, 200, { user });
    }

    if (segments[0] === 'tasks') {
      if (!requireSession(req, res)) return;
      await ensureDemoTenantAndUser();

      if (segments.length === 1 && req.method === 'GET') {
        const status = url.searchParams.get('status') || undefined;
        const priority = url.searchParams.get('priority') || undefined;
        const data = await prisma.task.findMany({ where: { tenantId, ...(status ? { status } : {}), ...(priority ? { priority } : {}) }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data });
      }

      if (segments.length === 1 && req.method === 'POST') {
        const input = await read(req);
        const task = await prisma.task.create({
          data: {
            tenantId,
            title: input.title || 'Untitled task',
            status: input.status || 'todo',
            priority: input.priority || 'medium',
            description: input.description || ''
          }
        });
        return json(res, 201, { task });
      }

      if (segments.length === 2 && req.method === 'PATCH') {
        const existing = await prisma.task.findFirst({ where: { id: segments[1], tenantId } });
        if (!existing) return json(res, 404, { error: 'task_not_found' });
        const input = await read(req);
        const task = await prisma.task.update({
          where: { id: existing.id },
          data: {
            title: input.title ?? existing.title,
            status: input.status ?? existing.status,
            priority: input.priority ?? existing.priority,
            description: input.description ?? existing.description
          }
        });
        return json(res, 200, { task });
      }

      if (segments.length === 2 && req.method === 'DELETE') {
        const existing = await prisma.task.findFirst({ where: { id: segments[1], tenantId } });
        if (!existing) return json(res, 404, { error: 'task_not_found' });
        const task = await prisma.task.delete({ where: { id: existing.id } });
        return json(res, 200, { ok: true, task });
      }

      if (segments.length === 3 && segments[2] === 'comments' && req.method === 'GET') {
        const task = await prisma.task.findFirst({ where: { id: segments[1], tenantId } });
        if (!task) return json(res, 404, { error: 'task_not_found' });
        const data = await prisma.taskComment.findMany({ where: { tenantId, taskId: task.id }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data });
      }

      if (segments.length === 3 && segments[2] === 'comments' && req.method === 'POST') {
        const task = await prisma.task.findFirst({ where: { id: segments[1], tenantId } });
        if (!task) return json(res, 404, { error: 'task_not_found' });
        const input = await read(req);
        const comment = await prisma.taskComment.create({ data: { tenantId, taskId: task.id, body: input.body || '' } });
        return json(res, 201, { comment });
      }
    }

    if (segments[0] === 'attendance') {
      if (!requireSession(req, res)) return;
      const { user } = await ensureDemoTenantAndUser();
      if (segments.length === 1 && req.method === 'GET') {
        const data = await prisma.timeEntry.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
        return json(res, 200, { data });
      }
      if (segments.length === 2 && segments[1] === 'summary' && req.method === 'GET') return json(res, 200, { data: await timeSummary(tenantId, url.searchParams.get('userId')) });
      if (segments.length === 2 && ['check-in', 'check-out'].includes(segments[1]) && req.method === 'POST') {
        const input = await read(req);
        const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
        const entry = await prisma.timeEntry.create({
          data: {
            tenantId,
            userId: input.userId || user.id,
            type: segments[1],
            deviceId: input.deviceId || 'demo-device',
            createdAt,
            late: segments[1] === 'check-in' ? isLate(createdAt.toISOString()) : false
          }
        });
        return json(res, 201, { attendance: entry });
      }
    }

    return json(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'internal_error', message: error.message });
  }
}).listen(port, () => console.log(`IcordPro API on ${port}`));
