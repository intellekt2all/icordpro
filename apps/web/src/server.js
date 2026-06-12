import http from 'node:http';

const port = Number(process.env.WEB_PORT || 3000);
const cookieName = 'icordpro_session';

function hasSession(req) {
  return (req.headers.cookie || '').split(';').map((item) => item.trim()).includes(`${cookieName}=demo-session`);
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { location, ...headers });
  res.end();
}

function page(title, body) {
  return `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin:0; font-family: Arial, sans-serif; background:#0f172a; color:#e5e7eb; }
    main { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
    .card { background:#111827; border:1px solid #334155; border-radius:20px; padding:24px; margin-top:20px; }
    a { color:#93c5fd; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function html(res, title, body) {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page(title, body));
}

http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/') return redirect(res, hasSession(req) ? '/dashboard' : '/login');

  if (url.pathname === '/login') {
    if (hasSession(req)) return redirect(res, '/dashboard');
    return html(res, 'IcordPro Login', `
      <h1>IcordPro Login</h1>
      <section class="card">
        <p>Starter login page. Use /login/demo for local demo session.</p>
        <a href="/login/demo">Demo login</a>
      </section>
    `);
  }

  if (url.pathname === '/login/demo') {
    return redirect(res, '/dashboard', { 'set-cookie': `${cookieName}=demo-session; Path=/; HttpOnly; SameSite=Lax` });
  }

  if (url.pathname === '/logout') {
    return redirect(res, '/login', { 'set-cookie': `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` });
  }

  if (url.pathname === '/dashboard') {
    if (!hasSession(req)) return redirect(res, '/login');
    return html(res, 'IcordPro Dashboard', `
      <h1>IcordPro Dashboard</h1>
      <p>Protected dashboard is available only with a valid starter session.</p>
      <section class="card"><a href="/logout">Logout</a></section>
    `);
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}).listen(port, () => console.log(`IcordPro web on ${port}`));
