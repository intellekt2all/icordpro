import http from 'node:http';

const port = Number(process.env.WEB_PORT || 3000);
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

const html = `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IcordPro Local Preview</title>
  <style>
    body { margin:0; font-family: Arial, sans-serif; background:#0f172a; color:#e5e7eb; }
    main { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; }
    .card { background:#111827; border:1px solid #334155; border-radius:20px; padding:20px; margin-top:16px; }
    .hero { border-color:#6366f1; }
    input, select, button { width:100%; box-sizing:border-box; padding:12px; margin-top:8px; border-radius:12px; border:1px solid #475569; }
    button { cursor:pointer; font-weight:700; }
    .primary { background:#4f46e5; color:white; border-color:#4f46e5; }
    pre { white-space:pre-wrap; background:#020617; border-radius:12px; padding:12px; min-height:80px; }
    .muted { color:#94a3b8; }
  </style>
</head>
<body>
<main>
  <h1>IcordPro MVP</h1>
  <p class="muted">Local preview. API: <span id="apiBase"></span></p>
  <section class="card hero">
    <h2>Eng oson kirish</h2>
    <p class="muted">Registratsiyani bilmasangiz, shu tugmani bosing. Demo user avtomatik yaratiladi va tizimga kiradi.</p>
    <button class="primary" onclick="quickDemo()">Demo userni yaratish va kirish</button>
  </section>
  <div class="grid">
    <section class="card">
      <h2>Manual Register / Login</h2>
      <input id="name" placeholder="Name" value="Demo Owner" />
      <input id="email" placeholder="Email" value="demo@local.test" />
      <input id="secret" placeholder="Secret" value="demo-secret-123" type="password" />
      <select id="role"><option>OWNER</option><option>ADMIN</option><option>MANAGER</option><option>EMPLOYEE</option></select>
      <button onclick="registerUser()">Register</button>
      <button onclick="loginUser()">Login</button>
      <button onclick="logoutUser()">Logout</button>
    </section>
    <section class="card">
      <h2>Session</h2>
      <button onclick="loadMe()">Load /me</button>
      <pre id="sessionBox">No session yet</pre>
    </section>
  </div>
  <div class="grid">
    <section class="card">
      <h2>Tasks</h2>
      <input id="taskTitle" placeholder="Task title" value="First real task" />
      <button onclick="createTask()">Create task</button>
      <button onclick="listTasks()">List tasks</button>
      <pre id="taskBox">No tasks loaded</pre>
    </section>
    <section class="card">
      <h2>Timeclock</h2>
      <input id="deviceId" placeholder="Device ID" value="browser-preview" />
      <button onclick="checkIn()">Check in</button>
      <button onclick="checkOut()">Check out</button>
      <button onclick="listTime()">List time entries</button>
      <pre id="timeBox">No time entries loaded</pre>
    </section>
  </div>
  <section class="card">
    <h2>Audit</h2>
    <button onclick="loadAudit()">Load audit log</button>
    <pre id="auditBox">No audit loaded</pre>
  </section>
</main>
<script>
const API_BASE_URL = '${apiBaseUrl}';
document.getElementById('apiBase').textContent = API_BASE_URL;
function token() { return localStorage.getItem('icordpro_session') || ''; }
function headers() { return { 'content-type': 'application/json', ...(token() ? { authorization: 'Bearer ' + token() } : {}) }; }
function out(id, data) { document.getElementById(id).textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2); }
async function api(path, options = {}) {
  const res = await fetch(API_BASE_URL + path, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
async function quickDemo() {
  name.value = 'Demo Owner';
  email.value = 'demo@local.test';
  secret.value = 'demo-secret-123';
  role.value = 'OWNER';
  try {
    await api('/auth/register', { method:'POST', body: JSON.stringify({ name: name.value, email: email.value, secret: secret.value, role: role.value }) });
    const data = await api('/auth/login', { method:'POST', body: JSON.stringify({ email: email.value, secret: secret.value }) });
    localStorage.setItem('icordpro_session', data.session);
    out('sessionBox', { message: 'Demo user ready. You are logged in.', user: data.user });
  } catch (e) { out('sessionBox', e); }
}
async function registerUser() {
  try {
    const data = await api('/auth/register', { method:'POST', body: JSON.stringify({ name: name.value, email: email.value, secret: secret.value, role: role.value }) });
    out('sessionBox', data);
  } catch (e) { out('sessionBox', e); }
}
async function loginUser() {
  try {
    const data = await api('/auth/login', { method:'POST', body: JSON.stringify({ email: email.value, secret: secret.value }) });
    localStorage.setItem('icordpro_session', data.session);
    out('sessionBox', data);
  } catch (e) { out('sessionBox', e); }
}
async function logoutUser() {
  try { await api('/auth/logout'); } catch {}
  localStorage.removeItem('icordpro_session');
  out('sessionBox', 'Logged out');
}
async function loadMe() { try { out('sessionBox', await api('/me')); } catch (e) { out('sessionBox', e); } }
async function createTask() { try { out('taskBox', await api('/tasks', { method:'POST', body: JSON.stringify({ title: taskTitle.value, status:'todo', priority:'medium' }) })); } catch (e) { out('taskBox', e); } }
async function listTasks() { try { out('taskBox', await api('/tasks')); } catch (e) { out('taskBox', e); } }
async function checkIn() { try { out('timeBox', await api('/attendance/check-in', { method:'POST', body: JSON.stringify({ deviceId: deviceId.value }) })); } catch (e) { out('timeBox', e); } }
async function checkOut() { try { out('timeBox', await api('/attendance/check-out', { method:'POST', body: JSON.stringify({ deviceId: deviceId.value }) })); } catch (e) { out('timeBox', e); } }
async function listTime() { try { out('timeBox', await api('/attendance')); } catch (e) { out('timeBox', e); } }
async function loadAudit() { try { out('auditBox', await api('/audit-log')); } catch (e) { out('auditBox', e); } }
</script>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => console.log(`IcordPro web on ${port}`));
