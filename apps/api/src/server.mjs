import http from 'node:http';

const port = Number(process.env.API_PORT || 4000);
const tasks = [];
const attendance = [];
const activeSessions = new Set(['demo-session']);

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

http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/health') return json(res, 200, { status: 'ok' });
  if (url.pathname === '/auth/register') return json(res, 201, { user: await read(req) });
  if (url.pathname === '/auth/login') {
    const user = await read(req);
    const session = 'demo-session';
    activeSessions.add(session);
    return json(res, 200, { session, user });
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
    return json(res, 200, { user: { id: 'demo_user', role: 'OWNER' } });
  }
  if (url.pathname === '/tasks' && req.method === 'GET') return json(res, 200, { data: tasks });
  if (url.pathname === '/tasks' && req.method === 'POST') { const task = { id: String(tasks.length + 1), ...(await read(req)) }; tasks.push(task); return json(res, 201, { task }); }
  if (url.pathname === '/attendance/check-in') { const row = { id: String(attendance.length + 1), type: 'check-in', ...(await read(req)) }; attendance.push(row); return json(res, 201, { attendance: row }); }
  if (url.pathname === '/attendance/check-out') { const row = { id: String(attendance.length + 1), type: 'check-out', ...(await read(req)) }; attendance.push(row); return json(res, 201, { attendance: row }); }
  if (url.pathname === '/attendance') return json(res, 200, { data: attendance });
  return json(res, 404, { error: 'not_found' });
}).listen(port, () => console.log(`IcordPro API on ${port}`));
