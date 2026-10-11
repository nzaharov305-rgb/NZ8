// node render.mjs <workdir> <startFrame> <endFrame> <outDir> <width> <fps> [t1,t2,...]
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
const [, , WD, A, B, OUT, Wd = '1080', FPS = '30', TS = ''] = process.argv;
const root = path.resolve(WD);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;
const soft = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const base = ['--no-sandbox', '--ignore-gpu-blocklist'];
async function open(args) {
  const opts = { args }; if (process.env.CHROME_PATH) opts.executablePath = process.env.CHROME_PATH;
  const br = await chromium.launch(opts);
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: +Wd / 1080 });
  pg.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) console.log('console:', m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/index.html`);
  await pg.waitForFunction('window.ready===true', null, { timeout: 60000 });
  return { br, pg };
}
let ctx;
try { ctx = await open(process.env.SOFTGL ? base.concat(soft) : base); }
catch (e) { console.log('WebGL start failed, retrying with software GL:', e.message); ctx = await open(base.concat(soft)); }
const { br, pg } = ctx;
fs.mkdirSync(OUT, { recursive: true });
const fps = +FPS;
if (TS) {
  for (const t of TS.split(',').map(Number)) { await pg.evaluate(t => window.renderFrame(t), t); await pg.screenshot({ path: `${OUT}/t_${t.toFixed(2).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 88 }); }
} else {
  const t0 = Date.now();
  for (let f = +A; f < +B; f++) {
    await pg.evaluate(t => window.renderFrame(t), f / fps);
    await pg.screenshot({ path: `${OUT}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    if (f % 60 == 0) console.log(`frame ${f}/${B}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
await br.close(); srv.close();
