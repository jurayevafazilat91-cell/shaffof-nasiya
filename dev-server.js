// Lokal ishga tushirish (Vercel'siz): /api/* → lib/routes, qolgani → public/
// Ishga tushirish: npm run dev  (o‘zgaruvchilar .env faylidan olinadi)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handler } = require('./lib/routes');

const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
const PORT = Number(process.env.PORT) || 3000;

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return handler(req, res);
  const file = path.join(PUBLIC, path.normalize(decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(PUBLIC + path.sep)) { res.statusCode = 403; return res.end(); }
  fs.readFile(path.extname(file) ? file : path.join(PUBLIC, 'index.html'), (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Topilmadi'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || TYPES['.html']);
    res.end(data);
  });
}).listen(PORT, () => console.log(`Shaffof Nasiya: http://localhost:${PORT}`));
