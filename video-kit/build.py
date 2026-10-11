#!/usr/bin/env python3
"""Nyurgun video kit: spec.json -> finished vertical 3D explainer MP4.

  python3 build.py inbox/my_topic.json              # full build (voice via ElevenLabs API)
  python3 build.py spec.json --sheet                # only a contact sheet of frames to check layout
  python3 build.py spec.json --preview              # fast low-res draft video
  python3 build.py spec.json --voice-file v.mp3 --words-file w.json   # use your own audio/timings

Needs: node + npm install (three, playwright), ffmpeg, python3 with numpy (+ requests for ElevenLabs).
Env: ELEVENLABS_API_KEY (voice + word timings), CHROME_PATH (optional), SOFTGL=1 (force software WebGL).
"""
import argparse, json, math, os, re, shutil, subprocess, sys, wave
from pathlib import Path

KIT = Path(__file__).resolve().parent
SR = 44100
# load .env (KEY=VALUE lines) from the kit folder
_env = KIT / '.env'
if _env.exists():
    for _l in _env.read_text().splitlines():
        if '=' in _l and not _l.strip().startswith('#'):
            _k, _v = _l.split('=', 1); os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

def die(msg):
    print('\nERROR:', msg); sys.exit(1)

def run(cmd, **kw):
    print('$', ' '.join(map(str, cmd)) if isinstance(cmd, list) else cmd)
    r = subprocess.run(cmd, **kw)
    if r.returncode != 0: die(f'command failed: {cmd}')
    return r

# ---------------- ElevenLabs ----------------
def eleven_key():
    k = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
    if not k: die('ELEVENLABS_API_KEY is not set. Either export it, or pass --voice-file and --words-file.')
    return k

def tts(text, voice_id, model, out):
    import requests
    r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128',
                      headers={'xi-api-key': eleven_key(), 'Content-Type': 'application/json'},
                      json={'text': text, 'model_id': model}, timeout=600)
    if r.status_code != 200: die(f'ElevenLabs TTS error {r.status_code}: {r.text[:400]}')
    Path(out).write_bytes(r.content)

def scribe(audio, out):
    import requests
    with open(audio, 'rb') as f:
        r = requests.post('https://api.elevenlabs.io/v1/speech-to-text', headers={'xi-api-key': eleven_key()},
                          data={'model_id': 'scribe_v1', 'timestamps_granularity': 'word'},
                          files={'file': (Path(audio).name, f, 'audio/mpeg')}, timeout=600)
    if r.status_code != 200: die(f'ElevenLabs speech-to-text error {r.status_code}: {r.text[:400]}')
    js = r.json()
    words = [w for w in js.get('words', []) if w.get('type', 'word') == 'word']
    Path(out).write_text(json.dumps({'words': words}, ensure_ascii=False))

def audio_dur(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())

# ---------------- anchors ----------------
def norm(s):
    s = s.lower().replace('ё', 'е')
    return re.sub(r'[^0-9a-zа-яәіңғүұқөһ]+', '', s)

class Timeline:
    def __init__(self, words):
        self.w = words
        self.tok = [norm(x['text']) for x in words]
    def t(self, a, field='anchor'):
        if a is None: return None
        if isinstance(a, (int, float)): return float(a)
        a = str(a).strip()
        if re.fullmatch(r'-?\d+(\.\d+)?', a): return float(a)
        m = re.match(r'^(.*?)(?:#(\d+))?(@end)?\s*([+-]\s*\d+(?:\.\d+)?)?$', a)
        phrase, nth, at_end, off = m.group(1), int(m.group(2) or 1), bool(m.group(3)), float((m.group(4) or '0').replace(' ', ''))
        ph = [norm(x) for x in phrase.split()]; ph = [x for x in ph if x]
        if not ph: die(f'empty anchor in {field}: "{a}"')
        hits = 0
        for i in range(len(self.tok) - len(ph) + 1):
            if all(self.tok[i + j] == ph[j] or (j == len(ph) - 1 and self.tok[i + j].startswith(ph[j])) for j in range(len(ph))):
                hits += 1
                if hits == nth:
                    w = self.w[i + len(ph) - 1] if at_end else self.w[i]
                    return round((w['end'] if at_end else w['start']) + off, 3)
        die(f'anchor not found in voiceover ({field}): "{a}". Anchors must be exact words from the voiceover text.')

# ---------------- plan ----------------
CLICKY = {'label', 'phone', 'orb', 'key', 'face', 'fingerprint', 'packet', 'timer'}
def build_plan(spec, words, dur):
    TL = Timeline(words)
    fix = spec.get('subs_fix', {})
    ws = [{'w': fix.get(x['text'], x['text']), 's': x['start'], 'e': x['end']} for x in words]
    keys = [norm(k) for k in spec.get('keywords', [])]
    for x in ws: x['k'] = any(norm(x['w']).startswith(k) for k in keys if k)
    chunks, cur = [], []
    for x in ws:
        cur.append(x)
        if len(cur) >= 3 or re.search(r'[.,:;!?»]$', x['w']): chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    out, i = [], 0
    while i < len(chunks):
        c = chunks[i]
        if len(c) == 1 and len(c[0]['w']) <= 3 and i + 1 < len(chunks): chunks[i + 1] = c + chunks[i + 1]; i += 1; continue
        out.append(c); i += 1
    scenes_spec = spec['scenes']
    bounds = [0.0]
    for k, s in enumerate(scenes_spec[1:], 1):
        b = TL.t(s['start'], f'scenes[{k}].start') - 0.25
        if b <= bounds[-1]: die(f'scene {k} starts before scene {k-1}; check scene start anchors')
        bounds.append(round(b, 3))
    bounds.append(round(dur, 3))
    cues = []
    def cue(t, k, **kw):
        if t is not None and 0 <= t < dur: cues.append(dict(t=round(t, 3), k=k, **kw))
    cue(0.06, 'boom')
    for b in bounds[1:-1]: cue(b - 0.5, 'whoosh')
    stations = []
    for si, s in enumerate(scenes_spec):
        objs = []
        for oi, o in enumerate(s.get('objects', [])):
            d = dict(o); f = f'scenes[{si}].objects[{oi}]'
            if 'type' not in d: die(f'{f}: missing "type"')
            d['t0'] = TL.t(o.get('at', bounds[si]), f + '.at') if o.get('at') is not None else bounds[si]
            d['t1'] = TL.t(o.get('until'), f + '.until') if o.get('until') is not None else None
            if d['type'] == 'timer':
                d['show'] = TL.t(o.get('show', bounds[si]), f + '.show'); d['hide'] = TL.t(o.get('hide'), f + '.hide') if o.get('hide') else bounds[si + 1]
            for key in ('shake', 'hit'):
                if o.get(key): d[key] = [TL.t(o[key][0], f + '.' + key), TL.t(o[key][1], f + '.' + key)]
            for key in ('at', 'until'): d.pop(key, None)
            fx = o.get('fx')
            if fx is None:
                fx = 'chime' if d['type'] == 'check' else 'buzz' if d['type'] == 'cross' else 'thud' if d['type'] == 'bills' else \
                     'boom' if d.get('style') == 'stamp' else 'click' if d['type'] in CLICKY and d['t0'] > bounds[si] + 0.05 else None
            if fx and fx != 'none': cue(d['t0'], fx)
            if o.get('riser'): cue(d['t0'] - float(o['riser']), 'riser', d=float(o['riser']))
            if d['type'] == 'bar':
                g = float(o.get('grow', 2.2)); cue(d['t0'], 'riser', d=g); cue(d['t0'] + g, 'chime')
            objs.append(d)
        stations.append({'cam': s.get('cam', {}), 'objs': objs})
    for c in spec.get('cues', []): cue(TL.t(c['at'], 'cues.at'), c['fx'], d=c.get('d', 0.8))
    cues.sort(key=lambda x: x['t'])
    ded = []
    for c in cues:
        if c['k'] == 'click' and ded and ded[-1]['k'] == 'click' and c['t'] - ded[-1]['t'] < 0.09: continue
        ded.append(c)
    hook = spec.get('hook', {})
    src = spec.get('source')
    plan = {
        'dur': dur, 'nick': spec.get('nick', ''), 'illus': spec.get('illus', 'иллюстрация'),
        'stages': spec['stages'], 'stageOfScene': [s.get('stage', 0) for s in scenes_spec], 'scenes': bounds,
        'hook': {'a': hook.get('a', ''), 'b': hook.get('b', ''), 'out': TL.t(hook.get('out'), 'hook.out') if hook.get('out') else min(3.5, bounds[1])},
        'source': {'text': src['text'], 'from': TL.t(src.get('from', 0), 'source.from'), 'to': TL.t(src.get('to', 10), 'source.to')} if src else None,
        'chunks': out, 'stations': stations, 'cues': ded,
    }
    if len(plan['stageOfScene']) != len(stations): die('scenes/stages mismatch')
    return plan

# ---------------- sound design ----------------
def make_fx(plan, out):
    import numpy as np
    dur = plan['dur'] + 0.8; n = int(dur * SR); L = np.zeros(n); R = np.zeros(n)
    rng = np.random.default_rng(7)
    def add(t, s, g=1.0, pan=0.0):
        i = int(t * SR)
        if i < 0: s = s[-i:]; i = 0
        e = min(n, i + len(s))
        if i >= n: return
        L[i:e] += s[:e - i] * g * math.cos((pan + 1) * math.pi / 4); R[i:e] += s[:e - i] * g * math.sin((pan + 1) * math.pi / 4)
    def env(Ln, a=0.003, d=None):
        x = np.arange(Ln) / SR; return np.minimum(1, x / a) * np.exp(-x / (d or Ln / SR / 4))
    lp = lambda x, k: np.convolve(x, np.ones(k) / k, 'same')
    def click(f): Ln = int(.06 * SR); x = np.arange(Ln) / SR; return np.sin(2 * np.pi * f * x) * env(Ln, .001, .015)
    def whoosh(d=0.9):
        Ln = int(d * SR); x = rng.standard_normal(Ln); y = lp(x, 40) - lp(x, 500); return y * np.sin(np.pi * np.arange(Ln) / Ln) ** 1.6 * 3.2
    def thud(): Ln = int(.35 * SR); x = np.arange(Ln) / SR; f = 90 - 50 * x / .35; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(Ln, .002, .08)
    def boom():
        Ln = int(1.4 * SR); x = np.arange(Ln) / SR; f = 70 * np.exp(-x * 3) + 38
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(Ln, .002, .35) + lp(rng.standard_normal(Ln), 30) * env(Ln, .001, .06)
    def riser(d):
        Ln = int(d * SR); x = np.arange(Ln) / SR; f = 300 + 1800 * (x / d) ** 2
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + (lp(rng.standard_normal(Ln), 8) - lp(rng.standard_normal(Ln), 200)) * 0.6
        return s * (x / d) ** 1.5 * np.minimum(1, (d - x) / 0.02)
    def chime():
        Ln = int(.9 * SR); x = np.arange(Ln) / SR; a = (np.sin(2 * np.pi * 1046 * x) + .4 * np.sin(2 * np.pi * 2093 * x)) * env(Ln, .002, .2)
        b = np.zeros(Ln); o = int(.09 * SR); b[o:] = (np.sin(2 * np.pi * 1568 * x[:Ln - o]) + .4 * np.sin(2 * np.pi * 3136 * x[:Ln - o])) * env(Ln - o, .002, .28)
        return a * .7 + b * .8
    def buzz(): Ln = int(.45 * SR); x = np.arange(Ln) / SR; return np.sign(np.sin(2 * np.pi * 110 * x)) * .5 * env(Ln, .003, .2)
    def bell(): Ln = int(1.2 * SR); x = np.arange(Ln) / SR; return (np.sin(2 * np.pi * 880 * x) + .4 * np.sin(2 * np.pi * 2217 * x)) * env(Ln, .002, .35)
    fr = [1400, 1700, 1900]; ci = 0; wi = 0
    for c in plan['cues']:
        k, t = c['k'], c['t']
        if k == 'click': add(t, click(fr[ci % 3]), .6); ci += 1
        elif k == 'whoosh': add(t, whoosh(), .55, [-0.5, 0.5][wi % 2]); wi += 1
        elif k == 'thud': add(t, thud(), .8)
        elif k == 'boom': add(t, boom(), 1.0)
        elif k == 'riser': add(t, riser(c.get('d', 0.8)), .45)
        elif k == 'chime': add(t, chime(), .45, 0.15)
        elif k == 'buzz': add(t, buzz(), .5)
        elif k == 'bell': add(t, bell(), .5)
    x = np.arange(n) / SR
    pad = (np.sin(2 * np.pi * 55 * x) + .5 * np.sin(2 * np.pi * 82.4 * x) + .3 * np.sin(2 * np.pi * 110 * x + 1)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.12 * x))
    pad *= np.minimum(1, x / 2) * np.minimum(1, (dur - x) / 2)
    fx = np.stack([L, R], 1); fx = fx / max(1e-9, np.abs(fx).max()) * 10 ** (-21 / 20)
    fx += np.stack([pad, pad], 1) * 10 ** (-37 / 20) / np.abs(pad).max()
    w = wave.open(str(out), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(fx, -1, 1) * 32767).astype('<i2').tobytes()); w.close()

# ---------------- main ----------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('spec'); ap.add_argument('--voice-file'); ap.add_argument('--words-file')
    ap.add_argument('--sheet', action='store_true', help='render a contact sheet only')
    ap.add_argument('--preview', action='store_true', help='fast 540px 15fps draft')
    ap.add_argument('--jobs', type=int, default=2); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--out', default=str(KIT / 'out'))
    a = ap.parse_args()
    spec = json.loads(Path(a.spec).read_text(encoding='utf-8'))
    name = re.sub(r'[^\w-]+', '_', spec.get('name') or Path(a.spec).stem)
    wd = KIT / 'work' / name; wd.mkdir(parents=True, exist_ok=True)
    if not (KIT / 'node_modules' / 'three').exists(): die('run "npm install" in the kit folder first')
    for f in ('index.html', 'scene.js'): shutil.copy(KIT / 'engine' / f, wd / f)
    nm = wd / 'node_modules'
    if not nm.exists(): os.symlink(KIT / 'node_modules', nm)
    voice = wd / 'voice.mp3'; wfile = wd / 'words.json'
    v = spec.get('voice', {})
    if a.voice_file: shutil.copy(a.voice_file, voice)
    elif not voice.exists():
        if not v.get('text') or not v.get('voice_id'): die('spec.voice.text and spec.voice.voice_id are required (or pass --voice-file)')
        print('Generating voice with ElevenLabs...'); tts(v['text'], v['voice_id'], v.get('model', 'eleven_v3'), voice)
    if a.words_file: shutil.copy(a.words_file, wfile)
    elif not wfile.exists():
        print('Getting word timings with ElevenLabs Scribe...'); scribe(voice, wfile)
    words = [w for w in json.loads(wfile.read_text())['words'] if w.get('type', 'word') == 'word']
    dur = round(audio_dur(voice) + 0.3, 2)
    plan = build_plan(spec, words, dur)
    (wd / 'plan.json').write_text(json.dumps(plan, ensure_ascii=False))
    print(f'plan ok: {len(plan["stations"])} scenes, {len(plan["chunks"])} subtitle chunks, {len(plan["cues"])} sound cues, {dur}s')
    if a.sheet:
        ts = []
        for i in range(len(plan['scenes']) - 1):
            s0, s1 = plan['scenes'][i], plan['scenes'][i + 1]
            ts += [round(s0 + (s1 - s0) * 0.35, 2), round(s1 - 1.05, 2)]
        sd = wd / 'sheet'; shutil.rmtree(sd, ignore_errors=True)
        run(['node', str(KIT / 'render.mjs'), str(wd), '0', '0', str(sd), '540', '30', ','.join(map(str, ts))])
        cols = min(8, len(ts)); rows = math.ceil(len(ts) / cols)
        Path(a.out).mkdir(parents=True, exist_ok=True); sheet = Path(a.out) / f'{name}_sheet.jpg'
        run(['ffmpeg', '-loglevel', 'error', '-y', '-pattern_type', 'glob', '-i', str(sd / 't_*.jpg'), '-filter_complex', f'tile={cols}x{rows}', '-frames:v', '1', str(sheet)])
        print('\nContact sheet:', sheet); return
    width, fps = (540, 15) if a.preview else (1080, a.fps)
    N = math.ceil(dur * fps); fd = wd / ('frames_prev' if a.preview else 'frames'); shutil.rmtree(fd, ignore_errors=True)
    step = math.ceil(N / a.jobs); procs = []
    for j in range(a.jobs):
        s, e = j * step, min(N, (j + 1) * step)
        if s < e: procs.append(subprocess.Popen(['node', str(KIT / 'render.mjs'), str(wd), str(s), str(e), str(fd), str(width), str(fps)]))
    if any(p.wait() for p in procs): die('rendering failed')
    print('Sound design...'); make_fx(plan, wd / 'fx.wav')
    run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(voice), '-i', str(wd / 'fx.wav'), '-filter_complex',
         f'[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo,apad[v];[1:a]apad[f];[v][f]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95,atrim=0:{dur}[a]',
         '-map', '[a]', '-ar', '44100', str(wd / 'mix.wav')])
    Path(a.out).mkdir(parents=True, exist_ok=True)
    mp4 = Path(a.out) / f'{name}{"_preview" if a.preview else ""}.mp4'
    run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', str(fd / '%05d.jpg'), '-i', str(wd / 'mix.wav'),
         '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', str(mp4)])
    print('\nDONE:', mp4)

if __name__ == '__main__':
    main()
