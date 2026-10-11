// Generic 3D explainer engine: reads plan.json (built by build.py from spec.json) and exposes window.renderFrame(t)
import * as THREE from './node_modules/three/build/three.module.js';
const W = 1080, H = 1920;
const PLAN = await (await fetch('plan.json')).json();
await Promise.all(['800 40px Montserrat', '900 40px Montserrat', '700 40px JBM'].map(f => document.fonts.load(f, 'АБВабв abc 0123 ✓✕∅')));

const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
const eob = u => { u = cl(u); const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const eout = u => 1 - Math.pow(1 - cl(u), 3);
const seg = (t, a, b) => cl((t - a) / (b - a));
const col = c => new THREE.Color(c || '#ffffff');

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#070a14');
scene.fog = new THREE.Fog('#070a14', 30, 80);
const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 140);
scene.add(new THREE.AmbientLight(0xaab8ff, 0.7));
const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(4, 9, 8); scene.add(dl);
const grid = new THREE.GridHelper(600, 300, 0x22357a, 0x121b40); grid.position.y = -4.3; scene.add(grid);
{ let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = new THREE.BufferGeometry(); const n = 600, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i * 3] = rnd() * 300 - 20; p[i * 3 + 1] = rnd() * 14 - 3; p[i * 3 + 2] = -6 - rnd() * 14; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x6f86d8, size: 0.06 }))); }

const bb = [], ups = [];
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const STYLES = {
  plain: {}, good: { color: '#fff', bg: 'rgba(61,220,132,.25)', border: '#3DDC84' }, bad: { color: '#fff', bg: 'rgba(255,90,78,.22)', border: '#FF5A4E' },
  info: { color: '#fff', bg: 'rgba(77,208,255,.22)', border: '#4DD0FF' }, warn: { color: '#0b1020', bg: '#FFD43B' }, accent: { color: '#fff', bg: '#3b6bff' },
  green: { color: '#0b1020', bg: '#3DDC84' }, purple: { color: '#fff', bg: 'rgba(155,123,255,.28)', border: '#9B7BFF' },
  stamp: { color: '#FF5A4E', bg: 'rgba(7,10,20,.88)', border: '#FF5A4E', bw: 16, glow: '#FF5A4E' },
  note: { color: '#7f8fb8', fam: 'JBM', font: '700' }, mono: { fam: 'JBM', font: '700' },
};
// auto-sized text plate (billboard)
function mkLabel(text, o = {}) {
  o = Object.assign({}, STYLES[o.style] || {}, o);
  const s = o.size || 0.34, ppu = 200, fam = o.fam || 'Montserrat', weight = o.font || '800';
  const boxed = !!(o.bg || o.border);
  const meas = document.createElement('canvas').getContext('2d');
  const lines = () => String(m.userData.txt).split('\n');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false }));
  m.userData.txt = text;
  const c = document.createElement('canvas'); const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4; m.material.map = tex;
  let fixedW = null;
  const draw = (txt) => {
    m.userData.txt = txt; const ls = lines(); const fs = s * ppu;
    meas.font = `${weight} ${fs}px ${fam}`;
    const tw = Math.max(...ls.map(l => meas.measureText(l).width));
    let cw = Math.ceil(tw + (boxed ? fs * 1.6 : fs * 0.5)), ch = Math.ceil(ls.length * fs * 1.18 + (boxed ? fs * 0.9 : fs * 0.4));
    if (o.minW) cw = Math.max(cw, o.minW * ppu);
    if (fixedW && o.lockW) cw = fixedW; fixedW = fixedW || cw;
    c.width = cw; c.height = ch;
    if (boxed) { if (o.bg) { ctx.fillStyle = o.bg; rr(ctx, 6, 6, cw - 12, ch - 12, Math.min(ch / 2.6, 50)); ctx.fill(); } if (o.border) { ctx.lineWidth = o.bw || 8; ctx.strokeStyle = o.border; rr(ctx, 6, 6, cw - 12, ch - 12, Math.min(ch / 2.6, 50)); ctx.stroke(); } }
    ctx.fillStyle = o.color || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${weight} ${fs}px ${fam}`;
    const lh = fs * 1.18, y0 = ch / 2 - (ls.length - 1) * lh / 2;
    ls.forEach((l, i) => { if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 24; } ctx.fillText(l, cw / 2, y0 + i * lh); });
    ctx.shadowBlur = 0; tex.needsUpdate = true; m.scale.set(cw / ppu, ch / ppu, 1); m.userData.base = [cw / ppu, ch / ppu];
  };
  draw(text); m.userData.set = draw; m.userData.rot = o.rot || 0; bb.push(m); return m;
}
// visibility helpers (scale-based pop)
function setS(o, k) { if (o.userData.base) o.scale.set(o.userData.base[0] * k, o.userData.base[1] * k, 1); else o.scale.setScalar(k * (o.userData.k || 1)); }
function appear(o, t0, t1, t) {
  o.visible = t >= t0 && (t1 == null || t < t1 + 0.3); if (!o.visible) return;
  let k = t - t0 < 0.38 ? Math.max(0.001, eob((t - t0) / 0.38)) : 1;
  if (t1 != null && t >= t1) k *= 1 - cl((t - t1) / 0.3);
  setS(o, Math.max(0.001, k));
}
function fly(o, d, t) { // d.pos -> d.to over d.dur starting t0
  if (!d.to) return; const u = d.dur ? seg(t, d.t0, d.t0 + d.dur) : 1; const e = sm(u); const a = d.pos, b = d.to;
  o.position.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e) + Math.sin(u * Math.PI) * (d.arc ?? 0.6), lerp(a[2] ?? 0.4, b[2] ?? 0.4, e));
}
function mat(c, em = 0.45) { return new THREE.MeshStandardMaterial({ color: col(c), emissive: col(c), emissiveIntensity: em, roughness: 0.4, metalness: 0.3 }); }
function basic(c, op = 1) { return new THREE.MeshBasicMaterial({ color: col(c), transparent: op < 1, opacity: op, depthWrite: op >= 1, fog: false }); }
function phoneScreen(sc = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const x = c.getContext('2d');
  x.fillStyle = sc.bg || '#0d1430'; x.fillRect(0, 0, 512, 1024); x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const it of sc.items || []) {
    if (it.card) { x.fillStyle = it.color || '#1d2b60'; rr(x, 34, it.y, 444, it.h || 110, 28); x.fill(); }
    if (it.circle) { x.fillStyle = it.color || '#3DDC84'; x.beginPath(); x.arc(256, it.y, it.r || 110, 0, 7); x.fill(); }
    if (it.text != null) { x.fillStyle = it.textColor || it.color || '#fff'; if (it.card || it.circle) x.fillStyle = it.textColor || '#fff'; x.font = `${it.font === 'mono' ? '700' : '800'} ${it.size || 48}px ${it.font === 'mono' ? 'JBM' : 'Montserrat'}`; x.fillText(it.text, 256, it.card ? it.y + (it.h || 110) / 2 : it.y); }
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function mkPhone(sc) {
  const g = new THREE.Group(); const s = new THREE.Shape(); const w = 1.3, h = 2.6, r = 0.22;
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x2a3558, emissive: 0x0a1030, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.3 })); body.position.z = -0.07; g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 2.44), new THREE.MeshBasicMaterial({ map: phoneScreen(sc), fog: false })); scr.position.z = 0.075; g.add(scr);
  return g;
}
function mkKey(c) {
  const g = new THREE.Group(); const m = mat(c, 0.55);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 14, 28), m); head.position.x = -0.55; g.add(head);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.15, 12), m); sh.rotation.z = Math.PI / 2; sh.position.x = 0.1; g.add(sh);
  for (const x of [0.45, 0.7]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), m); t.position.set(x, -0.18, 0); g.add(t); }
  return g;
}
function mkBill() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.03), mat('#2fbf6a', 0.5))); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.035), mat('#b7ffd3', 0.4))); return g; }
function mkFace(c) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 40), basic(c))); for (const x of [-0.18, 0.18]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), basic(c)); e.position.set(x, 0.12, 0); g.add(e); } const m = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20, Math.PI), basic(c)); m.rotation.z = Math.PI; m.position.y = -0.12; g.add(m); return g; }
function mkFinger(c) { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.12 + i * 0.1, 0.025, 8, 36, Math.PI * 1.5), basic(c)); r.rotation.z = i; g.add(r); } return g; }

const stations = PLAN.stations.map((st, i) => { const g = new THREE.Group(); g.position.x = i * 26; scene.add(g); return g; });
const P = (p, z = 0) => [p?.[0] ?? 0, p?.[1] ?? 0, p?.[2] ?? z];
let seq = 0;
PLAN.stations.forEach((st, si) => {
  const G = stations[si];
  for (const d of st.objs) {
    const k = seq++; const pos = P(d.pos, ['label', 'timer', 'check', 'cross'].includes(d.type) ? 0.5 : 0); d.pos = pos; if (d.to) d.to = P(d.to, pos[2]);
    const sc = d.scale || 1;
    let o;
    switch (d.type) {
      case 'label': case 'check': case 'cross': {
        const txt = d.type === 'check' ? '✓' : d.type === 'cross' ? '✕' : d.text;
        const opt = d.type === 'label' ? d : { size: 0.9 * sc, color: d.type === 'check' ? '#3DDC84' : '#FF5A4E', glow: d.type === 'check' ? '#3DDC84' : '#FF5A4E' };
        o = mkLabel(txt, Object.assign({ size: 0.34 * sc }, opt)); o.position.set(...pos); G.add(o);
        ups.push(t => { appear(o, d.t0, d.t1, t); if (d.style === 'stamp' && t >= d.t0) setS(o, (t - d.t0 < 0.25 ? Math.max(0.001, eob((t - d.t0) / 0.25)) : 1) * (1 + Math.max(0, 0.3 - (t - d.t0) * 1.5) * 0.5)); fly(o, d, t); });
        break; }
      case 'timer': {
        o = mkLabel('00:00', { size: 0.62 * sc, color: d.color || '#FF5A4E', fam: 'JBM', font: '700', glow: d.color || '#FF5A4E', lockW: true }); o.position.set(...pos); G.add(o);
        const [mm, ss] = (d.end || '02:59').split(':').map(Number); const tot = mm * 60 + ss;
        ups.push(t => { const u = seg(t, d.t0, d.t1 ?? d.t0 + 2); const v = Math.round(u * tot); o.userData.set(String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0')); o.visible = t >= (d.show ?? 0) && (d.hide == null || t < d.hide); if (o.visible) setS(o, 1); });
        break; }
      case 'phone': {
        o = mkPhone(d.screen); o.userData.k = sc; o.position.set(...pos); G.add(o);
        ups.push(t => { if (d.t0 > 0.01 || d.t1 != null) appear(o, d.t0, d.t1, t); else { o.visible = true; o.scale.setScalar(sc); } if (!d.still) o.rotation.y = Math.sin(t * 0.9 + k) * 0.25; if (d.shake && t > d.shake[0] && t < d.shake[1]) o.rotation.z = Math.sin(t * 9) * 0.03; else o.rotation.z = 0; fly(o, d, t); });
        break; }
      case 'orb': {
        const geo = d.shape === 'octa' ? new THREE.OctahedronGeometry(0.75) : d.shape === 'box' ? new THREE.BoxGeometry(1.1, 0.8, 0.8) : new THREE.SphereGeometry(0.55, 24, 18);
        o = new THREE.Mesh(geo, mat(d.color || '#ff9f43')); o.userData.k = sc; o.position.set(...pos); G.add(o);
        ups.push(t => { appear(o, d.t0, d.t1, t); if (d.shape === 'octa') o.rotation.y = t * 1.5; fly(o, d, t); });
        break; }
      case 'key': case 'packet': case 'face': case 'fingerprint': {
        o = d.type === 'key' ? mkKey(d.color || '#FFD43B') : d.type === 'packet' ? new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), mat(d.color || '#FFD43B', 0.8)) : d.type === 'face' ? mkFace(d.color || '#4DD0FF') : mkFinger(d.color || '#9B7BFF');
        o.userData.k = sc; o.position.set(...pos); G.add(o);
        ups.push(t => { appear(o, d.t0, d.t1, t); if (d.type === 'key' || d.type === 'packet') o.rotation.y = t * (d.spin ?? 1.5); fly(o, d, t); if (d.vanish && d.to && t > d.t0 + (d.dur || 0)) o.visible = false; });
        break; }
      case 'link': {
        o = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8), basic(d.color || '#ff9f43', 0.8)); G.add(o);
        const A = new THREE.Vector3(...pos), B = new THREE.Vector3(...(d.to || pos));
        ups.push(t => { const u = eout(seg(t, d.t0, d.t0 + 0.6)); const dd = B.clone().sub(A); o.position.copy(A).addScaledVector(dd, u / 2); o.scale.set(1, Math.max(0.001, dd.length() * u), 1); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dd.normalize()); o.visible = u > 0 && (d.t1 == null || t < d.t1); });
        break; }
      case 'bills': {
        const n = d.n || 12, gap = d.gap ?? 0.1, dur = d.dur ?? 1.1, list = [];
        for (let i = 0; i < n; i++) { const b = mkBill(); G.add(b); list.push(b); }
        const tgt = d.to || [pos[0] + 4, pos[1] + 5, -3];
        ups.push(t => list.forEach((b, i) => { const t0 = d.t0 + i * gap; const u = seg(t, t0, t0 + dur); b.visible = t >= t0 && t <= t0 + dur + 0.05; const spread = d.spread ?? 3; const bx = tgt[0] + (i % 2 ? 1 : -1) * (i % 3) * spread / 3, by = tgt[1] + (i % 4) * 0.4, bz = tgt[2] - (i % 5) * 0.3; b.position.set(lerp(pos[0], bx, u), lerp(pos[1], by, u) + Math.sin(u * Math.PI) * 0.6, lerp(pos[2], bz, u)); b.rotation.set(t * 2 + i, t * 3, i); }));
        break; }
      case 'rings': {
        const n = d.n || 5, list = [];
        for (let i = 0; i < n; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 48), basic(d.color || '#FF5A4E', 0.9)); r.position.set(...pos); G.add(r); list.push(r); }
        ups.push(t => list.forEach((r, i) => { const t0 = d.t0 + i * 0.3; const act = t >= t0 && t < (d.t1 ?? d.t0 + 2); r.visible = act; const u = ((t - t0) % 1) / 1; r.scale.setScalar(0.5 + u * 4 * sc); r.material.opacity = 0.9 * (1 - u); }));
        break; }
      case 'shield': {
        o = new THREE.Mesh(new THREE.SphereGeometry(d.r || 1.7, 28, 20), new THREE.MeshBasicMaterial({ color: col(d.color || '#3DDC84'), transparent: true, opacity: 0.15, wireframe: true, fog: false })); o.position.set(...pos); G.add(o);
        ups.push(t => { o.visible = t >= d.t0 && (d.t1 == null || t < d.t1); const hit = d.hit && t > d.hit[0] && t < d.hit[1]; o.material.opacity = 0.15 + (hit ? 0.35 * Math.abs(Math.sin((t - d.hit[0]) * 12)) : 0); o.rotation.y = t; });
        break; }
      case 'cage': {
        o = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(d.w || 2, d.h || 3.4, d.depth || 1)), new THREE.LineBasicMaterial({ color: col(d.color || '#3DDC84') })); o.position.set(...pos); G.add(o);
        ups.push(t => { o.visible = t >= d.t0 && (d.t1 == null || t < d.t1); o.scale.setScalar(Math.max(0.001, eob(seg(t, d.t0, d.t0 + 0.5)))); });
        break; }
      case 'bar': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.2), new THREE.MeshStandardMaterial({ color: 0x1b2a55 })); base.position.set(pos[0], pos[1] - 0.06, pos[2]); G.add(base);
        o = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), mat(d.color || '#3DDC84', 0.5)); G.add(o);
        const cnt = d.counter ? mkLabel('0', { size: 0.85, color: d.color || '#3DDC84', fam: 'JBM', font: '700', glow: d.color || '#3DDC84' }) : null; if (cnt) G.add(cnt);
        const unit = d.unit ? mkLabel(d.unit, { size: 0.36 }) : null; if (unit) G.add(unit);
        const grow = d.grow ?? 2.2, Hh = d.h || 3.5;
        ups.push(t => { base.visible = t >= d.t0 - 0.3; const u = eout(seg(t, d.t0, d.t0 + grow)); const h = Math.max(0.02, Hh * u); o.visible = t >= d.t0; o.scale.set(1, h, 1); o.position.set(pos[0], pos[1] + h / 2, pos[2]); o.rotation.y = 0.35;
          if (cnt) { const c = d.counter; cnt.userData.set(u >= 0.999 && c.final ? c.final : (c.to * u).toFixed(c.decimals ?? 1).replace('.', c.comma ? ',' : '.')); cnt.position.set(pos[0], pos[1] + h + 0.75, pos[2] + 0.9); appear(cnt, d.t0, null, t); }
          if (unit) { unit.position.set(pos[0], pos[1] + h + 1.6, pos[2] + 0.9); appear(unit, d.t0, null, t); } });
        break; }
    }
  }
});

/* camera */
const CAMS = PLAN.stations.map(s => Object.assign({ d: 13.5, y: 1.2, ox: 1.4, ly: -0.2 }, s.cam || {}));
const SC = PLAN.scenes;
function camAt(i, t) { const c = CAMS[i]; const x = i * 26; const sway = Math.sin(t * 0.45) * 0.35; return { p: new THREE.Vector3(x + c.ox * 1.3 + sway, c.y + Math.sin(t * 0.6) * 0.15, c.d * 1.3), l: new THREE.Vector3(x, c.ly - 0.45, 0) }; }
const N = PLAN.stations.length;
function sceneIdx(t) { for (let k = 0; k < N; k++) if (t < SC[k + 1]) return k; return N - 1; }
function setCam(t) {
  const i = sceneIdx(t); const nextT = SC[i + 1]; const a = camAt(i, t); let pos = a.p, look = a.l;
  const TR = 0.9; if (i < N - 1 && t > nextT - TR) { const u = sm((t - (nextT - TR)) / TR); const b = camAt(i + 1, t); pos = a.p.clone().lerp(b.p, u); look = a.l.clone().lerp(b.l, u); pos.y += Math.sin(u * Math.PI) * 0.9; }
  camera.position.copy(pos); camera.lookAt(look);
}

/* overlay */
const hud = document.getElementById('hud'); const NS = PLAN.stages.length;
PLAN.stages.forEach((s, i) => { const d = document.createElement('div'); d.className = 'seg' + (i == NS - 1 ? ' last' : ''); d.textContent = s; hud.appendChild(d); });
document.getElementById('ha').textContent = PLAN.hook.a || ''; document.getElementById('hb').textContent = PLAN.hook.b || '';
document.getElementById('nick').textContent = PLAN.nick || ''; document.getElementById('illus').textContent = PLAN.illus || '';
const subp = document.getElementById('subp'), subw = document.getElementById('sub'), srcEl = document.getElementById('src'), hk = document.getElementById('hook');
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const chunkHtml = PLAN.chunks.map(ch => ch.map(w => `<span class="w${w.k ? ' k' : ''}">${esc(w.w)}</span>`).join(' '));
let lastChunk = -2;
function overlay(t) {
  const si = sceneIdx(t), stg = PLAN.stageOfScene[si];
  [...hud.children].forEach((d, i) => { d.className = 'seg' + (i == NS - 1 ? ' last' : '') + (i == stg ? ' on' : (i < stg ? ' done' : '')); });
  hk.style.opacity = t < PLAN.hook.out ? 1 : Math.max(0, 1 - (t - PLAN.hook.out) / 0.3); hk.style.transform = `scale(${t < 0.4 ? 0.9 + 0.1 * eob(t / 0.4) : 1})`;
  let ci = -1; for (let i = 0; i < PLAN.chunks.length; i++) { const ch = PLAN.chunks[i]; if (t >= ch[0].s - 0.04 && t < ch[ch.length - 1].e + 0.35) ci = i; }
  if (ci !== lastChunk) { subp.style.fontSize = ''; subp.innerHTML = ci >= 0 ? chunkHtml[ci] : ''; lastChunk = ci; if (ci >= 0) { const w0 = subp.getBoundingClientRect().width; if (w0 > 900) subp.style.fontSize = Math.floor(62 * 880 / w0) + 'px'; } }
  subw.style.opacity = ci >= 0 ? 1 : 0;
  if (ci >= 0) { const ch = PLAN.chunks[ci]; [...subp.children].forEach((e, i) => e.classList.toggle('s', t >= ch[i].s - 0.02)); }
  const S = PLAN.source; const on = S && S.text && t > S.from && t < S.to; srcEl.textContent = on ? S.text : ''; srcEl.style.opacity = on ? 1 : 0;
}
const qz = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
window.renderFrame = (t) => {
  ups.forEach(f => f(t)); setCam(t);
  bb.forEach(m => { m.quaternion.copy(camera.quaternion); if (m.userData.rot) m.quaternion.multiply(qz.setFromAxisAngle(zAxis, m.userData.rot)); });
  renderer.render(scene, camera); overlay(t);
};
renderFrame(0);
window.ready = true;
