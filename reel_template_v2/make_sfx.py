# Синтез звуковых эффектов для ролика (вжух, щелчки, thud, ding). Тайминги берутся из слов озвучки.
# M(x): время слова в исходной озвучке -> время в ролике (ускорение 1.15 и задержка 0.25 с).
import numpy as np, wave
rng=np.random.default_rng(3)
sr=48000; total=45.0
buf=np.zeros(int(sr*total))
M=lambda x:x/1.15+0.25
def add(t,sig,g=1.0):
    i=int(t*sr)
    if i<0: return
    n=min(len(sig),len(buf)-i)
    if n>0: buf[i:i+n]+=sig[:n]*g
def tt(d): return np.arange(int(sr*d))/sr
def click(f=1700,d=.07):
    t=tt(d); return np.sin(2*np.pi*f*t)*np.exp(-t*55)
def whoosh(d=.55):
    t=tt(d); n=rng.standard_normal(len(t)); n=np.convolve(n,np.ones(24)/24,'same'); env=np.sin(np.pi*t/d)**2
    f=300+900*(t/d)**1.5; sw=np.sin(2*np.pi*np.cumsum(f)/sr)*.35
    return (n*1.6+sw)*env
def thud():
    t=tt(.5); return np.sin(2*np.pi*(60+40*np.exp(-t*20))*t)*np.exp(-t*9)
def ding(f=1320,d=.6):
    t=tt(d); return (np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*2*f*t))*np.exp(-t*6)
# ЗАМЕНИТЬ списки ниже на тайминги нового ролика:
SCENE_STARTS=[0.0,3.8,8.42,13.05,16.35,24.87,30.9,45.3]   # вжух
CLICKS=[5.0,5.813,10.336,11.02,12.0,20.68,22.053,23.387,32.24,37.02,40.48,45.333,46.62,47.4,30.92,31.337,31.73]
DINGS=[36.92,40.43,45.2]
for x in SCENE_STARTS: add(max(0,M(x)-.12) if x>0 else 0,whoosh(),.7)
for x in CLICKS: add(M(x),click(1800),.8)
for x in DINGS: add(M(x),ding(1568),.7)
add(M(15.577)-.05,thud(),1.0)
buf=buf/np.abs(buf).max()*0.1
w=wave.open('sfx.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((buf*32767).astype(np.int16).tobytes()); w.close()
