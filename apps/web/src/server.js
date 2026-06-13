import http from 'node:http';

const port = Number(process.env.PORT || process.env.WEB_PORT || 3000);
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

const html = `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IcordPro Staging</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, sans-serif; background:#0f172a; color:#e5e7eb; }
    main { max-width: 1180px; margin: 0 auto; padding: 28px 18px 60px; }
    header { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:18px; }
    h1, h2, h3 { margin:0 0 12px; }
    p { line-height:1.55; }
    .muted { color:#94a3b8; }
    .small { font-size:12px; }
    .pill { display:inline-flex; align-items:center; gap:6px; border:1px solid #475569; border-radius:999px; padding:6px 10px; color:#cbd5e1; font-size:12px; }
    .pill.ok { border-color:#22c55e; color:#86efac; }
    .pill.warn { border-color:#f59e0b; color:#fcd34d; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap:16px; }
    .card { background:#111827; border:1px solid #334155; border-radius:18px; padding:18px; margin-top:16px; }
    .hero { border-color:#6366f1; background:linear-gradient(135deg, rgba(79,70,229,.22), rgba(17,24,39,1)); }
    label { display:block; margin-top:10px; color:#cbd5e1; font-size:13px; }
    input, select, textarea, button { width:100%; padding:11px; margin-top:7px; border-radius:11px; border:1px solid #475569; font:inherit; }
    input, select, textarea { background:#020617; color:#e5e7eb; }
    button { cursor:pointer; font-weight:700; background:#e5e7eb; color:#111827; }
    button.primary { background:#4f46e5; color:white; border-color:#4f46e5; }
    button.ghost { background:transparent; color:#e5e7eb; }
    button.danger { background:#7f1d1d; color:white; border-color:#991b1b; }
    .actions { display:flex; gap:8px; flex-wrap:wrap; }
    .actions button { width:auto; min-width:130px; }
    .status-line { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:10px; }
    .list { display:grid; gap:10px; margin-top:12px; }
    .row { border:1px solid #334155; background:#020617; border-radius:14px; padding:12px; }
    .row-head { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
    .row-title { font-weight:700; }
    .tag { border:1px solid #475569; color:#cbd5e1; border-radius:999px; padding:4px 8px; font-size:12px; white-space:nowrap; }
    .tag.high { border-color:#f97316; color:#fdba74; }
    .tag.medium { border-color:#a78bfa; color:#ddd6fe; }
    .tag.low { border-color:#22c55e; color:#86efac; }
    .empty { border:1px dashed #475569; color:#94a3b8; border-radius:14px; padding:18px; text-align:center; }
    .toast { position:sticky; top:10px; z-index:5; display:none; margin-bottom:12px; border-radius:14px; padding:12px 14px; border:1px solid #475569; background:#020617; }
    .toast.show { display:block; }
    .toast.error { border-color:#ef4444; color:#fecaca; }
    .toast.ok { border-color:#22c55e; color:#bbf7d0; }
    pre { white-space:pre-wrap; background:#020617; border-radius:12px; padding:12px; min-height:80px; overflow:auto; }
    nav { display:flex; gap:8px; flex-wrap:wrap; margin:16px 0; }
    nav a { color:#cbd5e1; border:1px solid #334155; border-radius:999px; padding:8px 12px; text-decoration:none; }
    nav a:hover { border-color:#818cf8; }
    @media (max-width: 700px) { header { display:block; } .actions button { width:100%; } }
  </style>
</head>
<body>
<main>
  <div id="toast" class="toast"></div>
  <header>
    <div>
      <h1>IcordPro Staging</h1>
      <p class="muted">MVP internetda ishlayapti. Bu sahifa real staging test uchun: auth, vazifa, davomat va audit.</p>
      <div class="status-line">
        <span class="pill ok">API: <span id="apiBase"></span></span>
        <span class="pill warn">Free Render instance — birinchi yuklanish sekin bo'lishi mumkin</span>
      </div>
    </div>
    <div class="card" style="margin-top:0; min-width:260px;">
      <h3>Staging checklist</h3>
      <p class="small muted">Har deploydan keyin: login, task, timeclock, audit ishlashini tekshiring.</p>
      <button class="ghost" onclick="loadMe()">Sessionni tekshirish</button>
    </div>
  </header>

  <nav>
    <a href="#auth">Auth</a>
    <a href="#tasks">Tasks</a>
    <a href="#attendance">Attendance</a>
    <a href="#audit">Audit</a>
  </nav>

  <section id="auth" class="card hero">
    <h2>Eng oson kirish</h2>
    <p class="muted">Demo userni avtomatik yaratadi va tizimga kiradi. Real mijozlarga ko'rsatishdan oldin oddiy login/register ekraniga almashtiriladi.</p>
    <div class="actions">
      <button class="primary" onclick="quickDemo()">Demo userni yaratish va kirish</button>
      <button class="ghost" onclick="logoutUser()">Logout</button>
    </div>
  </section>

  <div class="grid">
    <section class="card">
      <h2>Manual login/register</h2>
      <label>Ism</label>
      <input id="name" placeholder="Name" value="Demo Owner" />
      <label>Email</label>
      <input id="email" placeholder="Email" value="demo@local.test" />
      <label>Parol / secret</label>
      <input id="secret" placeholder="Secret" value="demo-secret-123" type="password" />
      <label>Rol</label>
      <select id="role"><option>OWNER</option><option>ADMIN</option><option>MANAGER</option><option>EMPLOYEE</option></select>
      <div class="actions" style="margin-top:10px;">
        <button onclick="registerUser()">Register</button>
        <button onclick="loginUser()">Login</button>
      </div>
    </section>
    <section class="card">
      <h2>Session</h2>
      <div id="sessionBox" class="empty">Hali session yuklanmagan</div>
    </section>
  </div>

  <section id="tasks" class="card">
    <div class="row-head">
      <div>
        <h2>Tasks</h2>
        <p class="muted">MVP vazifalar: yaratish, ro'yxatlash va filterlash.</p>
      </div>
      <button style="width:auto;" onclick="listTasks()">Ro'yxatni yangilash</button>
    </div>
    <div class="grid">
      <div>
        <label>Vazifa nomi</label>
        <input id="taskTitle" placeholder="Task title" value="First real task" />
      </div>
      <div>
        <label>Prioritet</label>
        <select id="taskPriority"><option value="medium">medium</option><option value="high">high</option><option value="low">low</option></select>
      </div>
      <div>
        <label>Status</label>
        <select id="taskStatus"><option value="todo">todo</option><option value="in-progress">in-progress</option><option value="done">done</option></select>
      </div>
    </div>
    <label>Izoh</label>
    <textarea id="taskDescription" placeholder="Task description"></textarea>
    <div class="actions" style="margin-top:10px;">
      <button class="primary" onclick="createTask()">Vazifa yaratish</button>
      <button onclick="listTasks('todo')">Faqat todo</button>
      <button onclick="listTasks('done')">Faqat done</button>
      <button onclick="listTasks()">Barchasi</button>
    </div>
    <div id="taskBox" class="list"><div class="empty">Vazifalar hali yuklanmagan</div></div>
  </section>

  <section id="attendance" class="card">
    <div class="row-head">
      <div>
        <h2>Attendance</h2>
        <p class="muted">Oddiy check-in/check-out. Face ID va geolocation keyingi bosqichda.</p>
      </div>
      <button style="width:auto;" onclick="listTime()">Ro'yxatni yangilash</button>
    </div>
    <label>Device ID</label>
    <input id="deviceId" placeholder="Device ID" value="browser-preview" />
    <div class="actions" style="margin-top:10px;">
      <button class="primary" onclick="checkIn()">Check in</button>
      <button onclick="checkOut()">Check out</button>
      <button onclick="listTime()">Time entries</button>
    </div>
    <div id="timeBox" class="list"><div class="empty">Davomat hali yuklanmagan</div></div>
  </section>

  <section id="audit" class="card">
    <div class="row-head">
      <div>
        <h2>Audit</h2>
        <p class="muted">Auth, task va attendance amallari auditga yoziladi.</p>
      </div>
      <button style="width:auto;" onclick="loadAudit()">Auditni yuklash</button>
    </div>
    <div id="auditBox" class="list"><div class="empty">Audit hali yuklanmagan</div></div>
  </section>
</main>
<script>
const API_BASE_URL = '${apiBaseUrl}';
document.getElementById('apiBase').textContent = API_BASE_URL;
function token() { return localStorage.getItem('icordpro_session') || ''; }
function headers() { return { 'content-type': 'application/json', ...(token() ? { authorization: 'Bearer ' + token() } : {}) }; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, function(ch) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
function niceDate(value) { try { return value ? new Date(value).toLocaleString() : '-'; } catch { return value || '-'; } }
function toast(message, type = 'ok') { const el = document.getElementById('toast'); el.className = 'toast show ' + type; el.textContent = message; setTimeout(() => { el.className = 'toast'; }, 3600); }
function renderBox(id, html) { document.getElementById(id).innerHTML = html; }
async function api(path, options = {}) {
  const res = await fetch(API_BASE_URL + path, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
function renderSession(data) {
  const user = data.user || data;
  renderBox('sessionBox', '<div class="row"><div class="row-head"><div><div class="row-title">' + escapeHtml(user.name || 'User') + '</div><div class="muted small">' + escapeHtml(user.email || '') + '</div></div><span class="tag">' + escapeHtml(user.role || '-') + '</span></div><p class="small muted">Tenant: ' + escapeHtml(user.tenantId || '-') + '</p></div>');
}
async function quickDemo() {
  name.value = 'Demo Owner'; email.value = 'demo@local.test'; secret.value = 'demo-secret-123'; role.value = 'OWNER';
  try {
    await api('/auth/register', { method:'POST', body: JSON.stringify({ name: name.value, email: email.value, secret: secret.value, role: role.value }) });
    const data = await api('/auth/login', { method:'POST', body: JSON.stringify({ email: email.value, secret: secret.value }) });
    localStorage.setItem('icordpro_session', data.session);
    renderSession(data);
    toast('Demo user tayyor. Tizimga kirildi.');
    await listTasks();
  } catch (e) { toast(e.error || e.message || 'Demo login xatosi', 'error'); }
}
async function registerUser() {
  try {
    const data = await api('/auth/register', { method:'POST', body: JSON.stringify({ name: name.value, email: email.value, secret: secret.value, role: role.value }) });
    toast('User yaratildi. Endi login qiling.');
    renderSession({ user: data.user });
  } catch (e) { toast(e.error || e.message || 'Register xatosi', 'error'); }
}
async function loginUser() {
  try {
    const data = await api('/auth/login', { method:'POST', body: JSON.stringify({ email: email.value, secret: secret.value }) });
    localStorage.setItem('icordpro_session', data.session);
    renderSession(data);
    toast('Login muvaffaqiyatli.');
    await listTasks();
  } catch (e) { toast(e.error || e.message || 'Login xatosi', 'error'); }
}
async function logoutUser() {
  try { await api('/auth/logout'); } catch {}
  localStorage.removeItem('icordpro_session');
  renderBox('sessionBox', '<div class="empty">Logout qilindi</div>');
  toast('Session yopildi.');
}
async function loadMe() { try { renderSession(await api('/me')); } catch (e) { toast(e.error || e.message || 'Session topilmadi', 'error'); } }
function renderTasks(items) {
  if (!items.length) return renderBox('taskBox', '<div class="empty">Vazifa yo‘q</div>');
  renderBox('taskBox', items.map(function(task) {
    return '<div class="row"><div class="row-head"><div><div class="row-title">' + escapeHtml(task.title) + '</div><div class="small muted">' + escapeHtml(task.description || 'Izoh yo‘q') + '</div></div><span class="tag ' + escapeHtml(task.priority) + '">' + escapeHtml(task.priority) + '</span></div><div class="status-line"><span class="tag">' + escapeHtml(task.status) + '</span><span class="small muted">' + niceDate(task.createdAt) + '</span></div></div>';
  }).join(''));
}
async function createTask() {
  try {
    await api('/tasks', { method:'POST', body: JSON.stringify({ title: taskTitle.value, description: taskDescription.value, status: taskStatus.value, priority: taskPriority.value }) });
    toast('Vazifa yaratildi.');
    await listTasks();
  } catch (e) { toast(e.error || e.message || 'Task yaratish xatosi', 'error'); }
}
async function listTasks(status) {
  try {
    const suffix = status ? '?status=' + encodeURIComponent(status) : '';
    const result = await api('/tasks' + suffix);
    renderTasks(result.data || []);
  } catch (e) { toast(e.error || e.message || 'Task ro‘yxati xatosi', 'error'); }
}
function renderTime(items) {
  if (!items.length) return renderBox('timeBox', '<div class="empty">Davomat yozuvi yo‘q</div>');
  renderBox('timeBox', items.slice().reverse().map(function(row) {
    return '<div class="row"><div class="row-head"><div><div class="row-title">' + escapeHtml(row.type) + '</div><div class="small muted">Device: ' + escapeHtml(row.deviceId) + '</div></div><span class="tag ' + (row.late ? 'high' : 'low') + '">' + (row.late ? 'late' : 'ok') + '</span></div><p class="small muted">' + niceDate(row.createdAt) + '</p></div>';
  }).join(''));
}
async function checkIn() { try { await api('/attendance/check-in', { method:'POST', body: JSON.stringify({ deviceId: deviceId.value }) }); toast('Check-in yozildi.'); await listTime(); } catch (e) { toast(e.error || e.message || 'Check-in xatosi', 'error'); } }
async function checkOut() { try { await api('/attendance/check-out', { method:'POST', body: JSON.stringify({ deviceId: deviceId.value }) }); toast('Check-out yozildi.'); await listTime(); } catch (e) { toast(e.error || e.message || 'Check-out xatosi', 'error'); } }
async function listTime() { try { const result = await api('/attendance'); renderTime(result.data || []); } catch (e) { toast(e.error || e.message || 'Davomat ro‘yxati xatosi', 'error'); } }
function renderAudit(items) {
  if (!items.length) return renderBox('auditBox', '<div class="empty">Audit yozuvi yo‘q</div>');
  renderBox('auditBox', items.map(function(row) {
    return '<div class="row"><div class="row-head"><div><div class="row-title">' + escapeHtml(row.action) + '</div><div class="small muted">' + escapeHtml(row.entity) + ' · ' + escapeHtml(row.entityId || '-') + '</div></div><span class="tag">audit</span></div><p class="small muted">' + niceDate(row.createdAt) + '</p></div>';
  }).join(''));
}
async function loadAudit() { try { const result = await api('/audit-log'); renderAudit(result.data || []); } catch (e) { toast(e.error || e.message || 'Audit xatosi', 'error'); } }
loadMe().catch(() => {});
</script>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => console.log(`IcordPro web on ${port}`));
