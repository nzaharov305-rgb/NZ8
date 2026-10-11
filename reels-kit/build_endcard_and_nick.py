import subprocess, wave, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 720, 1280, 30
SRC_DUR = 55.5
END_DUR = 5.0
TOTAL = SRC_DUR + END_DUR
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
NICK = "@nyrgun.ai"
PINK = (255, 61, 139)
YELLOW = (255, 212, 59)
CYAN = (34, 211, 238)
WHITE = (255, 255, 255)
BG = (5, 6, 10)

def font(path, size):
    return ImageFont.truetype(path, size)

def text_center(d, xy, s, f, fill):
    w = d.textlength(s, font=f)
    d.text((xy[0] - w / 2, xy[1]), s, font=f, fill=fill)

# ---------- 1. Nick overlay (for main part) ----------
def make_nick_png(path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(BOLD, 34)
    tw = d.textlength(NICK, font=f)
    pw, ph = tw + 56, 30 + 46
    x0 = (W - pw) / 2
    y0 = 1074
    d.rounded_rectangle([x0, y0, x0 + pw, y0 + ph], radius=ph / 2, fill=(0, 0, 0, 170))
    d.text((x0 + 28, y0 + 14), NICK, font=f, fill=WHITE)
    img.save(path)

# ---------- 2. End card frames ----------
LINES = [
    ("Поставь лайк", "чтобы не пропустить следующий"),
    ("Сохрани", "этот ролик, пригодится"),
    ("Подпишись", "на разборы ИИ каждый день"),
    ("Ссылка в профиле", "все инструменты из ролика"),
]

def endcard_frame(t):
    img = Image.new("RGB", (W, H), BG)
    # soft glow
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    r = 330 + 20 * math.sin(t * 3)
    gd.ellipse([W / 2 - r, 420 - r, W / 2 + r, 420 + r], fill=(40, 10, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    img = Image.blend(img, glow, 1.0)
    d = ImageDraw.Draw(img)

    # top badge (fade in 0-0.3s)
    a = min(1, t / 0.3)
    badge_col = tuple(int(BG[i] + (PINK[i] - BG[i]) * a) for i in range(3))
    fb = font(BOLD, 30)
    bw = d.textlength("КОГДА ШУМ", font=fb)
    d.rounded_rectangle([W / 2 - (bw + 40) / 2, 300, W / 2 + (bw + 40) / 2, 352], radius=26, fill=badge_col)
    text_center(d, (W / 2, 306), "КОГДА ШУМ", fb, WHITE)

    # headline
    fh = font(BOLD, 64)
    head_col = tuple(int(BG[i] + (WHITE[i] - BG[i]) * a) for i in range(3))
    text_center(d, (W / 2, 390), "ПОНРАВИЛСЯ", fh, head_col)
    text_center(d, (W / 2, 466), "РОЛИК?", fh, YELLOW)

    # CTA lines appear every 0.6s from t=0.7
    fl = font(BOLD, 40)
    fs = font(BOLD, 26)
    y = 540
    for i, (main, sub) in enumerate(LINES):
        t0 = 0.7 + i * 0.6
        if t < t0:
            y += 125
            continue
        p = min(1, (t - t0) / 0.35)
        ease = 1 - (1 - p) ** 3
        dx = (1 - ease) * 80
        alpha = ease
        col_main = tuple(int(BG[k] + (YELLOW[k] - BG[k]) * alpha) for k in range(3))
        col_sub = tuple(int(BG[k] + (CYAN[k] - BG[k]) * alpha) for k in range(3))
        # number chip
        cx = 90 + dx
        d.rounded_rectangle([cx, y + 8, cx + 52, y + 60], radius=12, fill=col_main)
        d.text((cx + 14, y + 12), str(i + 1), font=fl, fill=BG)
        d.text((cx + 72, y), main, font=fl, fill=col_main)
        d.text((cx + 72, y + 52), sub, font=fs, fill=col_sub)
        y += 125

    # nick big at the end (appears at t >= 3.9)
    if t >= 3.9:
        p = min(1, (t - 3.9) / 0.4)
        pulse = 1 + 0.04 * math.sin((t - 3.9) * 8) * (1 - p * 0.0)
        fn = font(BOLD, int(74 * pulse))
        col = tuple(int(BG[k] + (PINK[k] - BG[k]) * p) for k in range(3))
        text_center(d, (W / 2, 1090), NICK, fn, col)
    return img

def render_endcard(path):
    n = int(END_DUR * FPS)
    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", path],
        stdin=subprocess.PIPE)
    for i in range(n):
        ff.stdin.write(endcard_frame(i / FPS).tobytes())
    ff.stdin.close()
    ff.wait()

# ---------- 3. Synth sound effects ----------
SR = 44100

def env_exp(n, k):
    return np.exp(-np.arange(n) / SR * k)

def click(f=1700, dur=0.06, gain=0.7):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * env_exp(n, 60)
    return s * gain

def whoosh(dur=0.7, gain=0.5):
    n = int(SR * dur)
    noise = np.random.RandomState(1).uniform(-1, 1, n)
    # band-pass-ish sweep via moving average difference
    k = np.ones(8) / 8
    lp = np.convolve(noise, k, mode="same")
    env = np.sin(np.linspace(0, math.pi, n)) ** 1.5
    sweep = np.linspace(0.2, 1.0, n)
    return lp * env * sweep * gain

def bell(f=880, dur=0.9, gain=0.6):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t))
    return s * env_exp(n, 4) * gain

def thud(dur=0.35, gain=0.8):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 110 * np.exp(-t * 12) + 40
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * env_exp(n, 10) * gain

def place(track, snd, t):
    i = int(t * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(snd))
    track[i:j] += snd[: j - i]

def build_sfx(path):
    n = int(TOTAL * SR) + SR
    track = np.zeros(n)
    rng = random.Random(7)
    t0 = SRC_DUR
    # whoosh on entry
    place(track, whoosh(0.8, 0.45), t0)
    # thud on badge/headline
    place(track, thud(0.3, 0.5), t0 + 0.05)
    # clicks: headline and each CTA line
    place(track, click(1500, 0.05, 0.5), t0 + 0.35)
    for i in range(len(LINES)):
        tt = t0 + 0.7 + i * 0.6
        place(track, click(1400 + rng.randint(-60, 120), 0.06, 0.6), tt)
        place(track, click(1900 + rng.randint(-40, 60), 0.03, 0.25), tt + 0.12)  # tick
    # final nick: bell + whoosh
    place(track, whoosh(0.5, 0.35), t0 + 3.85)
    place(track, bell(880, 1.2, 0.55), t0 + 4.0)
    place(track, bell(1320, 1.0, 0.25), t0 + 4.02)
    # quiet pad under the end card
    tt = np.arange(int(END_DUR * SR)) / SR
    pad = 0.5 * np.sin(2 * np.pi * 110 * tt) + 0.3 * np.sin(2 * np.pi * 165 * tt)
    fade = np.minimum(1, tt / 0.8) * np.minimum(1, (END_DUR - tt) / 0.8)
    track[int(t0 * SR): int(t0 * SR) + len(pad)] += pad * fade * 0.05

    peak = np.max(np.abs(track)) or 1
    track = track / peak * 0.9
    data = (track * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())

if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    make_nick_png("nick.png")
    render_endcard("endcard.mp4")
    build_sfx("sfx.wav")
    print("assets ok")
