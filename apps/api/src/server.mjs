import http from 'node:http';

const port = Number(process.env.API_PORT || 4000);
const tasks = [];
const attendance = [];

function json(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function read(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}; } catch { return {}; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/health') return json(res, 200, { status: 'ok' });
  if (url.pathname === '/auth/register') return json(res, 201, { user: await read(req) });
  if (url.pathname === '/auth/login') return json(res, 200, { session: 'demo', user: await read(req) });
  if (url.pathname === '/tasks' && req.method === 'GET') return json(res, 200, { data: tasks });
  if (url.pathname === '/tasks' && req.method === 'POST') { const task = { id: String(tasks.length + 1), ...(await read(req)) }; tasks.push(task); return json(res, 201, { task }); }
  if (url.pathname === '/attendance/check-in') { const row = { id: String(attendance.length + 1), type: 'check-in', ...(await read(req)) }; attendance.push(row); return json(res, 201, { attendance: row }); }
  if (url.pathname === '/attendance/check-out') { const row = { id: String(attendance.length + 1), type: 'check-out', ...(await read(req)) }; attendance.push(row); return json(res, 201, { attendance: row }); }
  if (url.pathname === '/attendance') return json(res, 200, { data: attendance });
  return json(res, 404, { error: 'not_found' });
}).listen(port, () => console.log(`IcordPro API on ${port}`));
