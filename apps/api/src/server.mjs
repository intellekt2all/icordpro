import http from 'node:http';

const port = Number(process.env.API_PORT || 4000);
const tasks = [];
const taskComments = [];
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

function findTask(id) {
  return tasks.find((task) => task.id === id);
}

function taskList(url) {
  const status = url.searchParams.get('status');
  const priority = url.searchParams.get('priority');
  return tasks.filter((task) => {
    if (status && task.status !== status) return false;
    if (priority && task.priority !== priority) return false;
    return true;
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);

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

  if (segments[0] === 'tasks') {
    if (!requireSession(req, res)) return;

    if (segments.length === 1 && req.method === 'GET') return json(res, 200, { data: taskList(url) });

    if (segments.length === 1 && req.method === 'POST') {
      const input = await read(req);
      const task = {
        id: String(tasks.length + 1),
        title: input.title || 'Untitled task',
        status: input.status || 'todo',
        priority: input.priority || 'medium',
        description: input.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(task);
      return json(res, 201, { task });
    }

    if (segments.length === 2 && req.method === 'PATCH') {
      const task = findTask(segments[1]);
      if (!task) return json(res, 404, { error: 'task_not_found' });
      const input = await read(req);
      Object.assign(task, {
        title: input.title ?? task.title,
        status: input.status ?? task.status,
        priority: input.priority ?? task.priority,
        description: input.description ?? task.description,
        updatedAt: new Date().toISOString()
      });
      return json(res, 200, { task });
    }

    if (segments.length === 2 && req.method === 'DELETE') {
      const index = tasks.findIndex((task) => task.id === segments[1]);
      if (index === -1) return json(res, 404, { error: 'task_not_found' });
      const [deleted] = tasks.splice(index, 1);
      return json(res, 200, { ok: true, task: deleted });
    }

    if (segments.length === 3 && segments[2] === 'comments' && req.method === 'GET') {
      if (!findTask(segments[1])) return json(res, 404, { error: 'task_not_found' });
      return json(res, 200, { data: taskComments.filter((comment) => comment.taskId === segments[1]) });
    }

    if (segments.length === 3 && segments[2] === 'comments' && req.method === 'POST') {
      if (!findTask(segments[1])) return json(res, 404, { error: 'task_not_found' });
      const input = await read(req);
      const comment = {
        id: String(taskComments.length + 1),
        taskId: segments[1],
        body: input.body || '',
        createdAt: new Date().toISOString()
      };
      taskComments.push(comment);
      return json(res, 201, { comment });
    }
  }

  if (url.pathname === '/attendance/check-in') { const row = { id: String(attendance.length + 1), type: 'check-in', ...(await read(req)) }; attendance.push(row); return json(res, 201, { attendance: row }); }
  if (url.pathname === '/attendance/check-out') { const row = { id: String(attendance.length + 1), type: 'check-out', ...(await read(req)) }; attendance.push(row); return json(res, 201, { attendance: row }); }
  if (url.pathname === '/attendance') return json(res, 200, { data: attendance });
  return json(res, 404, { error: 'not_found' });
}).listen(port, () => console.log(`IcordPro API on ${port}`));
