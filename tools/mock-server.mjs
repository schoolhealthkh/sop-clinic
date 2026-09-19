/* ម៉ាស៊ីនបម្រើត្រាប់តាម — រត់កូដ Apps Script ពិតប្រាកដក្នុង Node
   API   : http://127.0.0.1:8081
   គេហទំព័រ : http://127.0.0.1:8080   (origin ផ្សេងគ្នា ដើម្បីតេស្ត CORS ពិត) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { makeEnv } from './gas-mock.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const env = makeEnv();
const sandbox = Object.assign({ console, Date, Math, JSON, String, Number, Object, Array,
                                RegExp, Error, isNaN, parseInt, parseFloat }, env.globals);
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['Code.gs', 'Seed.gs']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'apps-script', f), 'utf8'), sandbox, { filename: f });
}
vm.runInContext('setup();', sandbox);
export const ADMIN_PIN = env.props.ADMIN_PIN;
console.log('mock backend ready · ADMIN_PIN =', ADMIN_PIN);

/* ---------- API (port 8081) ---------- */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST',
  'Cache-Control': 'no-store'
};

const api = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') {           // Apps Script ពិតមិនឆ្លើយតប OPTIONS ទេ
    res.writeHead(405).end(); return;
  }
  const send = out => {
    const body = typeof out === 'string' ? out : (out && out._v) || '';
    const isJs = /^\s*__sopcb/.test(body);
    res.writeHead(200, Object.assign({
      'Content-Type': isJs ? 'text/javascript; charset=utf-8' : 'application/json; charset=utf-8'
    }, CORS));
    res.end(body);
  };
  if (req.method === 'GET') {
    const param = Object.fromEntries(u.searchParams.entries());
    let out;
    try { out = vm.runInContext('doGet', sandbox)({ parameter: param }); }
    catch (err) { out = JSON.stringify({ ok: false, error: String(err.message) }); }
    return send(out);
  }
  if (req.method === 'POST') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      let out;
      try { out = vm.runInContext('doPost', sandbox)({ postData: { contents: raw } }); }
      catch (err) { out = JSON.stringify({ ok: false, error: String(err.message) }); }
      send(out);
    });
    return;
  }
  res.writeHead(405, CORS).end();
});

/* ---------- គេហទំព័រស្ថិត (port 8080) ---------- */
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
                '.js':'text/javascript; charset=utf-8', '.json':'application/json' };
const site = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let p = decodeURIComponent(u.pathname);
  if (p === '/' ) p = '/index.html';
  const file = path.join(ROOT, 'docs', p);
  if (!file.startsWith(path.join(ROOT, 'docs'))) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    let out = buf;
    if (p === '/assets/config.js') {
      out = Buffer.from(String(buf).replace('PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE',
                                            'http://127.0.0.1:8081/'), 'utf8');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
                         'Cache-Control': 'no-store' });
    res.end(out);
  });
});

api.listen(8081, '127.0.0.1');
site.listen(8080, '127.0.0.1');
console.log('site  → http://127.0.0.1:8080');
console.log('api   → http://127.0.0.1:8081');
