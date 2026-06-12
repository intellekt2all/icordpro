import http from 'node:http';

const port = Number(process.env.WEB_PORT || 3000);

const html = `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IcordPro MVP</title>
  <style>
    body { margin:0; font-family: Arial, sans-serif; background:#0f172a; color:#e5e7eb; }
    main { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
    .card { background:#111827; border:1px solid #334155; border-radius:20px; padding:24px; margin-top:20px; }
    a { color:#93c5fd; }
  </style>
</head>
<body>
  <main>
    <h1>IcordPro v0.3 Starter</h1>
    <p>Web SaaS MVP skeleton: dashboard, tasks, attendance va protected routes uchun tayyorlanmoqda.</p>
    <section class="card">
      <h2>Sprint 1 gate</h2>
      <p>Deploy faqat local smoke-test o‘tgandan keyin.</p>
    </section>
  </main>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => console.log(`IcordPro web on ${port}`));
